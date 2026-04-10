const crypto = require('crypto');
const fs = require('fs');
const Analysis = require('../models/Analysis');

/**
 * Generate MD5 hash of file content
 */
const generateFileHash = (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    return hash;
  } catch (error) {
    throw new Error(`Failed to generate file hash: ${error.message}`);
  }
};

/**
 * Check if analysis exists for a given file hash
 */
const getCachedAnalysis = async (fileHash) => {
  try {
    const cached = await Analysis.findOne({ fileHash })
      .populate('reportId')
      .populate('studentId', 'fullName email registrationNumber rollNumber section');

    if (cached) {
      console.log(`Cache hit for hash: ${fileHash}`);
      return cached;
    }
    console.log(`Cache miss for hash: ${fileHash}`);
    return null;
  } catch (error) {
    console.error('Cache check error:', error.message);
    return null;
  }
};

/**
 * Save analysis with file hash for future caching
 */
const saveToCache = async (analysisData) => {
  try {
    const analysis = new Analysis(analysisData);
    await analysis.save();
    return analysis;
  } catch (error) {
    throw new Error(`Failed to save analysis to cache: ${error.message}`);
  }
};

module.exports = { generateFileHash, getCachedAnalysis, saveToCache };
