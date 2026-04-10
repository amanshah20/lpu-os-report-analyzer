const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const reportSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
    trim: true,
  },
  originalName: {
    type: String,
    required: true,
    trim: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'doc', 'xlsx', 'xls'],
    required: true,
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  fileHash: {
    type: String,
    required: true,
    index: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  submissionType: {
    type: String,
    enum: ['self', 'direct'],
    default: 'self',
  },
  status: {
    type: String,
    enum: ['uploaded', 'analysed', 'submitted'],
    default: 'uploaded',
  },
  teacherSubmittedAt: {
    type: Date,
    default: null,
  },
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis',
    default: null,
  },
}, {
  timestamps: true,
});

reportSchema.plugin(mongoosePaginate);

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
