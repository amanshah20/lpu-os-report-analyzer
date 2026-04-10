import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI } from '../services/api';
import useAuth from '../hooks/useAuth';
import OTPModal from '../components/OTPModal';
import RegisterModal from '../components/RegisterModal';
import LPULogo from '../components/LPULogo';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showOTP, setShowOTP] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setSendingOTP(true);
    try {
      const res = await authAPI.sendOTP(data.email);
      setCurrentEmail(data.email);
      setShowOTP(true);
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleOTPVerified = async (data) => {
    if (data.requiresRegistration) {
      setShowOTP(false);
      setShowRegister(true);
      return;
    }

    if (data.accessToken) {
      // Try password login flow
      const password = getValues('password');
      try {
        const loginRes = await authAPI.verifyOTP({
          email: currentEmail,
          otp: data.otp || '',
          password,
        });
        if (loginRes.data.accessToken) {
          await login(loginRes.data.user, {
            accessToken: loginRes.data.accessToken,
            refreshToken: loginRes.data.refreshToken,
          });
          setShowOTP(false);
          navigateByRole(loginRes.data.user);
          return;
        }
      } catch {}

      await login(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      setShowOTP(false);
      navigateByRole(data.user);
    }
  };

  const handleRegistered = async (data) => {
    await login(data.user, {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    setShowRegister(false);
    navigateByRole(data.user);
  };

  const navigateByRole = (user) => {
    if (!user.profileComplete && user.role === 'student') {
      setShowRegister(true);
      return;
    }
    navigate(user.role === 'teacher' ? '/teacher' : '/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary-500/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <motion.div
            className="flex justify-center mb-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <LPULogo size={72} />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-1">
            LPU OS Lab
          </h1>
          <p className="gradient-text font-bold text-xl">Report Analyser</p>
          <p className="text-text-secondary text-sm mt-2">
            Lovely Professional University · AI-Powered Evaluation
          </p>
        </div>

        {/* Login card */}
        <div className="glass rounded-2xl border border-white/10 p-8 shadow-lpu">
          <h2 className="text-white font-semibold text-lg mb-6">Sign In to Continue</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-text-secondary text-sm mb-1.5 font-medium">
                University Email
              </label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  className="lpu-input pl-10"
                  placeholder="your@lpu.in"
                  autoComplete="email"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-text-secondary text-sm mb-1.5 font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type="password"
                  className="lpu-input pl-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || sendingOTP}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {(isSubmitting || sendingOTP) ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Sending OTP...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Continue with OTP
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-text-secondary text-sm">
              New user? Enter your email and password above,{' '}
              <br />then verify via OTP to register.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: '🤖', label: 'AI Analysis' },
            { icon: '📊', label: 'Score Report' },
            { icon: '🔒', label: 'Secure Login' },
          ].map((f) => (
            <div key={f.label} className="glass rounded-xl border border-white/5 p-3 text-center">
              <div className="text-xl mb-1">{f.icon}</div>
              <p className="text-text-secondary text-xs">{f.label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-text-secondary text-xs mt-6">
          © {new Date().getFullYear()} Lovely Professional University · OS Lab Analyser
        </p>
      </motion.div>

      {/* OTP Modal */}
      {showOTP && (
        <OTPModal
          email={currentEmail}
          onVerified={handleOTPVerified}
          onClose={() => setShowOTP(false)}
        />
      )}

      {/* Register Modal */}
      {showRegister && (
        <RegisterModal
          email={currentEmail}
          onRegistered={handleRegistered}
          onClose={() => setShowRegister(false)}
        />
      )}
    </div>
  );
};

export default LoginPage;
