export const getScoreColor = (score) => {
  if (score >= 86) return '#22c55e';
  if (score >= 71) return '#84cc16';
  if (score >= 41) return '#E07B39';
  return '#ef4444';
};

export const getScoreLabel = (score) => {
  if (score >= 86) return 'Excellent';
  if (score >= 71) return 'Good';
  if (score >= 41) return 'Average';
  return 'Poor';
};

export const getScoreTailwindColor = (score) => {
  if (score >= 86) return 'text-green-500';
  if (score >= 71) return 'text-lime-500';
  if (score >= 41) return 'text-orange-500';
  return 'text-red-500';
};

export const getScoreBgColor = (score) => {
  if (score >= 86) return 'bg-green-500/10 border-green-500/30';
  if (score >= 71) return 'bg-lime-500/10 border-lime-500/30';
  if (score >= 41) return 'bg-orange-500/10 border-orange-500/30';
  return 'bg-red-500/10 border-red-500/30';
};

export const getAIUsageColor = (pct) => {
  if (pct > 70) return '#ef4444';
  if (pct > 40) return '#f59e0b';
  return '#22c55e';
};

export const getAIUsageLabel = (pct) => {
  if (pct > 70) return 'High AI Usage';
  if (pct > 40) return 'Moderate AI Usage';
  return 'Low AI Usage';
};

export const getPlagiarismColor = (risk) => {
  if (risk === 'High') return '#ef4444';
  if (risk === 'Medium') return '#f59e0b';
  return '#22c55e';
};

export const SECTION_LABELS = {
  projectOverview: 'Project Overview',
  moduleBreakdown: 'Module-Wise Breakdown',
  functionalities: 'Functionalities',
  technologyUsed: 'Technology Used',
  flowDiagram: 'Flow Diagram',
  githubTracking: 'GitHub Revision Tracking',
  conclusion: 'Conclusion & Future Scope',
  references: 'References',
  appendixAI: 'Appendix A: AI Elaboration',
  problemStatement: 'Appendix B: Problem Statement',
  solutionCode: 'Appendix C: Solution/Code',
};

export const SECTION_MAX = {
  projectOverview: 10,
  moduleBreakdown: 10,
  functionalities: 10,
  technologyUsed: 10,
  flowDiagram: 10,
  githubTracking: 10,
  conclusion: 10,
  references: 5,
  appendixAI: 10,
  problemStatement: 5,
  solutionCode: 10,
};

export const getSectionPercentage = (score, key) => {
  const max = SECTION_MAX[key] || 10;
  return Math.round((score / max) * 100);
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
