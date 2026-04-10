import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { getScoreColor, getScoreLabel } from '../utils/scoreHelpers';

const ScoreRing = ({
  score = 0,
  size = 120,
  strokeWidth = 10,
  showLabel = true,
  showScore = true,
  animate = true,
  className = '',
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const progress = score / 100;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    if (isInView && animate) {
      const startTime = Date.now();
      const duration = 1200;

      const tick = () => {
        const elapsed = Date.now() - startTime;
        const p = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplayScore(Math.round(score * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } else if (!animate) {
      setDisplayScore(score);
    }
  }, [isInView, score, animate]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div ref={ref} className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={isInView ? { strokeDashoffset } : { strokeDashoffset: circumference }}
            transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
            style={{
              filter: `drop-shadow(0 0 8px ${color}80)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: 'none' }}
        >
          {showScore && (
            <span
              className="font-bold leading-none"
              style={{
                fontSize: size * 0.22,
                color,
                textShadow: `0 0 15px ${color}60`,
              }}
            >
              {displayScore}
            </span>
          )}
          <span
            className="text-text-secondary leading-none mt-1"
            style={{ fontSize: size * 0.09 }}
          >
            /100
          </span>
        </div>
      </div>
      {showLabel && (
        <motion.span
          className="text-sm font-semibold px-3 py-1 rounded-full"
          style={{
            color,
            backgroundColor: `${color}20`,
            border: `1px solid ${color}40`,
          }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.8 }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
};

export default ScoreRing;
