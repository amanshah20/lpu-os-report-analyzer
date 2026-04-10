import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import ReportTable from '../components/ReportTable';
import SkeletonLoader from '../components/SkeletonLoader';
import ScoreRing from '../components/ScoreRing';
import AnimatedCounter from '../components/AnimatedCounter';
import { teacherAPI } from '../services/api';
import { getScoreColor, getAIUsageColor, SECTION_LABELS, SECTION_MAX, getSectionPercentage, formatDate, formatDateTime } from '../utils/scoreHelpers';
import toast from 'react-hot-toast';
import { subscribeReportsChanged } from '../utils/reportEvents';

const StatCard = ({ label, value, icon, color, suffix = '', delay = 0 }) => (
  <GlassCard delay={delay} className="relative overflow-hidden">
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
    <div
      className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-xl opacity-15"
      style={{ backgroundColor: color }}
    />
  </GlassCard>
);

const SubmissionDetailModal = ({ submission, onClose }) => {
  if (!submission) return null;
  const student = submission.studentId || {};
  const analysis = submission.analysisId || {};
  const score = analysis.totalScore ?? null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative glass rounded-2xl border border-white/15 w-full max-w-3xl mb-8 shadow-lpu-lg"
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">Submission Detail</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Student info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Student', value: student.fullName || 'N/A' },
                { label: 'Reg No.', value: student.registrationNumber || 'N/A' },
                { label: 'Roll No.', value: student.rollNumber || 'N/A' },
                { label: 'Section', value: student.section ? `Section ${student.section}` : 'N/A' },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-text-secondary text-xs mb-1">{f.label}</p>
                  <p className="text-white text-sm font-semibold">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Score */}
            {score !== null && (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreRing score={score} size={120} />
                <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                  {[
                    { label: 'Format Compliance', value: `${analysis.formatCompliance || 0}%`, color: '#6366f1' },
                    { label: 'AI Usage', value: `${analysis.aiUsagePercentage || 0}%`, color: getAIUsageColor(analysis.aiUsagePercentage || 0) },
                    { label: 'Plagiarism Risk', value: analysis.plagiarismRisk || 'N/A', color: analysis.plagiarismRisk === 'High' ? '#ef4444' : analysis.plagiarismRisk === 'Medium' ? '#f59e0b' : '#22c55e' },
                    { label: 'Submitted', value: formatDate(submission.teacherSubmittedAt || submission.createdAt), color: '#A0A0B0' },
                  ].map((f) => (
                    <div key={f.label} className="glass rounded-lg p-3 border border-white/10">
                      <p className="text-text-secondary text-xs mb-1">{f.label}</p>
                      <p className="font-semibold text-sm" style={{ color: f.color }}>{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overall feedback */}
            {analysis.overallFeedback && (
              <div>
                <p className="text-text-secondary text-sm mb-2">Overall Feedback</p>
                <p className="text-white text-sm leading-relaxed bg-white/3 rounded-lg p-3 border border-white/5">
                  {analysis.overallFeedback}
                </p>
              </div>
            )}

            {/* AI Usage Details */}
            {analysis.aiUsageDetails && (
              <div>
                <p className="text-text-secondary text-sm mb-2">AI Usage Assessment</p>
                <p className="text-white text-sm leading-relaxed bg-white/3 rounded-lg p-3 border border-white/5">
                  {analysis.aiUsageDetails}
                </p>
              </div>
            )}

            {/* Section scores */}
            {analysis.sectionScores && (
              <div>
                <p className="text-white font-semibold mb-3">Section Scores</p>
                <div className="space-y-2">
                  {Object.entries(analysis.sectionScores).map(([key, val]) => {
                    const max = SECTION_MAX[key] || 10;
                    const pct = getSectionPercentage(val, key);
                    const color = getScoreColor(pct);
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-text-secondary text-xs w-36 flex-shrink-0">{SECTION_LABELS[key] || key}</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-xs font-medium w-12 text-right" style={{ color }}>
                          {val}/{max}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const TeacherDashboard = () => {
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    section: '',
    minScore: '',
    maxScore: '',
    aiUsageLevel: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const [statsRes, submissionsRes] = await Promise.all([
        teacherAPI.getStats(),
        teacherAPI.getSubmissions({
          ...filters,
          limit: 20,
        }),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (submissionsRes.data.success) {
        setSubmissions(submissionsRes.data.submissions);
        setPagination(submissionsRes.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    fetchData(true);

    const unsubscribe = subscribeReportsChanged(() => {
      fetchData(false);
    });

    const onFocus = () => {
      fetchData(false);
    };

    const intervalId = window.setInterval(() => {
      fetchData(false);
    }, 10000);

    window.addEventListener('focus', onFocus);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocus);
      window.clearInterval(intervalId);
    };
  }, [fetchData]);

  const statCards = stats ? [
    { label: 'Total Submissions', value: stats.totalSubmissions, icon: '📥', color: '#6366f1', delay: 0 },
    { label: 'Avg Class Score', value: stats.averageScore, icon: '📊', color: '#E07B39', suffix: '/100', delay: 0.1 },
    { label: 'Pending Review', value: stats.pendingReviews, icon: '⏳', color: '#f59e0b', delay: 0.2 },
    { label: 'High AI Alerts', value: stats.highAIAlerts, icon: '🚨', color: '#ef4444', delay: 0.3 },
  ] : [];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

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
            <h1 className="text-white text-2xl sm:text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-text-secondary text-sm mt-1">
              Monitor student submissions and AI analysis results
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loading ? (
              Array(4).fill(0).map((_, i) => <SkeletonLoader key={i} type="card" />)
            ) : (
              statCards.map((card) => <StatCard key={card.label} {...card} />)
            )}
          </div>

          {/* Section breakdown */}
          {stats?.sectionStats?.length > 0 && (
            <GlassCard className="mb-6">
              <h2 className="text-white font-semibold mb-4">Submissions by Section</h2>
              <div className="flex flex-wrap gap-3">
                {stats.sectionStats.map((s) => (
                  <div key={s._id} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-primary-400 font-bold">Section {s._id || '?'}</span>
                    <span className="text-white font-semibold">{s.count}</span>
                    <span className="text-text-secondary text-xs">submissions</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Filters */}
          <GlassCard className="mb-6">
            <h2 className="text-white font-semibold mb-4">Filter Submissions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              <select
                value={filters.section}
                onChange={(e) => handleFilterChange('section', e.target.value)}
                className="lpu-input text-sm"
              >
                <option value="" className="bg-secondary-500">All Sections</option>
                {['A', 'B', 'C', 'D', 'E'].map((s) => (
                  <option key={s} value={s} className="bg-secondary-500">Section {s}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Min score"
                value={filters.minScore}
                onChange={(e) => handleFilterChange('minScore', e.target.value)}
                className="lpu-input text-sm"
                min="0" max="100"
              />

              <input
                type="number"
                placeholder="Max score"
                value={filters.maxScore}
                onChange={(e) => handleFilterChange('maxScore', e.target.value)}
                className="lpu-input text-sm"
                min="0" max="100"
              />

              <select
                value={filters.aiUsageLevel}
                onChange={(e) => handleFilterChange('aiUsageLevel', e.target.value)}
                className="lpu-input text-sm"
              >
                <option value="" className="bg-secondary-500">All AI Levels</option>
                <option value="high" className="bg-secondary-500">High AI (&gt;70%)</option>
                <option value="medium" className="bg-secondary-500">Medium AI (40-70%)</option>
                <option value="low" className="bg-secondary-500">Low AI (&lt;40%)</option>
              </select>

              <button
                onClick={() => setFilters({ section: '', minScore: '', maxScore: '', aiUsageLevel: '', page: 1 })}
                className="btn-secondary text-sm px-4"
              >
                Clear Filters
              </button>
            </div>
          </GlassCard>

          {/* Submissions table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">
                Student Submissions
                <span className="ml-2 text-sm text-text-secondary">({pagination.total} total)</span>
              </h2>
            </div>

            {loading ? (
              <SkeletonLoader type="table" rows={6} />
            ) : (
              <ReportTable
                submissions={submissions}
                onViewDetail={(sub) => setSelectedSubmission(sub)}
              />
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  disabled={filters.page === 1}
                  className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-text-secondary text-sm">
                  Page {filters.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  disabled={filters.page === pagination.pages}
                  className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Average score chart */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard>
                <h2 className="text-white font-semibold mb-4">Class Performance Overview</h2>
                <div className="flex items-center justify-center">
                  <ScoreRing
                    score={stats.averageScore || 0}
                    size={160}
                    showLabel
                  />
                </div>
                <p className="text-text-secondary text-sm text-center mt-4">
                  Average score across {stats.totalSubmissions} submission{stats.totalSubmissions !== 1 ? 's' : ''}
                </p>
              </GlassCard>

              <GlassCard>
                <h2 className="text-white font-semibold mb-4">Quick Stats</h2>
                <div className="space-y-4">
                  {[
                    { label: 'High AI Usage Alerts', value: stats.highAIAlerts, max: stats.totalSubmissions, color: '#ef4444' },
                    { label: 'Pending Reviews', value: stats.pendingReviews, max: stats.totalSubmissions, color: '#f59e0b' },
                    { label: 'Average Score', value: stats.averageScore, max: 100, color: '#E07B39' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-secondary">{item.label}</span>
                        <span className="text-white font-semibold">{item.value}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </main>

      {/* Submission detail modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
