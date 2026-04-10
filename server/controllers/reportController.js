const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Analysis = require('../models/Analysis');
const { extractText } = require('../services/pdfExtractService');
const { analyseReport, generateFormattedReport } = require('../services/geminiService');
const { generateFileHash, getCachedAnalysis } = require('../utils/cacheChecker');
const { generateAnalysisPDF, generateGeneratedReportPDF } = require('../services/reportGeneratorService');

// @desc   Upload a report file
// @route  POST /api/report/upload
// @access Private (student)
const uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { submissionType = 'self' } = req.body;
    const file = req.file;

    // Determine file type
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const allowedTypes = ['pdf', 'docx', 'doc', 'xlsx', 'xls'];
    if (!allowedTypes.includes(ext)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: 'Unsupported file type' });
    }

    // Generate file hash
    const fileHash = generateFileHash(file.path);

    // Create report record
    const report = await Report.create({
      studentId: req.user._id,
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileType: ext,
      fileSize: file.size,
      fileHash,
      submissionType: ['self', 'direct'].includes(submissionType) ? submissionType : 'self',
      status: 'uploaded',
    });

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      report: {
        _id: report._id,
        fileName: report.fileName,
        originalName: report.originalName,
        fileType: report.fileType,
        fileSize: report.fileSize,
        fileHash: report.fileHash,
        submissionType: report.submissionType,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Analyse a report using Gemini AI (with caching)
// @route  POST /api/report/analyse/:id
// @access Private (student)
const analyseReportById = async (req, res) => {
  try {
    const configuredProvider = String(process.env.AI_PROVIDER || '').toLowerCase();
    const localFallbackEnabled = String(process.env.AI_LOCAL_FALLBACK || 'true').toLowerCase() !== 'false';
    const enforceProviderOnCache = configuredProvider === 'xai' && !localFallbackEnabled;

    const report = await Report.findOne({ _id: req.params.id, studentId: req.user._id });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ success: false, message: 'Report file not found on server' });
    }

    // Check cache first
    const cached = await getCachedAnalysis(report.fileHash);
    if (cached) {
      const cachedProvider = String(cached.aiProvider || '').toLowerCase();
      const cacheProviderMatches = !enforceProviderOnCache || cachedProvider === 'xai';

      if (!cacheProviderMatches) {
        console.log(`Cache provider mismatch for hash ${report.fileHash}. Expected xai, got ${cachedProvider || 'unknown'}. Re-analysing.`);
      } else {
      // Update report with cached analysis
        report.status = 'analysed';
        report.analysisId = cached._id;
        await report.save();

        return res.status(200).json({
          success: true,
          message: 'Analysis retrieved from cache',
          analysis: cached,
          cached: true,
        });
      }
    }

    // Extract text from file
    let extractedText;
    try {
      extractedText = await extractText(report.filePath, report.fileType);
    } catch (extractError) {
      return res.status(422).json({
        success: false,
        message: `Failed to extract text: ${extractError.message}`,
      });
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract sufficient text from the file. Please ensure the file is not empty or password-protected.',
      });
    }

    // Call configured AI provider (or local fallback)
    let analysisResult;
    try {
      analysisResult = await analyseReport(extractedText);
    } catch (geminiError) {
      const errorMessage = String(geminiError.message || 'AI analysis failed');
      const isQuotaError = errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota exceeded');
      const lowerError = errorMessage.toLowerCase();
      const isXAICreditError =
        lowerError.includes('x.ai') &&
        (lowerError.includes('doesn\'t have any credits') || lowerError.includes('does not have any credits') || lowerError.includes('credits or licenses'));

      let adminMessage = 'AI analysis failed. Check provider configuration and logs.';
      if (isXAICreditError) {
        adminMessage = 'xAI credits exhausted or no license on the configured team. Add credits/license in xAI console and retry.';
      } else if (isQuotaError) {
        adminMessage = 'AI provider quota limit reached. Increase quota or wait for reset.';
      }

      // Keep provider details in server logs, but send a simple message to students.
      console.error('AI analysis error:', errorMessage);

      return res.status(isQuotaError ? 429 : 503).json({
        success: false,
        message: 'Sorry, analysis failed. Please try again.',
        adminMessage,
      });
    }

    // Save analysis
    const analysis = await Analysis.create({
      reportId: report._id,
      studentId: req.user._id,
      fileHash: report.fileHash,
      ...analysisResult.data,
      geminiResponse: analysisResult.rawResponse,
      analysisMode: analysisResult.analysisMode || 'ai',
      aiProvider: analysisResult.providerUsed || '',
      providerModel: analysisResult.modelUsed || '',
      fallbackReason: analysisResult.fallbackReason || '',
      cached: false,
    });

    // Update report status
    report.status = report.submissionType === 'direct' ? 'submitted' : 'analysed';
    report.analysisId = analysis._id;
    if (report.submissionType === 'direct') {
      report.teacherSubmittedAt = new Date();
    }
    await report.save();

    return res.status(200).json({
      success: true,
      message: 'Analysis completed successfully',
      analysis,
      cached: false,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get analysis for a report
// @route  GET /api/report/analysis/:id
// @access Private
const getAnalysis = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      studentId: req.user._id,
    }).populate('analysisId');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (!report.analysisId) {
      return res.status(404).json({ success: false, message: 'Analysis not found for this report' });
    }

    return res.status(200).json({
      success: true,
      analysis: report.analysisId,
      report: {
        _id: report._id,
        fileName: report.originalName || report.fileName,
        fileType: report.fileType,
        submissionType: report.submissionType,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Generate final structured report text
// @route  POST /api/report/generate-report/:id
// @access Private (student)
const generateStructuredReportById = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, studentId: req.user._id })
      .populate('analysisId');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (!report.analysisId) {
      return res.status(400).json({ success: false, message: 'Please analyse report first.' });
    }

    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ success: false, message: 'Report file not found on server' });
    }

    let extractedText = '';
    try {
      extractedText = await extractText(report.filePath, report.fileType);
    } catch (extractError) {
      return res.status(422).json({ success: false, message: `Failed to extract text: ${extractError.message}` });
    }

    let draft;
    try {
      draft = await generateFormattedReport(extractedText, report.analysisId);
    } catch (generationError) {
      const errorMessage = String(generationError.message || 'AI report generation failed');
      const lowerError = errorMessage.toLowerCase();
      const isQuotaError = errorMessage.includes('429') || lowerError.includes('quota exceeded');
      const isXAICreditError =
        lowerError.includes('x.ai') &&
        (lowerError.includes('doesn\'t have any credits') || lowerError.includes('does not have any credits') || lowerError.includes('credits or licenses'));

      let adminMessage = 'AI report generation failed. Check provider configuration and logs.';
      if (isXAICreditError) {
        adminMessage = 'xAI credits exhausted or no license on the configured team. Add credits/license in xAI console and retry.';
      } else if (isQuotaError) {
        adminMessage = 'AI provider quota limit reached. Increase quota or wait for reset.';
      }

      console.error('AI report generation error:', errorMessage);

      return res.status(isQuotaError ? 429 : 503).json({
        success: false,
        message: 'Sorry, report generation failed. Please try again.',
        adminMessage,
      });
    }

    const analysis = await Analysis.findById(report.analysisId._id);
    analysis.generatedReportText = draft.text;
    analysis.generatedReportMode = draft.mode || 'ai';
    analysis.generatedReportProvider = draft.providerUsed || '';
    analysis.generatedReportModel = draft.modelUsed || '';
    analysis.generatedReportUpdatedAt = new Date();
    await analysis.save();

    return res.status(200).json({
      success: true,
      generatedReport: {
        text: analysis.generatedReportText,
        mode: analysis.generatedReportMode,
        provider: analysis.generatedReportProvider,
        model: analysis.generatedReportModel,
        updatedAt: analysis.generatedReportUpdatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Submit analysis to teacher
// @route  POST /api/report/submit/:id
// @access Private (student)
const submitToTeacher = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, studentId: req.user._id });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (!report.analysisId) {
      return res.status(400).json({ success: false, message: 'Please analyse the report first before submitting' });
    }

    if (report.status === 'submitted') {
      return res.status(400).json({ success: false, message: 'Report already submitted to teacher' });
    }

    report.status = 'submitted';
    report.teacherSubmittedAt = new Date();
    await report.save();

    return res.status(200).json({
      success: true,
      message: 'Report submitted to teacher successfully',
      report: {
        _id: report._id,
        status: report.status,
        teacherSubmittedAt: report.teacherSubmittedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Download analysis as PDF
// @route  GET /api/report/download/analysis/:id
// @access Private (student)
const downloadAnalysisPDF = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, studentId: req.user._id })
      .populate('analysisId')
      .populate('studentId', 'fullName email registrationNumber rollNumber section');

    if (!report || !report.analysisId) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    const student = await require('../models/User').findById(req.user._id);

    const pdfBuffer = await generateAnalysisPDF(report.analysisId, student, report);

    const studentName = (student.fullName || 'student').replace(/\s+/g, '_');
    const fileName = `${studentName}_Analysis_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Download generated report as PDF
// @route  GET /api/report/download/generated-report/:id
// @access Private (student)
const downloadGeneratedReportPDFById = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, studentId: req.user._id })
      .populate('analysisId')
      .populate('studentId', 'fullName email registrationNumber rollNumber section');

    if (!report || !report.analysisId) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    const analysis = report.analysisId;
    if (!analysis.generatedReportText || !analysis.generatedReportText.trim()) {
      return res.status(404).json({ success: false, message: 'No generated report found. Please generate report first.' });
    }

    const student = await require('../models/User').findById(req.user._id);

    const pdfBuffer = await generateGeneratedReportPDF(
      analysis.generatedReportText,
      student,
      report,
      {
        mode: analysis.generatedReportMode,
        provider: analysis.generatedReportProvider,
        model: analysis.generatedReportModel,
        updatedAt: analysis.generatedReportUpdatedAt,
      }
    );

    const studentName = (student.fullName || 'student').replace(/\s+/g, '_');
    const fileName = `${studentName}_Generated_Report_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete generated report content for a report
// @route  DELETE /api/report/generated-report/:id
// @access Private (student)
const deleteGeneratedReportById = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, studentId: req.user._id })
      .populate('analysisId');

    if (!report || !report.analysisId) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    const analysis = await Analysis.findById(report.analysisId._id);
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    analysis.generatedReportText = '';
    analysis.generatedReportMode = '';
    analysis.generatedReportProvider = '';
    analysis.generatedReportModel = '';
    analysis.generatedReportUpdatedAt = null;
    await analysis.save();

    return res.status(200).json({
      success: true,
      message: 'Generated report deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete a report
// @route  DELETE /api/report/:id
// @access Private (student)
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, studentId: req.user._id });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.filePath && fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }

    if (report.analysisId) {
      const linkedReportsCount = await Report.countDocuments({ analysisId: report.analysisId });
      if (linkedReportsCount <= 1) {
        await Analysis.findByIdAndDelete(report.analysisId);
      }
    }

    await report.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadReport,
  analyseReportById,
  getAnalysis,
  generateStructuredReportById,
  submitToTeacher,
  downloadAnalysisPDF,
  downloadGeneratedReportPDFById,
  deleteGeneratedReportById,
  deleteReport,
};
