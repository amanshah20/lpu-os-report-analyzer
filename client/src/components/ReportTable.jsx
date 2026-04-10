import React from 'react';
import { motion } from 'framer-motion';
import { getScoreColor, formatDate, getAIUsageColor } from '../utils/scoreHelpers';
import { teacherAPI } from '../services/api';
import { downloadBlob } from '../utils/fileHelpers';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
  const config = {
    uploaded: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    analysed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    submitted: 'bg-green-500/20 text-green-400 border-green-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${config[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
      {status}
    </span>
  );
};

const ReportTable = ({ submissions = [], onViewDetail }) => {
  const handleDownloadReport = async (id, e) => {
    e.stopPropagation();
    try {
      const response = await teacherAPI.downloadReport(id);
      downloadBlob(response.data, `report_${id}.pdf`);
      toast.success('Report downloaded');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDownloadAnalysis = async (id, e) => {
    e.stopPropagation();
    try {
      const response = await teacherAPI.downloadAnalysis(id);
      downloadBlob(response.data, `analysis_${id}.pdf`);
      toast.success('Analysis downloaded');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDownloadZip = async (id, e) => {
    e.stopPropagation();
    try {
      const response = await teacherAPI.downloadZip(id);
      downloadBlob(response.data, `submission_${id}.zip`);
      toast.success('ZIP downloaded');
    } catch {
      toast.error('Download failed');
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="glass rounded-card border border-white/10 p-12 text-center">
        <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-text-secondary text-lg">No submissions found</p>
        <p className="text-text-secondary text-sm mt-1">Adjust filters to see more results</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-card border border-white/10 overflow-hidden">
      {/* Desktop table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/3">
              <th className="text-left text-text-secondary text-xs font-semibold uppercase tracking-wider px-5 py-3">Student</th>
              <th className="text-left text-text-secondary text-xs font-semibold uppercase tracking-wider px-3 py-3">Reg No</th>
              <th className="text-left text-text-secondary text-xs font-semibold uppercase tracking-wider px-3 py-3">Roll / Section</th>
              <th className="text-left text-text-secondary text-xs font-semibold uppercase tracking-wider px-3 py-3">Submitted</th>
              <th className="text-left text-text-secondary text-xs font-semibold uppercase tracking-wider px-3 py-3">Score</th>
              <th className="text-left text-text-secondary text-xs font-semibold uppercase tracking-wider px-3 py-3">AI Usage</th>
              <th className="text-left text-text-secondary text-xs font-semibold uppercase tracking-wider px-3 py-3">Status</th>
              <th className="text-left text-text-secondary text-xs font-semibold uppercase tracking-wider px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub, idx) => {
              const student = sub.studentId || {};
              const analysis = sub.analysisId || {};
              const score = analysis.totalScore ?? null;
              const aiPct = analysis.aiUsagePercentage ?? null;

              return (
                <motion.tr
                  key={sub._id}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onViewDetail?.(sub)}
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-white text-sm font-medium">{student.fullName || 'Unknown'}</p>
                      <p className="text-text-secondary text-xs">{student.email || ''}</p>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-text-secondary text-sm">{student.registrationNumber || '—'}</td>
                  <td className="px-3 py-4">
                    <p className="text-white text-sm">{student.rollNumber || '—'}</p>
                    <p className="text-text-secondary text-xs">{student.section ? `Section ${student.section}` : '—'}</p>
                  </td>
                  <td className="px-3 py-4 text-text-secondary text-sm">
                    {formatDate(sub.teacherSubmittedAt || sub.createdAt)}
                  </td>
                  <td className="px-3 py-4">
                    {score !== null ? (
                      <span
                        className="text-sm font-bold"
                        style={{ color: getScoreColor(score) }}
                      >
                        {score}/100
                      </span>
                    ) : (
                      <span className="text-text-secondary text-sm">—</span>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {aiPct !== null ? (
                      <span
                        className="text-sm font-semibold"
                        style={{ color: getAIUsageColor(aiPct) }}
                      >
                        {aiPct}%
                      </span>
                    ) : (
                      <span className="text-text-secondary text-sm">—</span>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDownloadReport(sub._id, e)}
                        title="Download Report"
                        className="p-1.5 rounded-lg text-text-secondary hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                      </button>
                      {analysis.totalScore !== undefined && (
                        <button
                          onClick={(e) => handleDownloadAnalysis(sub._id, e)}
                          title="Download Analysis PDF"
                          className="p-1.5 rounded-lg text-text-secondary hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDownloadZip(sub._id, e)}
                        title="Download ZIP"
                        className="p-1.5 rounded-lg text-text-secondary hover:text-green-400 hover:bg-green-500/10 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportTable;
