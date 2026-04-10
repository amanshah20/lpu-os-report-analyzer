const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireTeacher } = require('../middleware/roleMiddleware');
const {
  getSubmissions,
  getSubmissionDetail,
  downloadReport,
  downloadAnalysisPDF,
  downloadZip,
  getStats,
} = require('../controllers/teacherController');

router.use(protect, requireTeacher);

router.get('/submissions', getSubmissions);
router.get('/submission/:id', getSubmissionDetail);
router.get('/download/report/:id', downloadReport);
router.get('/download/analysis/:id', downloadAnalysisPDF);
router.get('/download/zip/:id', downloadZip);
router.get('/stats', getStats);

module.exports = router;
