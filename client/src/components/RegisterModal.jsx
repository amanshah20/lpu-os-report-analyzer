import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const studentSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  registrationNumber: z.string().min(3, 'Registration number is required'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  section: z.enum(['A', 'B', 'C', 'D', 'E'], { required_error: 'Section is required' }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const teacherSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  teacherId: z.string().min(2, 'Teacher ID is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const RegisterModal = ({ email, onRegistered, onClose }) => {
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);

  const schema = role === 'teacher' ? teacherSchema : studentSchema;
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        email,
        fullName: data.fullName,
        password: data.password,
        role,
        ...(role === 'student' ? {
          registrationNumber: data.registrationNumber,
          rollNumber: data.rollNumber,
          section: data.section,
        } : {
          teacherId: data.teacherId,
        }),
      };

      const response = await authAPI.register(payload);
      if (response.data.success) {
        toast.success('Registration successful!');
        onRegistered(response.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative glass rounded-2xl border border-white/15 p-8 w-full max-w-lg my-8 shadow-lpu-lg"
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold text-white mb-1">Complete Registration</h2>
          <p className="text-text-secondary text-sm mb-6">
            Email: <span className="text-primary-400">{email}</span>
          </p>

          {/* Role selector */}
          <div className="flex gap-3 mb-6">
            {['student', 'teacher'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); reset(); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all border ${
                  role === r
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white/5 text-text-secondary border-white/10 hover:border-white/20'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">Full Name *</label>
              <input
                {...register('fullName')}
                className="lpu-input"
                placeholder="Enter your full name"
              />
              {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="block text-sm text-text-secondary mb-1">Email</label>
              <input
                value={email}
                readOnly
                className="lpu-input opacity-60 cursor-not-allowed"
              />
            </div>

            {/* Student fields */}
            {role === 'student' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Registration No. *</label>
                    <input
                      {...register('registrationNumber')}
                      className="lpu-input"
                      placeholder="e.g. 12207770"
                    />
                    {errors.registrationNumber && <p className="text-red-400 text-xs mt-1">{errors.registrationNumber.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Roll No. *</label>
                    <input
                      {...register('rollNumber')}
                      className="lpu-input"
                      placeholder="e.g. 35"
                    />
                    {errors.rollNumber && <p className="text-red-400 text-xs mt-1">{errors.rollNumber.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Section *</label>
                  <select
                    {...register('section')}
                    className="lpu-input"
                  >
                    <option value="" className="bg-secondary-500">Select section...</option>
                    {['A', 'B', 'C', 'D', 'E'].map((s) => (
                      <option key={s} value={s} className="bg-secondary-500">Section {s}</option>
                    ))}
                  </select>
                  {errors.section && <p className="text-red-400 text-xs mt-1">{errors.section.message}</p>}
                </div>
              </>
            )}

            {/* Teacher fields */}
            {role === 'teacher' && (
              <div>
                <label className="block text-sm text-text-secondary mb-1">Teacher ID *</label>
                <input
                  {...register('teacherId')}
                  className="lpu-input"
                  placeholder="e.g. TCH001"
                />
                {errors.teacherId && <p className="text-red-400 text-xs mt-1">{errors.teacherId.message}</p>}
              </div>
            )}

            {/* Password */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Password *</label>
                <input
                  {...register('password')}
                  type="password"
                  className="lpu-input"
                  placeholder="Min 6 characters"
                />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Confirm Password *</label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className="lpu-input"
                  placeholder="Repeat password"
                />
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RegisterModal;
