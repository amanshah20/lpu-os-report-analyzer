const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const sectionScoresSchema = new mongoose.Schema({
  projectOverview: { type: Number, default: 0, min: 0, max: 10 },
  moduleBreakdown: { type: Number, default: 0, min: 0, max: 10 },
  functionalities: { type: Number, default: 0, min: 0, max: 10 },
  technologyUsed: { type: Number, default: 0, min: 0, max: 10 },
  flowDiagram: { type: Number, default: 0, min: 0, max: 10 },
  githubTracking: { type: Number, default: 0, min: 0, max: 10 },
  conclusion: { type: Number, default: 0, min: 0, max: 10 },
  references: { type: Number, default: 0, min: 0, max: 5 },
  appendixAI: { type: Number, default: 0, min: 0, max: 10 },
  problemStatement: { type: Number, default: 0, min: 0, max: 5 },
  solutionCode: { type: Number, default: 0, min: 0, max: 10 },
}, { _id: false });

const analysisSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileHash: {
    type: String,
    required: true,
    index: true,
  },
  totalScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  sectionScores: {
    type: sectionScoresSchema,
    default: () => ({}),
  },
  missingSections: {
    type: [String],
    default: [],
  },
  mistakes: {
    type: [String],
    default: [],
  },
  aiUsagePercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  aiUsageDetails: {
    type: String,
    default: '',
  },
  improvements: {
    type: [String],
    default: [],
  },
  strengths: {
    type: [String],
    default: [],
  },
  overallFeedback: {
    type: String,
    default: '',
  },
  plagiarismRisk: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low',
  },
  formatCompliance: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  geminiResponse: {
    type: String,
    default: '',
  },
  analysisMode: {
    type: String,
    enum: ['ai', 'local'],
    default: 'ai',
  },
  aiProvider: {
    type: String,
    default: '',
  },
  providerModel: {
    type: String,
    default: '',
  },
  fallbackReason: {
    type: String,
    default: '',
  },
  generatedReportText: {
    type: String,
    default: '',
  },
  generatedReportMode: {
    type: String,
    enum: ['ai', 'local', ''],
    default: '',
  },
  generatedReportProvider: {
    type: String,
    default: '',
  },
  generatedReportModel: {
    type: String,
    default: '',
  },
  generatedReportUpdatedAt: {
    type: Date,
    default: null,
  },
  cached: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

analysisSchema.plugin(mongoosePaginate);

const Analysis = mongoose.model('Analysis', analysisSchema);
module.exports = Analysis;
