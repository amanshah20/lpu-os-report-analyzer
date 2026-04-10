const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireStudent } = require('../middleware/roleMiddleware');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');
const {
  uploadReport,
  analyseReportById,
  getAnalysis,
  generateStructuredReportById,
  submitToTeacher,
  downloadAnalysisPDF,
  downloadGeneratedReportPDFById,
  deleteGeneratedReportById,
  deleteReport,
} = require('../controllers/reportController');

router.use(protect);

router.post('/upload', requireStudent, upload.single('report'), handleUploadError, uploadReport);
router.post('/analyse/:id', requireStudent, analyseReportById);
router.get('/analysis/:id', requireStudent, getAnalysis);
router.post('/generate-report/:id', requireStudent, generateStructuredReportById);
router.post('/submit/:id', requireStudent, submitToTeacher);
router.get('/download/analysis/:id', requireStudent, downloadAnalysisPDF);
router.get('/download/generated-report/:id', requireStudent, downloadGeneratedReportPDFById);
router.delete('/generated-report/:id', requireStudent, deleteGeneratedReportById);
router.delete('/:id', requireStudent, deleteReport);

module.exports = router;
