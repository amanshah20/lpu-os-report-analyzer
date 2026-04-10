const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student',
  },
  // Student specific fields
  registrationNumber: {
    type: String,
    trim: true,
    default: '',
  },
  rollNumber: {
    type: String,
    trim: true,
    default: '',
  },
  section: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', ''],
    default: '',
  },
  // Teacher specific fields
  teacherId: {
    type: String,
    trim: true,
    default: '',
  },
  profileComplete: {
    type: Boolean,
    default: false,
  },
  refreshToken: {
    type: String,
    default: null,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Get profile completion percentage
userSchema.methods.getProfileCompletion = function () {
  if (this.role === 'teacher') {
    const fields = [this.fullName, this.teacherId, this.email];
    const filled = fields.filter(f => f && f.trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  } else {
    const fields = [this.fullName, this.registrationNumber, this.rollNumber, this.section, this.email];
    const filled = fields.filter(f => f && f.trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  }
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshToken;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
