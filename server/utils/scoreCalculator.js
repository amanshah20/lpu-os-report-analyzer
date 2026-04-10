const getScoreCategory = (score) => {
  if (score >= 86) return { label: 'Excellent', color: 'green' };
  if (score >= 71) return { label: 'Good', color: 'yellow-green' };
  if (score >= 41) return { label: 'Average', color: 'orange' };
  return { label: 'Poor', color: 'red' };
};

const getScorePercentage = (score, max) => {
  if (!max) return 0;
  return Math.round((score / max) * 100);
};

const calculateSectionTotal = (sectionScores) => {
  if (!sectionScores) return 0;
  return Object.values(sectionScores).reduce((sum, score) => sum + (Number(score) || 0), 0);
};

const getSectionMax = () => ({
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
});

const getTotalMax = () => {
  return Object.values(getSectionMax()).reduce((a, b) => a + b, 0);
};

module.exports = {
  getScoreCategory,
  getScorePercentage,
  calculateSectionTotal,
  getSectionMax,
  getTotalMax,
};
