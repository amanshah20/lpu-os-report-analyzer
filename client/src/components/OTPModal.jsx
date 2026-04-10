import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const OTPModal = ({ email, onVerified, onClose }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleChange = (index, value) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (value && index === 5) {
      const fullOtp = [...newOtp.slice(0, 5), value.slice(-1)].join('');
      if (fullOtp.length === 6) {
        handleVerify([...newOtp.slice(0, 5), value.slice(-1)]);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newOtp = [...Array(6)].map((_, i) => pasted[i] || '');
      setOtp(newOtp);
      inputRefs.current[Math.min(pasted.length - 1, 5)]?.focus();
      if (pasted.length === 6) {
        handleVerify(newOtp);
      }
    }
  };

  const handleVerify = useCallback(async (otpArray = otp) => {
    const otpString = otpArray.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP({ email, otp: otpString });
      if (response.data.success) {
        onVerified(response.data);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid OTP';
      toast.error(message);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [otp, email, onVerified]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await authAPI.sendOTP(email);
      toast.success('New OTP sent to your email');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      // Restart timer
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative glass rounded-2xl border border-white/15 p-8 w-full max-w-md shadow-lpu-lg"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">Enter OTP</h2>
          <p className="text-text-secondary text-sm text-center mb-6">
            We sent a 6-digit code to<br />
            <span className="text-primary-400 font-medium">{email}</span>
          </p>

          {/* OTP Inputs */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-lg border transition-all duration-200 bg-white/5 text-white focus:outline-none
                  ${digit ? 'border-primary-500 shadow-lpu' : 'border-white/20'}
                  focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50`}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-4">
            {countdown > 0 ? (
              <p className="text-text-secondary text-sm">
                Resend OTP in{' '}
                <span className="text-primary-400 font-semibold">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </div>

          {/* Verify button */}
          <button
            onClick={() => handleVerify()}
            disabled={loading || otp.join('').length !== 6}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </button>

          <p className="text-text-secondary text-xs text-center mt-4">
            OTP expires in 10 minutes. Do not share with anyone.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OTPModal;
