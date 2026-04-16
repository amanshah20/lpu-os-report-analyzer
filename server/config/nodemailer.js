const nodemailer = require('nodemailer');

let transporter = null;

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const getTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER and EMAIL_PASS are required for OTP email delivery');
    }

    const hasCustomSmtp = !!process.env.SMTP_HOST;

    transporter = nodemailer.createTransport(
      hasCustomSmtp
        ? {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: toBool(process.env.SMTP_SECURE, false),
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          }
        : {
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          }
    );
  }
  return transporter;
};

const verifyTransporter = async () => {
  try {
    const t = getTransporter();
    await t.verify();
    console.log('Email transporter verified successfully');
    return true;
  } catch (error) {
    console.error('Email transporter verification failed:', error.message);
    return false;
  }
};

module.exports = { getTransporter, verifyTransporter };
