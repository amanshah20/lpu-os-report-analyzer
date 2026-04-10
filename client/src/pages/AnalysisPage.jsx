import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import ScoreRing from '../components/ScoreRing';
import GlassCard from '../components/GlassCard';
import SuggestionPanel from '../components/SuggestionPanel';
import SkeletonLoader from '../components/SkeletonLoader';
import useAnalysis from '../hooks/useAnalysis';
import { reportAPI } from '../services/api';
import { downloadBlob } from '../utils/fileHelpers';
import {
  getScoreColor, getAIUsageColor, getAIUsageLabel,
  getPlagiarismColor, SECTION_LABELS, SECTION_MAX,
  getSectionPercentage, formatDate,
} from '../utils/scoreHelpers';
import toast from 'react-hot-toast';
import { notifyReportsChanged } from '../utils/reportEvents';

const Badge = ({ label, value, color }) => (
  <div
    className="flex-1 rounded-xl border p-4 text-center min-w-32"
    style={{ borderColor: `${color}40`, backgroundColor: `${color}10` }}
  >
    <p className="text-xs text-text-secondary mb-1">{label}</p>
    <p className="font-bold text-lg" style={{ color }}>{value}</p>
  </div>
);

const SectionBar = ({ label, score, maxScore, index }) => {
  const pct = getSectionPercentage(score, label);
  const color = getScoreColor(Math.round(pct));

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="w-40 text-text-secondary text-xs flex-shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: index * 0.06 + 0.3 }}
        />
      </div>
      <div className="w-16 text-right">
        <span className="text-sm font-bold" style={{ color }}>{score}</span>
        <span className="text-text-secondary text-xs">/{maxScore}</span>
      </div>
    </motion.div>
  );
};

const AnalysisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchAnalysis, downloadAnalysisPDF } = useAnalysis();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [downloadingGeneratedReport, setDownloadingGeneratedReport] = useState(false);
  const [deletingGeneratedReport, setDeletingGeneratedReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState('');
  const [generatedMeta, setGeneratedMeta] = useState({ mode: '', provider: '', model: '', updatedAt: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchAnalysis(id);
        if (result) {
          setData(result);
          const existing = result.analysis?.generatedReportText || '';
          setGeneratedReport(existing);
          setGeneratedMeta({
            mode: result.analysis?.generatedReportMode || '',
            provider: result.analysis?.generatedReportProvider || '',
            model: result.analysis?.generatedReportModel || '',
            updatedAt: result.analysis?.generatedReportUpdatedAt || '',
          });
        }
      } catch (err) {
        toast.error('Failed to load analysis');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const analysis = data?.analysis;
  const report = data?.report;

  const handleSubmitToTeacher = async () => {
    setSubmitting(true);
    try {
      await reportAPI.submit(id);
      toast.success('Successfully submitted to teacher!');
      notifyReportsChanged({ action: 'report-submitted', reportId: id });
      setData((prev) => ({
        ...prev,
        report: { ...prev.report, status: 'submitted' },
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await downloadAnalysisPDF(id, `Analysis_${id}.pdf`);
    } catch {
      toast.error('PDF download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const response = await reportAPI.generateReportWithAI(id);
      if (response.data.success) {
        const generated = response.data.generatedReport;
        setGeneratedReport(generated.text || '');
        setGeneratedMeta({
          mode: generated.mode || '',
          provider: generated.provider || '',
          model: generated.model || '',
          updatedAt: generated.updatedAt || '',
        });

        setData((prev) => ({
          ...prev,
          analysis: {
            ...prev.analysis,
            generatedReportText: generated.text || '',
            generatedReportMode: generated.mode || '',
            generatedReportProvider: generated.provider || '',
            generatedReportModel: generated.model || '',
            generatedReportUpdatedAt: generated.updatedAt || '',
          },
        }));

        toast.success('Report generated successfully');
      }
    } catch (err) {
      const userMessage = err.response?.data?.message || 'Failed to generate report';
      const adminMessage = err.response?.data?.adminMessage || '';
      toast.error(userMessage);
      if (adminMessage) {
        toast.error(adminMessage, { duration: 5000 });
      }
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCopyGeneratedReport = async () => {
    if (!generatedReport) {
      toast.error('No generated report available');
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedReport);
      toast.success('Generated report copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleDownloadGeneratedReportPDF = async () => {
    if (!generatedReport) {
      toast.error('No generated report available');
      return;
    }

    try {
      setDownloadingGeneratedReport(true);
      const response = await reportAPI.downloadGeneratedReport(id);
      downloadBlob(response.data, `Generated_Report_${id}.pdf`);
      toast.success('Generated report PDF downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download generated report PDF');
    } finally {
      setDownloadingGeneratedReport(false);
    }
  };

  const handleDeleteGeneratedReport = async () => {
    if (!generatedReport) {
      toast.error('No generated report to delete');
      return;
    }

    const confirmed = window.confirm('Delete generated report? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingGeneratedReport(true);
      await reportAPI.deleteGeneratedReport(id);

      setGeneratedReport('');
      setGeneratedMeta({ mode: '', provider: '', model: '', updatedAt: '' });
      setData((prev) => ({
        ...prev,
        analysis: {
          ...prev.analysis,
          generatedReportText: '',
          generatedReportMode: '',
          generatedReportProvider: '',
          generatedReportModel: '',
          generatedReportUpdatedAt: null,
        },
      }));

      toast.success('Generated report deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete generated report');
    } finally {
      setDeletingGeneratedReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-64 pt-16">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <SkeletonLoader type="analysis" />
          </div>
        </main>
      </div>
    );
  }

  if (!analysis) return null;

  const scoreColor = getScoreColor(analysis.totalScore);
  const aiColor = getAIUsageColor(analysis.aiUsagePercentage);
  const plagColor = getPlagiarismColor(analysis.plagiarismRisk);
  const analysisMode = analysis.analysisMode || 'ai';
  const sourceLabel = analysisMode === 'local'
    ? 'Local fallback analysis'
    : `AI analysis${analysis.aiProvider ? ` (${analysis.aiProvider})` : ''}`;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sections', label: 'Sections' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'suggestions', label: 'Suggestions' },
    { id: 'generated-report', label: 'Generate Report with AI' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                <button onClick={() => navigate(-1)} className="hover:text-white transition-colors">← Back</button>
                <span>/</span>
                <span>Analysis Result</span>
              </div>
              <h1 className="text-white text-2xl font-bold truncate">
                {report?.fileName || 'Report Analysis'}
              </h1>
              <p className="text-text-secondary text-sm mt-0.5">
                {report?.fileType?.toUpperCase()} · {formatDate(report?.createdAt)} ·
                <span className="ml-1 capitalize">{report?.submissionType} mode</span>
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="btn-secondary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
              >
                {downloading ? (
                  <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                Download PDF
              </button>

              {report?.submissionType === 'self' && report?.status !== 'submitted' && (
                <button
                  onClick={handleSubmitToTeacher}
                  disabled={submitting}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                  ) : '📤'}
                  Submit to Teacher
                </button>
              )}

              {report?.status === 'submitted' && (
                <span className="text-sm px-4 py-2 rounded-button bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-2">
                  ✅ Submitted
                </span>
              )}

              <button
                onClick={() => navigate('/upload')}
                className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Upload New
              </button>
            </div>
          </motion.div>

          {/* Score hero */}
          <GlassCard className="mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Score ring */}
              <div className="flex-shrink-0">
                <ScoreRing score={analysis.totalScore} size={160} strokeWidth={12} />
              </div>

              {/* Badges */}
              <div className="flex-1 w-full">
                <h2 className="text-white font-semibold text-xl mb-4">Analysis Summary</h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge
                    label="Format Compliance"
                    value={`${analysis.formatCompliance}%`}
                    color="#6366f1"
                  />
                  <Badge
                    label={getAIUsageLabel(analysis.aiUsagePercentage)}
                    value={`${analysis.aiUsagePercentage}%`}
                    color={aiColor}
                  />
                  <Badge
                    label="Plagiarism Risk"
                    value={analysis.plagiarismRisk}
                    color={plagColor}
                  />
                </div>
                <div className="mb-3">
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${analysisMode === 'local'
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    Source: {sourceLabel}
                  </span>
                </div>
                {analysis.cached && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Result loaded from cache (no new API call)
                  </div>
                )}
                {analysisMode === 'local' && analysis.fallbackReason && (
                  <p className="text-text-secondary text-xs mt-2">
                    AI request failed, so local fallback was used.
                  </p>
                )}
                <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                  {analysis.overallFeedback}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 glass rounded-xl border border-white/10 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                className="space-y-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Strengths */}
                {analysis.strengths?.length > 0 && (
                  <GlassCard>
                    <h3 className="text-green-400 font-semibold text-lg mb-4 flex items-center gap-2">
                      <span>✅</span> Strengths ({analysis.strengths.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysis.strengths.map((s, i) => (
                        <motion.div
                          key={i}
                          className="glass rounded-lg border border-green-500/20 p-3 flex items-start gap-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                        >
                          <span className="text-green-400 text-sm flex-shrink-0 mt-0.5">✓</span>
                          <p className="text-white text-sm leading-relaxed">{s}</p>
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Missing sections */}
                {analysis.missingSections?.length > 0 && (
                  <GlassCard>
                    <h3 className="text-red-400 font-semibold text-lg mb-4 flex items-center gap-2">
                      <span>❌</span> Missing Sections ({analysis.missingSections.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {analysis.missingSections.map((s, i) => (
                        <motion.div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                        >
                          <span className="text-red-400">✗</span>
                          <span className="text-white text-sm">{s}</span>
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Mistakes */}
                {analysis.mistakes?.length > 0 && (
                  <GlassCard>
                    <h3 className="text-amber-400 font-semibold text-lg mb-4 flex items-center gap-2">
                      <span>⚠️</span> Mistakes Found ({analysis.mistakes.length})
                    </h3>
                    <div className="space-y-2">
                      {analysis.mistakes.map((m, i) => (
                        <motion.div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                        >
                          <span className="text-amber-400 text-sm flex-shrink-0 mt-0.5">{i + 1}.</span>
                          <span className="text-white text-sm leading-relaxed">{m}</span>
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            )}

            {/* Sections Tab */}
            {activeTab === 'sections' && (
              <motion.div
                key="sections"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <GlassCard>
                  <h3 className="text-white font-semibold text-lg mb-6">Section Scores Breakdown</h3>
                  <div className="space-y-4">
                    {Object.entries(analysis.sectionScores || {}).map(([key, score], i) => (
                      <SectionBar
                        key={key}
                        label={SECTION_LABELS[key] || key}
                        score={score}
                        maxScore={SECTION_MAX[key] || 10}
                        index={i}
                      />
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <motion.div
                key="feedback"
                className="space-y-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <GlassCard>
                  <h3 className="text-white font-semibold text-lg mb-4">Overall Feedback</h3>
                  <p className="text-text-secondary leading-relaxed">{analysis.overallFeedback}</p>
                </GlassCard>

                <GlassCard>
                  <h3 className="text-white font-semibold text-lg mb-4">Detailed Improvement Guide</h3>
                  {analysis.improvements?.length ? (
                    <div className="space-y-3">
                      {analysis.improvements.map((item, i) => (
                        <div key={i} className="p-3 rounded-lg border border-blue-500/25 bg-blue-500/8">
                          <p className="text-white text-sm leading-relaxed">
                            <span className="text-blue-300 font-semibold mr-2">Step {i + 1}:</span>
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-secondary text-sm">No improvement guidance available.</p>
                  )}
                </GlassCard>

                <GlassCard>
                  <h3 className="text-white font-semibold text-lg mb-4">AI Usage Assessment</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="text-3xl font-bold"
                      style={{ color: aiColor }}
                    >
                      {analysis.aiUsagePercentage}%
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: aiColor }}>
                        {getAIUsageLabel(analysis.aiUsagePercentage)}
                      </p>
                      <p className="text-text-secondary text-sm">AI-generated content detected</p>
                    </div>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {analysis.aiUsageDetails}
                  </p>
                </GlassCard>
              </motion.div>
            )}

            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <motion.div
                key="suggestions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <GlassCard>
                  <SuggestionPanel improvements={analysis.improvements || []} />
                </GlassCard>
              </motion.div>
            )}

            {activeTab === 'generated-report' && (
              <motion.div
                key="generated-report"
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <GlassCard>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h3 className="text-white font-semibold text-lg">Final Report Generator</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                        className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
                      >
                        {generatingReport ? 'Generating...' : generatedReport ? 'Regenerate with AI' : 'Generate Report with AI'}
                      </button>
                      <button
                        onClick={handleCopyGeneratedReport}
                        disabled={!generatedReport}
                        className="btn-secondary text-sm px-4 py-2 disabled:opacity-50"
                      >
                        Copy Report
                      </button>
                      <button
                        onClick={handleDownloadGeneratedReportPDF}
                        disabled={!generatedReport || downloadingGeneratedReport}
                        className="btn-secondary text-sm px-4 py-2 disabled:opacity-50"
                      >
                        {downloadingGeneratedReport ? 'Downloading...' : 'Download PDF'}
                      </button>
                      <button
                        onClick={handleDeleteGeneratedReport}
                        disabled={!generatedReport || deletingGeneratedReport}
                        className="text-sm px-4 py-2 rounded-button border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {deletingGeneratedReport ? 'Deleting...' : 'Delete Generated Report'}
                      </button>
                    </div>
                  </div>

                  {generatedMeta.mode && (
                    <div className="flex flex-wrap gap-2 mb-4 text-xs">
                      <span className={`px-3 py-1 rounded-full border ${generatedMeta.mode === 'local' ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'}`}>
                        Source: {generatedMeta.mode === 'local' ? 'Local Fallback' : 'AI'}
                      </span>
                      {generatedMeta.provider && (
                        <span className="px-3 py-1 rounded-full border bg-white/5 text-text-secondary border-white/20">
                          Provider: {generatedMeta.provider}
                        </span>
                      )}
                      {generatedMeta.model && (
                        <span className="px-3 py-1 rounded-full border bg-white/5 text-text-secondary border-white/20">
                          Model: {generatedMeta.model}
                        </span>
                      )}
                    </div>
                  )}

                  {generatedReport ? (
                    <textarea
                      value={generatedReport}
                      onChange={(e) => setGeneratedReport(e.target.value)}
                      className="w-full min-h-[420px] lpu-input text-sm leading-relaxed"
                    />
                  ) : (
                    <div className="text-center py-12 border border-white/10 rounded-xl bg-white/3">
                      <p className="text-white font-medium">No generated report yet</p>
                      <p className="text-text-secondary text-sm mt-1">Click "Generate Report with AI" to create a report in required LPU format.</p>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AnalysisPage;
