import React from 'react';

const LPULogo = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer circle - dark navy */}
      <circle cx="50" cy="50" r="50" fill="#1A1A2E" />

      {/* Sunburst rays */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = 50 + 36 * Math.cos(angle);
        const y1 = 50 + 36 * Math.sin(angle);
        const x2 = 50 + 48 * Math.cos(angle);
        const y2 = 50 + 48 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#E07B39"
            strokeWidth={i % 3 === 0 ? '3' : '1.5'}
            strokeLinecap="round"
            opacity={i % 3 === 0 ? 1 : 0.5}
          />
        );
      })}

      {/* Orange ring */}
      <circle cx="50" cy="50" r="38" fill="none" stroke="#E07B39" strokeWidth="3" />
      <circle cx="50" cy="50" r="34" fill="#E07B39" />

      {/* Inner dark circle */}
      <circle cx="50" cy="50" r="28" fill="#1A1A2E" />

      {/* LPU Text */}
      <text
        x="50"
        y="56"
        fontFamily="Arial, sans-serif"
        fontSize="16"
        fontWeight="bold"
        fill="#FFFFFF"
        textAnchor="middle"
        letterSpacing="1"
      >
        LPU
      </text>
    </svg>
  );
};

export default LPULogo;
