import { useState, useCallback } from 'react';
import { reportAPI } from '../services/api';
import toast from 'react-hot-toast';

const useAnalysis = () => {
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);

  const analyseReport = useCallback(async (reportId) => {
    setAnalysing(true);
    setError(null);

    try {
      const response = await reportAPI.analyse(reportId);

      if (response.data.success) {
        setAnalysis(response.data.analysis);
        setCached(response.data.cached || false);
        if (response.data.cached) {
          toast.success('Analysis loaded from cache!');
        } else {
          toast.success('AI analysis completed!');
        }
        return response.data.analysis;
      }
    } catch (err) {
      const message = 'Sorry, analysis failed. Please try again.';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setAnalysing(false);
    }
  }, []);

  const fetchAnalysis = useCallback(async (reportId) => {
    try {
      const response = await reportAPI.getAnalysis(reportId);
      if (response.data.success) {
        setAnalysis(response.data.analysis);
        return response.data;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch analysis';
      setError(message);
      throw err;
    }
  }, []);

  const downloadAnalysisPDF = useCallback(async (reportId, fileName = 'analysis.pdf') => {
    try {
      const response = await reportAPI.downloadAnalysis(reportId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch (err) {
      toast.error('Failed to download PDF');
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setCached(false);
  }, []);

  return {
    analysing,
    analysis,
    error,
    cached,
    analyseReport,
    fetchAnalysis,
    downloadAnalysisPDF,
    reset,
  };
};

export default useAnalysis;
