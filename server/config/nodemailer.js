const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
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
