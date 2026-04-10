import { useState, useCallback } from 'react';
import { reportAPI } from '../services/api';
import toast from 'react-hot-toast';

const useUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedReport, setUploadedReport] = useState(null);
  const [error, setError] = useState(null);

  const uploadFile = useCallback(async (file, submissionType = 'self') => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('report', file);
      formData.append('submissionType', submissionType);

      const response = await reportAPI.upload(formData, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setUploadProgress(pct);
      });

      if (response.data.success) {
        setUploadedReport(response.data.report);
        toast.success('File uploaded successfully!');
        return response.data.report;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Upload failed. Please try again.';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUploadedReport(null);
    setUploadProgress(0);
    setError(null);
  }, []);

  return {
    uploading,
    uploadProgress,
    uploadedReport,
    error,
    uploadFile,
    reset,
  };
};

export default useUpload;
