import React from 'react';
import { motion } from 'framer-motion';

const ProfileCard = ({ user, profileCompletion = 0 }) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <motion.div
      className="glass rounded-card border border-white/10 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Avatar */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent flex items-center justify-center text-white text-3xl font-bold shadow-lpu">
            {getInitials(user?.fullName)}
          </div>
          {/* Online indicator */}
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
        </div>
        <h2 className="text-white text-xl font-bold">{user?.fullName || 'User'}</h2>
        <p className="text-text-secondary text-sm">{user?.email}</p>
        <span className="mt-2 inline-block text-xs px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30 capitalize">
          {user?.role || 'student'}
        </span>
      </div>

      {/* Profile Completion */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-secondary">Profile Completion</span>
          <span className="text-sm font-semibold text-primary-400">{profileCompletion}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${profileCompletion}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
        {profileCompletion < 100 && (
          <p className="text-text-secondary text-xs mt-1">Complete your profile for better experience</p>
        )}
      </div>

      {/* Info fields */}
      <div className="space-y-3">
        {user?.role === 'student' ? (
          <>
            <InfoRow label="Registration No." value={user?.registrationNumber || 'Not set'} />
            <InfoRow label="Roll Number" value={user?.rollNumber || 'Not set'} />
            <InfoRow label="Section" value={user?.section ? `Section ${user.section}` : 'Not set'} />
          </>
        ) : (
          <InfoRow label="Teacher ID" value={user?.teacherId || 'Not set'} />
        )}
        <InfoRow label="Joined" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'} />
        <InfoRow label="Last Login" value={user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN') : 'N/A'} />
      </div>
    </motion.div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5">
    <span className="text-text-secondary text-sm">{label}</span>
    <span className="text-white text-sm font-medium">{value}</span>
  </div>
);

export default ProfileCard;
