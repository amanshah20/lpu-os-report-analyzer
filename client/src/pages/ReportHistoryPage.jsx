import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import AnalysisCard from '../components/AnalysisCard';
import SkeletonLoader from '../components/SkeletonLoader';
import GlassCard from '../components/GlassCard';
import { reportAPI, studentAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { notifyReportsChanged, subscribeReportsChanged } from '../utils/reportEvents';

const ReportHistoryPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filter, setFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const fetchReports = async (page = 1, status = 'all') => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (status !== 'all') params.status = status;

      const res = await studentAPI.getReports(params);
      if (res.data.success) {
        setReports(res.data.reports);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1, filter);

    const unsubscribe = subscribeReportsChanged(() => {
      fetchReports(pagination.page || 1, filter);
    });

    return () => {
      unsubscribe();
    };
  }, [filter, pagination.page]);

  const handleDeleteReport = async (report) => {
    if (!window.confirm(`Delete report \"${report.originalName || report.fileName}\"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(report._id);
      await reportAPI.deleteReport(report._id);
      toast.success('Report deleted');
      notifyReportsChanged({ action: 'report-deleted', reportId: report._id });

      const targetPage = reports.length === 1 && pagination.page > 1
        ? pagination.page - 1
        : pagination.page;
      await fetchReports(targetPage, filter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete report');
    } finally {
      setDeletingId(null);
    }
  };

  const FILTERS = [
    { id: 'all', label: 'All Reports' },
    { id: 'uploaded', label: 'Uploaded' },
    { id: 'analysed', label: 'Analysed' },
    { id: 'submitted', label: 'Submitted' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <motion.div
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h1 className="text-white text-2xl sm:text-3xl font-bold">Report History</h1>
              <p className="text-text-secondary text-sm mt-1">
                All your uploaded OS lab reports · {pagination.total} total
              </p>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload New
            </button>
          </motion.div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-button text-sm font-medium transition-all border ${
                  filter === f.id
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white/5 text-text-secondary border-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Reports grid */}
          {loading ? (
            <SkeletonLoader type="dashboard" />
          ) : reports.length === 0 ? (
            <GlassCard className="text-center py-16">
              <div className="text-5xl mb-4">📂</div>
              <h3 className="text-white font-semibold text-lg">No reports found</h3>
              <p className="text-text-secondary text-sm mt-1 mb-5">
                {filter === 'all' ? 'Upload your first lab report to get started' : `No ${filter} reports`}
              </p>
              <button onClick={() => navigate('/upload')} className="btn-primary text-sm px-6">
                Upload Report
              </button>
            </GlassCard>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((report, i) => (
                  <AnalysisCard
                    key={report._id}
                    report={report}
                    index={i}
                    onDelete={handleDeleteReport}
                    deleting={deletingId === report._id}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => fetchReports(pagination.page - 1, filter)}
                    disabled={pagination.page === 1}
                    className="btn-secondary text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <span className="text-text-secondary text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => fetchReports(pagination.page + 1, filter)}
                    disabled={pagination.page === pagination.pages}
                    className="btn-secondary text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportHistoryPage;
