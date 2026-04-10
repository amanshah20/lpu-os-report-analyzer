import React from 'react';
import { motion } from 'framer-motion';
import { getScoreColor, getScoreLabel, formatDate } from '../utils/scoreHelpers';
import { useNavigate } from 'react-router-dom';

const AnalysisCard = ({ report, index = 0, onDelete, deleting = false }) => {
  const navigate = useNavigate();
  const score = report.analysisId?.totalScore ?? null;
  const analysisMode = report.analysisId?.analysisMode || null;
  const scoreColor = score !== null ? getScoreColor(score) : '#A0A0B0';
  const scoreLabel = score !== null ? getScoreLabel(score) : 'Pending';

  const statusConfig = {
    uploaded: { label: 'Uploaded', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    analysed: { label: 'Analysed', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    submitted: { label: 'Submitted', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  };

  const status = statusConfig[report.status] || statusConfig.uploaded;

  return (
    <motion.div
      className="glass rounded-card border border-white/10 p-5 hover:border-primary-500/30 transition-all duration-300 cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/analysis/${report._id}`)}
    >
      {onDelete && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            disabled={deleting}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(report);
            }}
            className="text-xs px-2.5 py-1 rounded-full border border-red-500/40 text-red-300 hover:bg-red-500/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate group-hover:text-primary-400 transition-colors">
            {report.originalName || report.fileName}
          </p>
          <p className="text-text-secondary text-xs mt-0.5">
            {formatDate(report.createdAt)} · {report.fileType?.toUpperCase()} · {report.submissionType}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${status.color}`}>
              {status.label}
            </span>
            {analysisMode === 'ai' && (
              <span className="text-xs px-2 py-0.5 rounded-full border bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                AI Analysis
              </span>
            )}
            {analysisMode === 'local' && (
              <span className="text-xs px-2 py-0.5 rounded-full border bg-orange-500/20 text-orange-300 border-orange-500/30">
                Local Analysis
              </span>
            )}
            {report.submissionType === 'direct' && (
              <span className="text-xs px-2 py-0.5 rounded-full border bg-purple-500/20 text-purple-400 border-purple-500/30">
                Direct
              </span>
            )}
          </div>
        </div>

        {/* Score */}
        {score !== null ? (
          <div className="flex-shrink-0 text-center">
            <div
              className="text-2xl font-bold"
              style={{ color: scoreColor }}
            >
              {score}
            </div>
            <div className="text-text-secondary text-xs">/100</div>
            <div
              className="text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full"
              style={{ color: scoreColor, backgroundColor: `${scoreColor}15` }}
            >
              {scoreLabel}
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 text-center">
            <div className="text-text-secondary text-2xl font-bold">—</div>
            <div className="text-text-secondary text-xs">Not analysed</div>
          </div>
        )}
      </div>

      {/* Arrow indicator */}
      <div className="flex justify-end mt-2">
        <svg className="w-4 h-4 text-text-secondary group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );
};

export default AnalysisCard;
