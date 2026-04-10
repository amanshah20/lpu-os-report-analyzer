const PDFDocument = require('pdfkit');

const SECTION_LABELS = {
  projectOverview: 'Project Overview',
  moduleBreakdown: 'Module-Wise Breakdown',
  functionalities: 'Functionalities',
  technologyUsed: 'Technology Used',
  flowDiagram: 'Flow Diagram',
  githubTracking: 'GitHub Revision Tracking',
  conclusion: 'Conclusion and Future Scope',
  references: 'References',
  appendixAI: 'Appendix A: AI Elaboration',
  problemStatement: 'Appendix B: Problem Statement',
  solutionCode: 'Appendix C: Solution/Code',
};

const SECTION_MAX = {
  projectOverview: 10,
  moduleBreakdown: 10,
  functionalities: 10,
  technologyUsed: 10,
  flowDiagram: 10,
  githubTracking: 10,
  conclusion: 10,
  references: 5,
  appendixAI: 10,
  problemStatement: 5,
  solutionCode: 10,
};

const getScoreColor = (score, max) => {
  const pct = (score / max) * 100;
  if (pct >= 86) return '#22c55e'; // green
  if (pct >= 71) return '#84cc16'; // yellow-green
  if (pct >= 41) return '#E07B39'; // orange
  return '#ef4444'; // red
};

