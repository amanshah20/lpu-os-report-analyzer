import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LPULogo from '../components/LPULogo';
import useAuth from '../hooks/useAuth';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleGoHome = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="text-center relative"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <motion.div
          className="flex justify-center mb-8"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <LPULogo size={80} />
        </motion.div>

        {/* 404 */}
        <div className="relative mb-6">
          <motion.h1
            className="text-9xl font-black"
            style={{
              background: 'linear-gradient(135deg, #E07B39, #F5A623)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            404
          </motion.h1>
          <div
            className="absolute inset-0 blur-3xl opacity-20"
            style={{ background: 'linear-gradient(135deg, #E07B39, #F5A623)' }}
          />
        </div>

        <h2 className="text-white text-2xl font-bold mb-3">Page Not Found</h2>
        <p className="text-text-secondary text-base max-w-md mx-auto mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to the right place.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            onClick={handleGoHome}
            className="btn-primary flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Dashboard
          </motion.button>
          <motion.button
            onClick={() => navigate(-1)}
            className="btn-secondary flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </motion.button>
        </div>

        {/* Divider */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-text-secondary text-sm">
            LPU OS Lab Report Analyser ·{' '}
            <span className="text-primary-400">Lovely Professional University</span>
          </p>
        </div>

        {/* Decorative elements */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary-500/40"
            style={{
              top: `${20 + i * 10}%`,
              left: `${10 + i * 15}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2 + i * 0.4,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
