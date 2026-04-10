const User = require('../models/User');
const Report = require('../models/Report');
const Analysis = require('../models/Analysis');
const { generateAnalysisPDF } = require('../services/reportGeneratorService');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

// @desc   Get all student submissions
// @route  GET /api/teacher/submissions
// @access Private (teacher)
const getSubmissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      section,
      minScore,
      maxScore,
      aiUsageLevel,
      startDate,
      endDate,
      status,
    } = req.query;

    // Build pipeline
    const matchStage = { status: status || 'submitted' };
    if (startDate || endDate) {
      matchStage.teacherSubmittedAt = {};
      if (startDate) matchStage.teacherSubmittedAt.$gte = new Date(startDate);
      if (endDate) matchStage.teacherSubmittedAt.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { teacherSubmittedAt: -1, createdAt: -1 },
      populate: [
        {
          path: 'studentId',
          select: 'fullName email registrationNumber rollNumber section',
        },
        {
          path: 'analysisId',
          select: 'totalScore aiUsagePercentage plagiarismRisk formatCompliance',
        },
      ],
    };

    const result = await Report.paginate(matchStage, options);

    // Apply post-population filters
    let docs = result.docs;

    if (section) {
      docs = docs.filter(r => r.studentId?.section === section);
    }

    if (minScore !== undefined || maxScore !== undefined) {
      docs = docs.filter(r => {
        const score = r.analysisId?.totalScore ?? 0;
        if (minScore !== undefined && score < parseInt(minScore)) return false;
        if (maxScore !== undefined && score > parseInt(maxScore)) return false;
        return true;
      });
    }

    if (aiUsageLevel) {
      docs = docs.filter(r => {
        const aiPct = r.analysisId?.aiUsagePercentage ?? 0;
        if (aiUsageLevel === 'high') return aiPct > 70;
        if (aiUsageLevel === 'medium') return aiPct >= 40 && aiPct <= 70;
        if (aiUsageLevel === 'low') return aiPct < 40;
        return true;
      });
    }

    return res.status(200).json({
      success: true,
      submissions: docs,
      pagination: {
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        limit: result.limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single submission detail
// @route  GET /api/teacher/submission/:id
// @access Private (teacher)
const getSubmissionDetail = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('studentId', 'fullName email registrationNumber rollNumber section')
      .populate('analysisId');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    return res.status(200).json({
      success: true,
      submission: report,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Download original report file
// @route  GET /api/teacher/download/report/:id
// @access Private (teacher)
const downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('studentId', 'fullName registrationNumber');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    const studentName = (report.studentId?.fullName || 'student').replace(/\s+/g, '_');
    const fileName = `${studentName}_${report.originalName || report.fileName}`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(report.filePath);
    fileStream.pipe(res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Download AI analysis PDF for a submission
// @route  GET /api/teacher/download/analysis/:id
// @access Private (teacher)
const downloadAnalysisPDF = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('studentId', 'fullName email registrationNumber rollNumber section')
      .populate('analysisId');

    if (!report || !report.analysisId) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    const pdfBuffer = await generateAnalysisPDF(
      report.analysisId,
      report.studentId,
      report
    );

    const studentName = (report.studentId?.fullName || 'student').replace(/\s+/g, '_');
    const fileName = `${studentName}_Analysis_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Download both report and analysis as ZIP
// @route  GET /api/teacher/download/zip/:id
// @access Private (teacher)
const downloadZip = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('studentId', 'fullName email registrationNumber rollNumber section')
      .populate('analysisId');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const studentName = (report.studentId?.fullName || 'student').replace(/\s+/g, '_');
    const zipName = `${studentName}_Submission_${Date.now()}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // Add original report file
    if (report.filePath && fs.existsSync(report.filePath)) {
      archive.file(report.filePath, { name: `original_report_${report.originalName || report.fileName}` });
    }

    // Add analysis PDF
    if (report.analysisId) {
      const pdfBuffer = await generateAnalysisPDF(report.analysisId, report.studentId, report);
      archive.append(pdfBuffer, { name: `${studentName}_AI_Analysis.pdf` });
    }

    await archive.finalize();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get teacher dashboard stats
// @route  GET /api/teacher/stats
// @access Private (teacher)
const getStats = async (req, res) => {
  try {
    const totalSubmissions = await Report.countDocuments({ status: 'submitted' });
    const pendingReviews = await Report.countDocuments({ status: 'submitted' });

    const analyses = await Analysis.find().select('totalScore aiUsagePercentage studentId');

    const avgScore = analyses.length
      ? Math.round(analyses.reduce((sum, a) => sum + a.totalScore, 0) / analyses.length)
      : 0;

    const highAIAlerts = analyses.filter(a => a.aiUsagePercentage > 70).length;

    // Section-wise breakdown
    const sectionStats = await Report.aggregate([
      { $match: { status: 'submitted' } },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $group: {
          _id: '$student.section',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalSubmissions,
        pendingReviews,
        averageScore: avgScore,
        highAIAlerts,
        sectionStats,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSubmissions,
  getSubmissionDetail,
  downloadReport,
  downloadAnalysisPDF,
  downloadZip,
  getStats,
};