const generateAnalysisPDF = (analysis, student, report) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
          Title: 'OS Lab Report Analysis',
          Author: 'LPU OS Lab Analyser',
          Subject: `Analysis for ${student.fullName}`,
        },
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const primaryColor = '#E07B39';
      const navyColor = '#1A1A2E';
      const accentColor = '#F5A623';
      const textColor = '#1A1A2E';
      const lightGray = '#F5F5F5';
      const medGray = '#666666';

      // ─── HEADER ────────────────────────────────────────────────
      // LPU Header Bar
      doc.rect(0, 0, doc.page.width, 100).fill(navyColor);

      // LPU Logo placeholder (circular design)
      doc.circle(80, 50, 32).fill(primaryColor);
      doc.circle(80, 50, 28).fill(navyColor);
      doc.fontSize(18).fillColor('#FFFFFF').font('Helvetica-Bold').text('LPU', 62, 41);

      // Title
      doc.fontSize(20).fillColor('#FFFFFF').font('Helvetica-Bold')
        .text('OS Lab Report Analysis', 130, 28);
      doc.fontSize(11).fillColor('#A0A0B0').font('Helvetica')
        .text('Lovely Professional University — AI-Powered Evaluation', 130, 52);
      doc.fontSize(10).fillColor('#A0A0B0')
        .text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 130, 70);

      doc.moveDown(4);

      // ─── STUDENT INFO ───────────────────────────────────────────
      doc.rect(50, 115, doc.page.width - 100, 80).fill(lightGray).stroke('#E0E0E0');
      doc.fillColor(textColor).font('Helvetica-Bold').fontSize(13).text('Student Information', 65, 125);
      doc.font('Helvetica').fontSize(10).fillColor(medGray);
      doc.text(`Name: ${student.fullName || 'N/A'}`, 65, 143);
      doc.text(`Registration No: ${student.registrationNumber || 'N/A'}`, 65, 158);
      doc.text(`Roll No: ${student.rollNumber || 'N/A'}   |   Section: ${student.section || 'N/A'}`, 65, 173);
      doc.text(`Email: ${student.email}`, 280, 143);
      doc.text(`File: ${report.originalName || report.fileName}`, 280, 158);
      doc.text(`Submitted: ${new Date(report.submittedAt || report.createdAt).toLocaleDateString('en-IN')}`, 280, 173);

      doc.moveDown(5);

      // ─── TOTAL SCORE ────────────────────────────────────────────
      doc.y = 210;
      const scoreColor = analysis.totalScore >= 86 ? '#22c55e'
        : analysis.totalScore >= 71 ? '#84cc16'
        : analysis.totalScore >= 41 ? '#E07B39' : '#ef4444';

      doc.rect(50, doc.y, doc.page.width - 100, 70).fill(scoreColor).fillOpacity(0.1).stroke(scoreColor);
      doc.fillOpacity(1).fillColor(scoreColor).font('Helvetica-Bold').fontSize(36)
        .text(`${analysis.totalScore}/100`, 0, doc.y + 15, { align: 'center' });
      doc.fontSize(12).fillColor(medGray).font('Helvetica')
        .text('TOTAL SCORE', 0, doc.y - 15, { align: 'center' });

      doc.y += 80;

      // Score badges row
      const badgeY = doc.y;
      // Format Compliance
      doc.rect(50, badgeY, 155, 40).fill('#EEF2FF').stroke('#6366f1');
      doc.fontSize(9).fillColor('#6366f1').font('Helvetica-Bold').text('FORMAT COMPLIANCE', 55, badgeY + 6);
      doc.fontSize(16).fillColor('#6366f1').text(`${analysis.formatCompliance}%`, 55, badgeY + 18);

      // AI Usage
      const aiColor = analysis.aiUsagePercentage > 70 ? '#ef4444' : analysis.aiUsagePercentage > 40 ? '#f59e0b' : '#22c55e';
      doc.rect(215, badgeY, 155, 40).fill('#FFF7ED').stroke(aiColor);
      doc.fontSize(9).fillColor(aiColor).font('Helvetica-Bold').text('AI USAGE DETECTED', 220, badgeY + 6);
      doc.fontSize(16).fillColor(aiColor).text(`${analysis.aiUsagePercentage}%`, 220, badgeY + 18);

      // Plagiarism Risk
      const plagColor = analysis.plagiarismRisk === 'High' ? '#ef4444' : analysis.plagiarismRisk === 'Medium' ? '#f59e0b' : '#22c55e';
      doc.rect(380, badgeY, 170, 40).fill('#F0FDF4').stroke(plagColor);
      doc.fontSize(9).fillColor(plagColor).font('Helvetica-Bold').text('PLAGIARISM RISK', 385, badgeY + 6);
      doc.fontSize(16).fillColor(plagColor).text(analysis.plagiarismRisk, 385, badgeY + 18);

      doc.y = badgeY + 55;

      // ─── SECTION SCORES TABLE ───────────────────────────────────
      doc.addPage();
      doc.rect(0, 0, doc.page.width, 45).fill(navyColor);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16)
        .text('Section Scores Breakdown', 50, 14);

      doc.y = 60;
      doc.fillColor(textColor).font('Helvetica-Bold').fontSize(11)
        .text('Section', 50, doc.y).text('Score', 380, doc.y).text('Max', 440, doc.y).text('%', 490, doc.y);

      doc.moveTo(50, doc.y + 15).lineTo(550, doc.y + 15).stroke('#E0E0E0');
      doc.y += 20;

      Object.entries(analysis.sectionScores).forEach(([key, score], idx) => {
        const max = SECTION_MAX[key] || 10;
        const pct = Math.round((score / max) * 100);
        const rowColor = idx % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
        doc.rect(50, doc.y - 3, 500, 18).fill(rowColor);

        const color = getScoreColor(score, max);
        doc.fillColor(textColor).font('Helvetica').fontSize(10)
          .text(SECTION_LABELS[key] || key, 55, doc.y);
        doc.fillColor(color).font('Helvetica-Bold')
          .text(`${score}`, 385, doc.y).text(`${max}`, 445, doc.y).text(`${pct}%`, 495, doc.y);

        // Mini progress bar
        doc.rect(300, doc.y + 3, 70, 6).fill('#E0E0E0');
        doc.rect(300, doc.y + 3, Math.round(70 * pct / 100), 6).fill(color);

        doc.y += 20;
      });

      // ─── OVERALL FEEDBACK ───────────────────────────────────────
      doc.y += 10;
      doc.rect(50, doc.y, 500, 10).fill(primaryColor);
      doc.y += 15;
      doc.fillColor(textColor).font('Helvetica-Bold').fontSize(13).text('Overall Feedback');
      doc.y += 5;
      doc.font('Helvetica').fontSize(10).fillColor(medGray)
        .text(analysis.overallFeedback || 'No feedback provided.', 50, doc.y, { width: 500, lineGap: 3 });

      doc.y += 20;

      // ─── STRENGTHS ──────────────────────────────────────────────
      if (analysis.strengths && analysis.strengths.length > 0) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, 45).fill('#16a34a');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16).text('Strengths', 50, 14);
        doc.y = 60;

        analysis.strengths.forEach((strength, i) => {
          doc.rect(50, doc.y - 2, 500, 22).fill('#F0FDF4').stroke('#bbf7d0');
          doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(10).text(`✓ ${i + 1}.`, 55, doc.y + 4);
          doc.fillColor('#166534').font('Helvetica').text(strength, 80, doc.y + 4, { width: 465 });
          doc.y += 28;
        });
      }

      // ─── MISSING SECTIONS ───────────────────────────────────────
      if (analysis.missingSections && analysis.missingSections.length > 0) {
        doc.y += 10;
        doc.rect(50, doc.y, 500, 6).fill('#ef4444');
        doc.y += 12;
        doc.fillColor(textColor).font('Helvetica-Bold').fontSize(13).text('Missing Sections');
        doc.y += 5;

        analysis.missingSections.forEach((section) => {
          doc.rect(50, doc.y - 2, 500, 20).fill('#FFF1F2').stroke('#fecaca');
          doc.fillColor('#dc2626').font('Helvetica').fontSize(10).text(`✗  ${section}`, 60, doc.y + 3);
          doc.y += 24;
        });
      }

      // ─── MISTAKES ───────────────────────────────────────────────
      if (analysis.mistakes && analysis.mistakes.length > 0) {
        doc.y += 10;
        doc.rect(50, doc.y, 500, 6).fill('#f97316');
        doc.y += 12;
        doc.fillColor(textColor).font('Helvetica-Bold').fontSize(13).text('Mistakes Found');
        doc.y += 5;

        analysis.mistakes.forEach((mistake, i) => {
          doc.rect(50, doc.y - 2, 500, 20).fill('#FFF7ED').stroke('#fed7aa');
          doc.fillColor('#c2410c').font('Helvetica').fontSize(10).text(`${i + 1}. ${mistake}`, 60, doc.y + 3, { width: 480 });
          doc.y += 24;
        });
      }

      // ─── IMPROVEMENTS ───────────────────────────────────────────
      if (analysis.improvements && analysis.improvements.length > 0) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, 45).fill('#2563eb');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16).text('Improvement Suggestions', 50, 14);
        doc.y = 60;

        analysis.improvements.forEach((improvement, i) => {
          doc.rect(50, doc.y - 2, 500, 26).fill('#EFF6FF').stroke('#bfdbfe');
          doc.fillColor('#1d4ed8').font('Helvetica-Bold').fontSize(10).text(`${i + 1}.`, 55, doc.y + 6);
          doc.fillColor('#1e40af').font('Helvetica').text(improvement, 72, doc.y + 6, { width: 470 });
          doc.y += 32;
        });
      }

      // ─── AI USAGE DETAILS ───────────────────────────────────────
      doc.y += 15;
      doc.rect(50, doc.y, 500, 6).fill(accentColor);
      doc.y += 12;
      doc.fillColor(textColor).font('Helvetica-Bold').fontSize(13).text('AI Usage Assessment');
      doc.y += 5;
      doc.font('Helvetica').fontSize(10).fillColor(medGray)
        .text(analysis.aiUsageDetails || 'No AI usage details provided.', 50, doc.y, { width: 500, lineGap: 3 });

      // ─── FOOTER on all pages ────────────────────────────────────
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.rect(0, doc.page.height - 35, doc.page.width, 35).fill(navyColor);
        doc.fillColor('#A0A0B0').font('Helvetica').fontSize(9)
          .text(
            `Generated by LPU OS Lab Analyser  |  Page ${i - range.start + 1} of ${range.count}  |  ${new Date().toLocaleDateString('en-IN')}`,
            50,
            doc.page.height - 22,
            { align: 'center', width: doc.page.width - 100 }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateGeneratedReportPDF = (generatedReportText, student, report, generatedMeta = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
          Title: 'AI Generated Report',
          Author: 'LPU OS Lab Analyser',
          Subject: `Generated report for ${student.fullName || 'Student'}`,
        },
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const navyColor = '#1A1A2E';
      const textColor = '#1A1A2E';
      const medGray = '#666666';

      doc.rect(0, 0, doc.page.width, 90).fill(navyColor);
      doc.fontSize(20).fillColor('#FFFFFF').font('Helvetica-Bold')
        .text('AI Generated Report', 50, 30);
      doc.fontSize(10).fillColor('#B8B8CC').font('Helvetica')
        .text('LPU OS Lab Analyser', 50, 58);

      doc.y = 110;
      doc.fillColor(textColor).font('Helvetica-Bold').fontSize(12).text('Student Information');
      doc.moveDown(0.4);
      doc.font('Helvetica').fontSize(10).fillColor(medGray);
      doc.text(`Name: ${student.fullName || 'N/A'}`);
      doc.text(`Registration No: ${student.registrationNumber || 'N/A'}`);
      doc.text(`Email: ${student.email || 'N/A'}`);
      doc.text(`File: ${report.originalName || report.fileName || 'N/A'}`);
      doc.text(`Generated At: ${new Date().toLocaleString('en-IN')}`);

      if (generatedMeta.provider || generatedMeta.model || generatedMeta.mode) {
        doc.moveDown(0.7);
        doc.font('Helvetica-Bold').fillColor(textColor).fontSize(11).text('Generation Metadata');
        doc.moveDown(0.4);
        doc.font('Helvetica').fontSize(10).fillColor(medGray);
        if (generatedMeta.mode) doc.text(`Mode: ${generatedMeta.mode}`);
        if (generatedMeta.provider) doc.text(`Provider: ${generatedMeta.provider}`);
        if (generatedMeta.model) doc.text(`Model: ${generatedMeta.model}`);
        if (generatedMeta.updatedAt) {
          doc.text(`Updated At: ${new Date(generatedMeta.updatedAt).toLocaleString('en-IN')}`);
        }
      }

      doc.moveDown(1);
      doc.rect(50, doc.y, 495, 1).fill('#E5E7EB');
      doc.moveDown(0.8);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(textColor).text('Generated Report Content');
      doc.moveDown(0.6);
      doc.font('Helvetica').fontSize(10.5).fillColor('#222222').text(
        String(generatedReportText || 'No generated report content available.'),
        {
          width: 495,
          align: 'left',
          lineGap: 3,
        }
      );

      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill(navyColor);
        doc.fillColor('#B8B8CC').font('Helvetica').fontSize(9)
          .text(
            `Generated by LPU OS Lab Analyser | Page ${i - range.start + 1} of ${range.count}`,
            50,
            doc.page.height - 20,
            { align: 'center', width: doc.page.width - 100 }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateAnalysisPDF, generateGeneratedReportPDF };
