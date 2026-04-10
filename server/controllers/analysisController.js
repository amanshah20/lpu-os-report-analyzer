const Analysis = require('../models/Analysis');
const Report = require('../models/Report');

// @desc   Get all analyses for current student
// @route  GET /api/student/analyses
// @access Private (student)
const getStudentAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('reportId', 'originalName fileName fileType submittedAt');

    return res.status(200).json({
      success: true,
      analyses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single analysis by ID
// @route  GET /api/student/analysis/:id
// @access Private
const getAnalysisById = async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id)
      .populate('reportId', 'originalName fileName fileType submittedAt status submissionType')
      .populate('studentId', 'fullName email registrationNumber');

    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    // Ensure student can only see their own analysis
    if (
      req.user.role === 'student' &&
      analysis.studentId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStudentAnalyses, getAnalysisById };
