import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateFile, formatFileSize, getFileIcon } from '../utils/fileHelpers';

const UploadZone = ({ onFileSelect, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState([]);

  const processFile = useCallback((file) => {
    const validationErrors = validateFile(file);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setSelectedFile(null);
      return;
    }
    setErrors([]);
    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [disabled, processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const clearFile = () => {
    setSelectedFile(null);
    setErrors([]);
    onFileSelect(null);
  };

  const fileExt = selectedFile?.name?.split('.').pop()?.toLowerCase();

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.label
            key="dropzone"
            htmlFor="file-upload"
            className={`upload-zone ${isDragging ? 'active' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            whileHover={!disabled ? { scale: 1.01 } : undefined}
          >
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.xlsx,.xls"
              onChange={handleInputChange}
              disabled={disabled}
            />

            <motion.div
              className="flex flex-col items-center gap-4 p-8"
              animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
            >
              {/* Upload icon */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                isDragging ? 'bg-primary-500/30 border-2 border-primary-500' : 'bg-white/5 border border-white/10'
              }`}>
                <svg className={`w-10 h-10 ${isDragging ? 'text-primary-400' : 'text-text-secondary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <div className="text-center">
                <p className="text-white font-semibold text-lg mb-1">
                  {isDragging ? 'Drop your file here' : 'Drag & drop your report'}
                </p>
                <p className="text-text-secondary text-sm">
                  or <span className="text-primary-400 font-medium">browse to upload</span>
                </p>
              </div>

              {/* Supported types */}
              <div className="flex flex-wrap gap-2 justify-center">
                {['PDF', 'DOCX', 'DOC', 'XLSX', 'XLS'].map((type) => (
                  <span
                    key={type}
                    className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-text-secondary"
                  >
                    {type}
                  </span>
                ))}
              </div>
              <p className="text-text-secondary text-xs">Maximum file size: 10MB</p>
            </motion.div>
          </motion.label>
        ) : (
          <motion.div
            key="selected"
            className="glass rounded-card border border-primary-500/40 p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-4">
              {/* File icon */}
              <div className="w-14 h-14 rounded-xl bg-primary-500/20 border border-primary-500/40 flex items-center justify-center text-2xl flex-shrink-0">
                {getFileIcon(fileExt)}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{selectedFile.name}</p>
                <p className="text-text-secondary text-sm mt-0.5">
                  {formatFileSize(selectedFile.size)} · {fileExt?.toUpperCase()}
                </p>
                {/* Progress bar placeholder */}
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Remove button */}
              <button
                onClick={clearFile}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Success indicator */}
            <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              File selected and ready for analysis
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {errors.map((err, i) => (
              <p key={i} className="text-red-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {err}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadZone;
