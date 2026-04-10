import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({
  children,
  className = '',
  hover = false,
  onClick,
  animate = true,
  delay = 0,
  padding = 'p-6',
}) => {
  const baseClasses = `
    glass rounded-card border border-white/10
    ${padding}
    ${hover ? 'cursor-pointer hover:border-primary-500/40 hover:shadow-lpu transition-all duration-300' : ''}
    ${className}
  `;

  if (animate) {
    return (
      <motion.div
        className={baseClasses}
        onClick={onClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default GlassCard;
