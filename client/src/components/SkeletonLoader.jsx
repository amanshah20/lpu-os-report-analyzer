import React from 'react';

const SkeletonBlock = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

const SkeletonCard = () => (
  <div className="glass rounded-card p-6 border border-white/10">
    <SkeletonBlock className="h-4 w-2/3 mb-3" />
    <SkeletonBlock className="h-8 w-1/3 mb-2" />
    <SkeletonBlock className="h-3 w-1/2" />
  </div>
);

const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-3 border-b border-white/5">
    <SkeletonBlock className="h-10 w-10 rounded-full" />
    <div className="flex-1">
      <SkeletonBlock className="h-4 w-1/3 mb-2" />
      <SkeletonBlock className="h-3 w-1/2" />
    </div>
    <SkeletonBlock className="h-6 w-16 rounded-full" />
  </div>
);

const SkeletonTable = ({ rows = 5 }) => (
  <div className="glass rounded-card border border-white/10 overflow-hidden">
    <div className="p-4 border-b border-white/10">
      <SkeletonBlock className="h-6 w-40" />
    </div>
    <div className="p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  </div>
);

const SkeletonDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
    <SkeletonTable rows={4} />
  </div>
);

const SkeletonAnalysis = () => (
  <div className="space-y-6">
    <div className="flex justify-center">
      <SkeletonBlock className="h-48 w-48 rounded-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
    <SkeletonTable rows={6} />
  </div>
);

const SkeletonLoader = ({ type = 'default', rows = 5 }) => {
  switch (type) {
    case 'card':
      return <SkeletonCard />;
    case 'table':
      return <SkeletonTable rows={rows} />;
    case 'dashboard':
      return <SkeletonDashboard />;
    case 'analysis':
      return <SkeletonAnalysis />;
    default:
      return (
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonBlock key={i} className={`h-4 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-3/4' : 'w-1/2'}`} />
          ))}
        </div>
      );
  }
};

export { SkeletonBlock, SkeletonCard, SkeletonRow, SkeletonTable, SkeletonDashboard, SkeletonAnalysis };
export default SkeletonLoader;
