import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SuggestionItem = ({ suggestion, index }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = suggestion.length > 100;
  const preview = isLong ? suggestion.slice(0, 100) + '...' : suggestion;

  return (
    <motion.div
      className="glass rounded-lg border border-blue-500/20 p-4 hover:border-blue-500/40 transition-all"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-blue-400 text-xs font-bold">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm leading-relaxed">
            {isLong && !expanded ? preview : suggestion}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-400 text-xs mt-1 hover:text-blue-300 transition-colors"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SuggestionPanel = ({ improvements = [], title = 'Improvement Suggestions' }) => {
  return (
    <div>
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <span className="text-blue-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </span>
        {title}
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
          {improvements.length}
        </span>
      </h3>
      <div className="space-y-3">
        {improvements.length === 0 ? (
          <p className="text-text-secondary text-sm italic">No suggestions available.</p>
        ) : (
          improvements.map((suggestion, i) => (
            <SuggestionItem key={i} suggestion={suggestion} index={i} />
          ))
        )}
      </div>
    </div>
  );
};

export default SuggestionPanel;
