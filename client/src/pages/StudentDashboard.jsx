import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import { reportAPI, studentAPI } from '../services/api';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import ScoreRing from '../components/ScoreRing';
import AnalysisCard from '../components/AnalysisCard';
import AnimatedCounter from '../components/AnimatedCounter';
import SkeletonLoader from '../components/SkeletonLoader';
import { formatDate } from '../utils/scoreHelpers';
import { notifyReportsChanged, subscribeReportsChanged } from '../utils/reportEvents';

const StatCard = ({ label, value, icon, color, suffix = '', delay = 0 }) => (
  <GlassCard delay={delay} hover className="relative overflow-hidden">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-text-secondary text-sm mb-2">{label}</p>
        <p className="text-white text-3xl font-bold">
          <AnimatedCounter end={value} suffix={suffix} />
        </p>
      </div>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
      >
        {icon}
      </div>
    </div>
    {/* Background glow */}
    <div
      className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-xl opacity-20"
      style={{ backgroundColor: color }}
    />
  </GlassCard>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        studentAPI.getStats(),
        studentAPI.getReports({ limit: 5 }),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (reportsRes.data.success) {
        setRecentReports(reportsRes.data.reports);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const unsubscribe = subscribeReportsChanged(() => {
      fetchData();
    });

    const onFocus = () => {
      fetchData();
    };

    const intervalId = window.setInterval(() => {
      fetchData();
    }, 10000);

    window.addEventListener('focus', onFocus);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocus);
      window.clearInterval(intervalId);
    };
  }, [fetchData]);

  const handleDeleteReport = async (report) => {
    if (!window.confirm(`Delete report \"${report.originalName || report.fileName}\"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(report._id);
      await reportAPI.deleteReport(report._id);
      toast.success('Report deleted');
      notifyReportsChanged({ action: 'report-deleted', reportId: report._id });
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete report');
    } finally {
      setDeletingId(null);
    }
  };

  const statCards = stats ? [
    { label: 'Total Reports', value: stats.totalReports, icon: '📄', color: '#6366f1', delay: 0 },
    { label: 'Average Score', value: stats.averageScore, icon: '🎯', color: '#E07B39', suffix: '/100', delay: 0.1 },
    { label: 'Submitted', value: stats.submittedReports, icon: '✅', color: '#22c55e', delay: 0.2 },
    { label: 'AI Suggestions', value: stats.totalSuggestions, icon: '💡', color: '#F5A623', delay: 0.3 },
  ] : [];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-64 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-white text-2xl sm:text-3xl font-bold">
              Welcome back, {user?.fullName?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {user?.registrationNumber && `Reg: ${user.registrationNumber} · `}
              {user?.section && `Section ${user.section} · `}
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </motion.div>

          {loading ? (
            <SkeletonLoader type="dashboard" />
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card) => (
                  <StatCard key={card.label} {...card} />
                ))}
              </div>

              {/* Main content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent reports */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold text-lg">Recent Reports</h2>
                    <button
                      onClick={() => navigate('/history')}
                      className="text-primary-400 text-sm hover:text-primary-300 transition-colors"
                    >
                      View all →
                    </button>
                  </div>

                  {recentReports.length === 0 ? (
                    <GlassCard className="text-center py-12">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-white font-semibold">No reports yet</p>
                      <p className="text-text-secondary text-sm mt-1 mb-4">Upload your first OS lab report to get started</p>
                      <button
                        onClick={() => navigate('/upload')}
                        className="btn-primary text-sm px-5 py-2.5"
                      >
                        Upload Report
                      </button>
                    </GlassCard>
                  ) : (
                    <div className="space-y-3">
                      {recentReports.map((report, i) => (
                        <AnalysisCard
                          key={report._id}
                          report={report}
                          index={i}
                          onDelete={handleDeleteReport}
                          deleting={deletingId === report._id}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-6">
                  {/* Score overview */}
                  <GlassCard>
                    <h3 className="text-white font-semibold mb-4">Average Performance</h3>
                    <div className="flex flex-col items-center">
                      <ScoreRing score={stats?.averageScore || 0} size={140} />
                      <p className="text-text-secondary text-xs mt-3 text-center">
                        Based on {stats?.totalReports || 0} report{stats?.totalReports !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </GlassCard>

                  {/* Quick actions */}
                  <GlassCard>
                    <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => navigate('/upload')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-500/10 border border-primary-500/20 hover:bg-primary-500/20 transition-all text-white text-sm font-medium"
                      >
                        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload New Report
                      </button>
                      <button
                        onClick={() => navigate('/history')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white text-sm font-medium"
                      >
                        <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View All History
                      </button>
                      <button
                        onClick={() => navigate('/profile')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white text-sm font-medium"
                      >
                        <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Manage Profile
                      </button>
                    </div>
                  </GlassCard>

                  {/* Profile completion */}
                  {!user?.profileComplete && (
                    <GlassCard className="border-amber-500/30">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div>
                          <p className="text-white text-sm font-semibold">Profile Incomplete</p>
                          <p className="text-text-secondary text-xs mt-0.5 mb-3">Complete your profile to unlock all features</p>
                          <button
                            onClick={() => navigate('/profile')}
                            className="text-xs btn-primary px-3 py-1.5"
                          >
                            Complete Profile
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  )}
                </div>
              </div>

              {/* Activity timeline */}
              {recentReports.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-white font-semibold text-lg mb-4">Recent Activity</h2>
                  <GlassCard>
                    <div className="space-y-4">
                      {recentReports.map((report, i) => (
                        <motion.div
                          key={report._id}
                          className="flex items-start gap-4"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-sm">
                              {report.status === 'submitted' ? '✅' : report.status === 'analysed' ? '🔍' : '📤'}
                            </div>
                            {i < recentReports.length - 1 && (
                              <div className="absolute top-10 left-5 w-px h-full bg-white/10" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pb-4">
                            <p className="text-white text-sm font-medium truncate">
                              {report.originalName || report.fileName}
                            </p>
                            <p className="text-text-secondary text-xs">
                              {report.status === 'submitted' ? 'Submitted to teacher' : report.status === 'analysed' ? 'Analysed by AI' : 'Uploaded'} · {formatDate(report.createdAt)}
                            </p>
                          </div>
                          {report.analysisId?.totalScore !== undefined && (
                            <span
                              className="text-sm font-bold flex-shrink-0"
                              style={{ color: '#E07B39' }}
                            >
                              {report.analysisId.totalScore}/100
                            </span>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
