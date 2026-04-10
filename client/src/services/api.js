import axios from 'axios';

const BASE_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and auto-refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  sendOTP: (email) => api.post('/auth/send-otp', { email }),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
};

// Student API
export const studentAPI = {
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.put('/student/profile', data),
  getReports: (params) => api.get('/student/reports', { params }),
  getStats: () => api.get('/student/stats'),
  getAnalyses: () => api.get('/student/analyses'),
  getAnalysis: (id) => api.get(`/student/analysis/${id}`),
};

// Report API
export const reportAPI = {
  upload: (formData, onUploadProgress) =>
    api.post('/report/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  analyse: (id) => api.post(`/report/analyse/${id}`),
  getAnalysis: (id) => api.get(`/report/analysis/${id}`),
  generateReportWithAI: (id) => api.post(`/report/generate-report/${id}`),
  submit: (id) => api.post(`/report/submit/${id}`),
  deleteReport: (id) => api.delete(`/report/${id}`),
  downloadAnalysis: (id) =>
    api.get(`/report/download/analysis/${id}`, { responseType: 'blob' }),
  downloadGeneratedReport: (id) =>
    api.get(`/report/download/generated-report/${id}`, { responseType: 'blob' }),
  deleteGeneratedReport: (id) => api.delete(`/report/generated-report/${id}`),
};

// Teacher API
export const teacherAPI = {
  getSubmissions: (params) => api.get('/teacher/submissions', { params }),
  getSubmission: (id) => api.get(`/teacher/submission/${id}`),
  getStats: () => api.get('/teacher/stats'),
  downloadReport: (id) =>
    api.get(`/teacher/download/report/${id}`, { responseType: 'blob' }),
  downloadAnalysis: (id) =>
    api.get(`/teacher/download/analysis/${id}`, { responseType: 'blob' }),
  downloadZip: (id) =>
    api.get(`/teacher/download/zip/${id}`, { responseType: 'blob' }),
};

export default api;
