const User = require('../models/User');
const Report = require('../models/Report');
const Analysis = require('../models/Analysis');

// @desc   Get student profile
// @route  GET /api/student/profile
// @access Private (student)
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profileCompletion = user.getProfileCompletion();

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        registrationNumber: user.registrationNumber,
        rollNumber: user.rollNumber,
        section: user.section,
        teacherId: user.teacherId,
        profileComplete: user.profileComplete,
        profileCompletion,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update student profile
// @route  PUT /api/student/profile
// @access Private (student)
const updateProfile = async (req, res) => {
  try {
    const { fullName, section, registrationNumber, rollNumber, teacherId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (fullName !== undefined) user.fullName = fullName;

    if (user.role === 'student') {
      if (section !== undefined) user.section = section;
      // Only allow setting reg/roll if not already set
      if (registrationNumber !== undefined && !user.registrationNumber) {
        user.registrationNumber = registrationNumber;
      }
      if (rollNumber !== undefined && !user.rollNumber) {
        user.rollNumber = rollNumber;
      }
      user.profileComplete = !!(user.fullName && user.registrationNumber && user.rollNumber && user.section);
    } else if (user.role === 'teacher') {
      if (teacherId !== undefined) user.teacherId = teacherId;
      user.profileComplete = !!(user.fullName && user.teacherId);
    }

    await user.save({ validateBeforeSave: false });

    const profileCompletion = user.getProfileCompletion();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        registrationNumber: user.registrationNumber,
        rollNumber: user.rollNumber,
        section: user.section,
        teacherId: user.teacherId,
        profileComplete: user.profileComplete,
        profileCompletion,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get student reports
// @route  GET /api/student/reports
// @access Private (student)
const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { studentId: req.user._id };
    if (status) query.status = status;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: { path: 'analysisId' },
    };

    const result = await Report.paginate(query, options);

    return res.status(200).json({
      success: true,
      reports: result.docs,
      pagination: {
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        limit: result.limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get student dashboard stats
// @route  GET /api/student/stats
// @access Private (student)
const getStats = async (req, res) => {
  try {
    const studentId = req.user._id;

    const totalReports = await Report.countDocuments({ studentId });
    const submittedReports = await Report.countDocuments({ studentId, status: 'submitted' });
    const analysedReports = await Report.countDocuments({ studentId, status: { $in: ['analysed', 'submitted'] } });

    const analyses = await Analysis.find({ studentId });
    const avgScore = analyses.length
      ? Math.round(analyses.reduce((sum, a) => sum + a.totalScore, 0) / analyses.length)
      : 0;
    const totalSuggestions = analyses.reduce((sum, a) => sum + (a.improvements?.length || 0), 0);

    // Recent activity
    const recentReports = await Report.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('analysisId', 'totalScore');

    return res.status(200).json({
      success: true,
      stats: {
        totalReports,
        submittedReports,
        analysedReports,
        averageScore: avgScore,
        totalSuggestions,
        pendingReview: submittedReports,
      },
      recentActivity: recentReports,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProfile, updateProfile, getReports, getStats };
