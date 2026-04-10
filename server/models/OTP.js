const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // TTL index - MongoDB will auto-delete
  },
  used: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5,
  },
}, {
  timestamps: true,
});

// Compound index for quick lookup
otpSchema.index({ email: 1, used: 1 });

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;
