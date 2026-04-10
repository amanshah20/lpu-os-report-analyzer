const User = require('../models/User');

// @desc   Get current user profile (any role)
// @route  GET /api/student/profile  (reused by teacher via student routes)
// @access Private
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const profileCompletion = user.getProfileCompletion();
    return res.status(200).json({
      success: true,
      user: { ...user.toJSON(), profileCompletion },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMyProfile };
