const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireAny } = require('../middleware/roleMiddleware');
const { getProfile, updateProfile, getReports, getStats } = require('../controllers/studentController');
const { getStudentAnalyses, getAnalysisById } = require('../controllers/analysisController');

router.use(protect);

router.get('/profile', requireAny, getProfile);
router.put('/profile', requireAny, updateProfile);
router.get('/reports', protect, getReports);
router.get('/stats', protect, getStats);
router.get('/analyses', protect, getStudentAnalyses);
router.get('/analysis/:id', protect, getAnalysisById);

module.exports = router;
