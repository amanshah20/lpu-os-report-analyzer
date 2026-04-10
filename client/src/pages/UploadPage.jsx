import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import UploadZone from '../components/UploadZone';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import useUpload from '../hooks/useUpload';
import useAnalysis from '../hooks/useAnalysis';
import toast from 'react-hot-toast';
import { notifyReportsChanged } from '../utils/reportEvents';

const SUBMISSION_MODES = [
  {
    id: 'self',
    title: 'Self Analysis',
    icon: '🔍',
    description: 'AI analyses your report and you review the results before deciding to submit to your teacher.',
    features: ['Immediate AI feedback', 'Review before submitting', 'Download analysis PDF', 'Control over submission'],
    color: '#6366f1',
  },
  {
    id: 'direct',
    title: 'Direct Submit',
    icon: '🚀',
    description: 'AI analyses your report and automatically submits both the report and analysis to your teacher.',
    features: ['Instant submission', 'Teacher notified automatically', 'AI analysis included', 'No manual steps'],
    color: '#E07B39',
  },
];

const UploadPage = () => {
  const navigate = useNavigate();
  const { uploading, uploadProgress, uploadFile } = useUpload();
  const { analysing, analyseReport } = useAnalysis();
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissionMode, setSubmissionMode] = useState(null);
  const [step, setStep] = useState(1); // 1=upload, 2=mode, 3=processing

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    if (file) setStep(2);
    else setStep(1);
  };

  const handleContinue = async () => {
    if (!selectedFile || !submissionMode) {
      toast.error('Please select a file and submission mode');
      return;
    }

    setStep(3);

    try {
      // Upload the file
      const report = await uploadFile(selectedFile, submissionMode);
      if (!report) return;

      // Analyse it
      toast.loading('Analysing with AI...', { id: 'analyse' });
      const analysis = await analyseReport(report._id);
      toast.dismiss('analyse');

      if (analysis) {
        toast.success('Analysis complete!');
        notifyReportsChanged({ action: 'upload-analyse-complete', reportId: report._id });
        navigate(`/analysis/${report._id}`);
      }
    } catch (err) {
      setStep(2);
      console.error('Upload/analyse error:', err.message);
    }
  };

  const isProcessing = uploading || analysing;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-white text-2xl sm:text-3xl font-bold">Upload Lab Report</h1>
            <p className="text-text-secondary text-sm mt-1">
              Upload your OS lab report for AI-powered analysis and scoring
            </p>
          </motion.div>

          {/* Progress steps */}
          <div className="flex items-center gap-2 mb-8">
            {[
              { n: 1, label: 'Select File' },
              { n: 2, label: 'Choose Mode' },
              { n: 3, label: 'Processing' },
            ].map((s, i) => (
              <React.Fragment key={s.n}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step > s.n
                        ? 'bg-green-500 text-white'
                        : step === s.n
                        ? 'bg-primary-500 text-white'
                        : 'bg-white/10 text-text-secondary'
                    }`}
                  >
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span className={`text-sm ${step === s.n ? 'text-white' : 'text-text-secondary'}`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-white/10 max-w-16" />}
              </React.Fragment>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 3: Processing */}
            {step === 3 ? (
              <motion.div
                key="processing"
                className="flex flex-col items-center justify-center py-20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="glass rounded-2xl border border-primary-500/20 p-12 text-center max-w-md w-full">
                  <LoadingSpinner size="xl" text="" />
                  <div className="mt-6 space-y-2">
                    {uploading ? (
                      <>
                        <p className="text-white font-semibold text-lg">Uploading file...</p>
                        <p className="text-text-secondary text-sm">{uploadProgress}% complete</p>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-3">
                          <motion.div
                            className="h-full bg-primary-500 rounded-full"
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-white font-semibold text-lg">Analysing with AI...</p>
                        <p className="text-text-secondary text-sm">This may take 10-30 seconds</p>
                        <div className="mt-4 space-y-2 text-left">
                          {['Extracting text content', 'Evaluating sections', 'Calculating scores', 'Generating feedback'].map((step, i) => (
                            <motion.div
                              key={step}
                              className="flex items-center gap-2 text-sm text-text-secondary"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.5 }}
                            >
                              <motion.div
                                className="w-3 h-3 rounded-full bg-primary-500"
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.5 }}
                              />
                              {step}
                            </motion.div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Upload zone */}
                <GlassCard className="mb-6">
                  <h2 className="text-white font-semibold text-lg mb-4">
                    1. Select Your Report File
                  </h2>
                  <UploadZone onFileSelect={handleFileSelect} disabled={isProcessing} />
                </GlassCard>

                {/* Submission mode */}
                <AnimatePresence>
                  {selectedFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <GlassCard className="mb-6">
                        <h2 className="text-white font-semibold text-lg mb-4">
                          2. Choose Submission Mode
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {SUBMISSION_MODES.map((mode) => (
                            <motion.button
                              key={mode.id}
                              onClick={() => setSubmissionMode(mode.id)}
                              className={`text-left rounded-xl border p-5 transition-all ${
                                submissionMode === mode.id
                                  ? 'border-primary-500 bg-primary-500/10'
                                  : 'border-white/10 bg-white/3 hover:border-white/20'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-3xl">{mode.icon}</span>
                                <div>
                                  <h3 className="text-white font-semibold">{mode.title}</h3>
                                  {submissionMode === mode.id && (
                                    <span className="text-xs text-primary-400">Selected ✓</span>
                                  )}
                                </div>
                              </div>
                              <p className="text-text-secondary text-xs leading-relaxed mb-3">
                                {mode.description}
                              </p>
                              <ul className="space-y-1">
                                {mode.features.map((f) => (
                                  <li key={f} className="flex items-center gap-2 text-xs text-text-secondary">
                                    <span className="text-green-400">✓</span>
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            </motion.button>
                          ))}
                        </div>
                      </GlassCard>

                      {submissionMode && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <button
                            onClick={handleContinue}
                            disabled={isProcessing}
                            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Analyse Report with AI
                          </button>
                          <p className="text-text-secondary text-xs text-center mt-2">
                            Files are processed securely. Results are cached to avoid duplicate API calls.
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default UploadPage;
