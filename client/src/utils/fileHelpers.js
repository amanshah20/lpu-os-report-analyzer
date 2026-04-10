export const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
};

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.xlsx', '.xls'];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const getFileExtension = (fileName) => {
  return fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
};

export const getFileType = (file) => {
  return ALLOWED_TYPES[file.type] || getFileExtension(file.name).replace('.', '');
};

export const validateFile = (file) => {
  const errors = [];

  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed (10MB)`);
  }

  const ext = getFileExtension(file.name);
  const typeAllowed = ALLOWED_TYPES[file.type] || ALLOWED_EXTENSIONS.includes(ext);

  if (!typeAllowed) {
    errors.push(`File type not supported. Allowed: PDF, DOCX, DOC, XLSX, XLS`);
  }

  return errors;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const getFileIcon = (fileType) => {
  const icons = {
    pdf: '📄',
    docx: '📝',
    doc: '📝',
    xlsx: '📊',
    xls: '📊',
  };
  return icons[fileType?.toLowerCase()] || '📁';
};

export const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
