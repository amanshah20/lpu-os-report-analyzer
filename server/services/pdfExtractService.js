const fs = require('fs');
const path = require('path');

const extractTextFromPDF = async (filePath) => {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF extraction error:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

const extractTextFromDOCX = async (filePath) => {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  } catch (error) {
    console.error('DOCX extraction error:', error.message);
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
};

const extractTextFromXLSX = async (filePath) => {
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    let fullText = '';

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const csvData = XLSX.utils.sheet_to_csv(sheet);
      fullText += `\n--- Sheet: ${sheetName} ---\n${csvData}\n`;
    });

    return fullText;
  } catch (error) {
    console.error('XLSX extraction error:', error.message);
    throw new Error(`Failed to extract text from XLSX: ${error.message}`);
  }
};

const extractText = async (filePath, fileType) => {
  const type = fileType.toLowerCase().replace('.', '');

  switch (type) {
    case 'pdf':
      return extractTextFromPDF(filePath);
    case 'docx':
    case 'doc':
      return extractTextFromDOCX(filePath);
    case 'xlsx':
    case 'xls':
      return extractTextFromXLSX(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};

module.exports = { extractText, extractTextFromPDF, extractTextFromDOCX, extractTextFromXLSX };
