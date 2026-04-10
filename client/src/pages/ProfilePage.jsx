import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Sidebar from '../components/Sidebar';
import ProfileCard from '../components/ProfileCard';
import GlassCard from '../components/GlassCard';
import SkeletonLoader from '../components/SkeletonLoader';
import useAuth from '../hooks/useAuth';
import { studentAPI } from '../services/api';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  section: z.enum(['A', 'B', 'C', 'D', 'E', '']).optional(),
  registrationNumber: z.string().optional(),
  rollNumber: z.string().optional(),
  teacherId: z.string().optional(),
});

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await studentAPI.getProfile();
        if (res.data.success) {
          setProfileData(res.data.user);
          reset({
            fullName: res.data.user.fullName || '',
            section: res.data.user.section || '',
            registrationNumber: res.data.user.registrationNumber || '',
            rollNumber: res.data.user.rollNumber || '',
            teacherId: res.data.user.teacherId || '',
          });
        }
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        fullName: data.fullName,
        ...(user?.role === 'student' ? {
          section: data.section,
          registrationNumber: data.registrationNumber,
          rollNumber: data.rollNumber,
        } : {
          teacherId: data.teacherId,
        }),
      };

      const res = await studentAPI.updateProfile(payload);
      if (res.data.success) {
        setProfileData(res.data.user);
        updateUser(res.data.user);
        toast.success('Profile updated successfully!');
        setEditing(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const profile = profileData || user;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 lg:ml-64 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-white text-2xl sm:text-3xl font-bold">My Profile</h1>
            <p className="text-text-secondary text-sm mt-1">
              Manage your account information and preferences
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SkeletonLoader type="card" />
              <div className="lg:col-span-2">
                <SkeletonLoader type="card" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile card */}
              <div>
                <ProfileCard
                  user={profile}
                  profileCompletion={profile?.profileCompletion || 0}
                />
              </div>

              {/* Edit form */}
              <div className="lg:col-span-2 space-y-6">
                <GlassCard>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white font-semibold text-lg">Account Information</h2>
                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm transition-colors border border-primary-500/30 px-3 py-1.5 rounded-lg hover:bg-primary-500/10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </button>
                    ) : (
                      <button
                        onClick={() => { setEditing(false); reset(); }}
                        className="text-text-secondary hover:text-white text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Full name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-text-secondary text-sm mb-1.5">Full Name</label>
                        {editing ? (
                          <>
                            <input
                              {...register('fullName')}
                              className="lpu-input"
                              placeholder="Your full name"
                            />
                            {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
                          </>
                        ) : (
                          <p className="text-white py-3 px-4 rounded-lg bg-white/3 border border-white/5">
                            {profile?.fullName || 'Not set'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-text-secondary text-sm mb-1.5">Email Address</label>
                        <p className="text-white py-3 px-4 rounded-lg bg-white/3 border border-white/5 opacity-60">
                          {profile?.email}
                        </p>
                      </div>
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-text-secondary text-sm mb-1.5">Role</label>
                      <p className="text-white py-3 px-4 rounded-lg bg-white/3 border border-white/5 capitalize opacity-60">
                        {profile?.role}
                      </p>
                    </div>

                    {/* Student specific */}
                    {profile?.role === 'student' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-text-secondary text-sm mb-1.5">Registration No.</label>
                          {editing && !profile?.registrationNumber ? (
                            <input
                              {...register('registrationNumber')}
                              className="lpu-input"
                              placeholder="Reg number"
                            />
                          ) : (
                            <p className={`text-white py-3 px-4 rounded-lg bg-white/3 border border-white/5 ${profile?.registrationNumber ? 'opacity-60' : ''}`}>
                              {profile?.registrationNumber || 'Not set'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-text-secondary text-sm mb-1.5">Roll Number</label>
                          {editing && !profile?.rollNumber ? (
                            <input
                              {...register('rollNumber')}
                              className="lpu-input"
                              placeholder="Roll no."
                            />
                          ) : (
                            <p className={`text-white py-3 px-4 rounded-lg bg-white/3 border border-white/5 ${profile?.rollNumber ? 'opacity-60' : ''}`}>
                              {profile?.rollNumber || 'Not set'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-text-secondary text-sm mb-1.5">Section</label>
                          {editing ? (
                            <select
                              {...register('section')}
                              className="lpu-input"
                            >
                              <option value="" className="bg-secondary-500">Select...</option>
                              {['A', 'B', 'C', 'D', 'E'].map((s) => (
                                <option key={s} value={s} className="bg-secondary-500">Section {s}</option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-white py-3 px-4 rounded-lg bg-white/3 border border-white/5">
                              {profile?.section ? `Section ${profile.section}` : 'Not set'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Teacher specific */}
                    {profile?.role === 'teacher' && (
                      <div>
                        <label className="block text-text-secondary text-sm mb-1.5">Teacher ID</label>
                        {editing ? (
                          <input
                            {...register('teacherId')}
                            className="lpu-input"
                            placeholder="Your teacher ID"
                          />
                        ) : (
                          <p className="text-white py-3 px-4 rounded-lg bg-white/3 border border-white/5">
                            {profile?.teacherId || 'Not set'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Save button */}
                    {editing && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <button
                          type="submit"
                          disabled={saving}
                          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? (
                            <>
                              <motion.div
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                              />
                              Saving...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Save Changes
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </form>
                </GlassCard>

                {/* Security section */}
                <GlassCard>
                  <h2 className="text-white font-semibold text-lg mb-4">Security</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5">
                      <div>
                        <p className="text-white text-sm font-medium">Email Verification</p>
                        <p className="text-text-secondary text-xs">Login via OTP sent to your email</p>
                      </div>
                      <span className="text-green-400 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Enabled
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5">
                      <div>
                        <p className="text-white text-sm font-medium">JWT Authentication</p>
                        <p className="text-text-secondary text-xs">15-min access + 7-day refresh tokens</p>
                      </div>
                      <span className="text-green-400 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Active
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
