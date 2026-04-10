const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateTokens } = require('../middleware/authMiddleware');
const { sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc   Send OTP to email
// @route  POST /api/auth/send-otp
// @access Public
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Invalidate existing OTPs for this email
    await OTP.updateMany({ email: email.toLowerCase(), used: false }, { used: true });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiresAt,
    });

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });

    // Send OTP email
    await sendOTPEmail(email, otp, user?.fullName || '');

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      isNewUser: !user,
    });
  } catch (error) {
    console.error('sendOTP error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP',
    });
  }
};

// @desc   Verify OTP and login/register
// @route  POST /api/auth/verify-otp
// @access Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // Find latest valid OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP is invalid or has expired. Please request a new one.',
      });
    }

    // Increment attempts
    otpRecord.attempts += 1;
    if (otpRecord.attempts > 5) {
      otpRecord.used = true;
      await otpRecord.save();
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.',
      });
    }

    if (otpRecord.otp !== otp) {
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`,
      });
    }

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // New user - needs password and registration
      if (!password) {
        return res.status(200).json({
          success: true,
          message: 'OTP verified. Please complete registration.',
          otpVerified: true,
          requiresRegistration: true,
        });
      }

      user = await User.create({
        email: email.toLowerCase(),
        passwordHash: password,
        role: 'student',
        profileComplete: false,
      });
    } else {
      // Existing user - verify password if provided
      if (password) {
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Invalid password',
          });
        }
      }
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profileComplete: user.profileComplete,
        registrationNumber: user.registrationNumber,
        rollNumber: user.rollNumber,
        section: user.section,
        teacherId: user.teacherId,
      },
    });
  } catch (error) {
    console.error('verifyOTP error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'OTP verification failed',
    });
  }
};

// @desc   Complete registration after OTP verification
// @route  POST /api/auth/register
// @access Public
const register = async (req, res) => {
  try {
    const { email, password, fullName, role, registrationNumber, rollNumber, section, teacherId } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Email, password, and full name are required' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user && user.profileComplete) {
      return res.status(409).json({ success: false, message: 'User already registered' });
    }

    if (!user) {
      user = new User({
        email: email.toLowerCase(),
        passwordHash: password,
      });
    } else {
      user.passwordHash = password;
    }

    user.fullName = fullName;
    user.role = role || 'student';

    if (role === 'teacher') {
      user.teacherId = teacherId || '';
      user.profileComplete = !!(fullName && teacherId);
    } else {
      user.registrationNumber = registrationNumber || '';
      user.rollNumber = rollNumber || '';
      user.section = section || '';
      user.profileComplete = !!(fullName && registrationNumber && rollNumber && section);
    }

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.fullName, user.role).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profileComplete: user.profileComplete,
        registrationNumber: user.registrationNumber,
        rollNumber: user.rollNumber,
        section: user.section,
        teacherId: user.teacherId,
      },
    });
  } catch (error) {
    console.error('register error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

// @desc   Login with email + password (alternative flow)
// @route  POST /api/auth/login
// @access Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profileComplete: user.profileComplete,
        registrationNumber: user.registrationNumber,
        rollNumber: user.rollNumber,
        section: user.section,
        teacherId: user.teacherId,
      },
    });
  } catch (error) {
    console.error('login error:', error.message);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// @desc   Refresh access token
// @route  POST /api/auth/refresh
// @access Public
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token mismatch' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('refresh error:', error.message);
    return res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
};

// @desc   Logout
// @route  POST /api/auth/logout
// @access Private
const logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

module.exports = { sendOTP, verifyOTP, register, login, refresh, logout };
