import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import LPULogo from './LPULogo';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const dashboardPath = user?.role === 'teacher' ? '/teacher' : '/dashboard';

  return (
    <nav className="navbar h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to={isAuthenticated ? dashboardPath : '/'} className="flex items-center gap-3">
          <LPULogo size={36} />
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-tight">LPU OS Lab</p>
            <p className="text-text-secondary text-xs">Report Analyser</p>
          </div>
        </Link>

        {/* Desktop nav */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-2">
            {user?.role === 'student' && (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/upload">Upload</NavLink>
                <NavLink to="/history">History</NavLink>
                <NavLink to="/profile">Profile</NavLink>
              </>
            )}
            {user?.role === 'teacher' && (
              <>
                <NavLink to="/teacher">Dashboard</NavLink>
                <NavLink to="/teacher/submissions">Submissions</NavLink>
                <NavLink to="/profile">Profile</NavLink>
              </>
            )}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* User avatar */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 glass rounded-full px-3 py-1.5 border border-white/10 hover:border-primary-500/50 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(user?.fullName)}
                  </div>
                  <span className="text-sm text-white hidden sm:block max-w-24 truncate">
                    {user?.fullName || user?.email?.split('@')[0]}
                  </span>
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-48 glass rounded-card border border-white/10 py-1 z-50"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-white text-sm font-medium truncate">{user?.fullName || 'User'}</p>
                        <p className="text-text-secondary text-xs truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 capitalize">
                          {user?.role}
                        </span>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        to={dashboardPath}
                        className="block px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => { setMenuOpen(false); handleLogout(); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden text-white p-2"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="btn-primary text-sm px-5 py-2"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile click-outside overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  );
};

const NavLink = ({ to, children }) => (
  <Link
    to={to}
    className="text-text-secondary hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-white/5 transition-all"
  >
    {children}
  </Link>
);

export default Navbar;
