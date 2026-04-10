const { getTransporter } = require('../config/nodemailer');

const sendOTPEmail = async (email, otp, fullName = '') => {
  const transporter = getTransporter();

  const mailOptions = {
    from: `"LPU OS Lab Analyser" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for LPU OS Lab Analyser',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; background: #0F0F1A; color: #fff; margin: 0; padding: 0; }
          .container { max-width: 500px; margin: 40px auto; background: rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; border: 1px solid rgba(224,123,57,0.2); }
          .header { background: linear-gradient(135deg, #E07B39, #F5A623); padding: 32px; text-align: center; }
          .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 700; }
          .header p { margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
          .body { padding: 32px; }
          .greeting { color: #A0A0B0; font-size: 15px; margin-bottom: 24px; }
          .otp-box { background: rgba(224,123,57,0.1); border: 2px solid #E07B39; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 42px; font-weight: 700; color: #E07B39; letter-spacing: 8px; margin: 0; }
          .otp-note { color: #A0A0B0; font-size: 12px; margin-top: 8px; }
          .info { color: #A0A0B0; font-size: 13px; line-height: 1.6; }
          .footer { background: rgba(0,0,0,0.3); padding: 16px 32px; text-align: center; }
          .footer p { color: #A0A0B0; font-size: 12px; margin: 0; }
          .lpu-brand { color: #E07B39; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LPU OS Lab Analyser</h1>
            <p>Lovely Professional University</p>
          </div>
          <div class="body">
            <p class="greeting">Hello${fullName ? ` ${fullName}` : ''},</p>
            <p class="info">Your one-time password (OTP) for logging into <span class="lpu-brand">LPU OS Lab Analyser</span> is:</p>
            <div class="otp-box">
              <p class="otp-code">${otp}</p>
              <p class="otp-note">Valid for 10 minutes only</p>
            </div>
            <p class="info">
              If you did not request this OTP, please ignore this email.
              Do not share this OTP with anyone.
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} LPU OS Lab Analyser. All rights reserved.</p>
            <p>Lovely Professional University, Phagwara, Punjab</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error.message);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

const sendWelcomeEmail = async (email, fullName, role) => {
  const transporter = getTransporter();

  const mailOptions = {
    from: `"LPU OS Lab Analyser" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to LPU OS Lab Analyser!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #0F0F1A; color: #fff; }
          .container { max-width: 500px; margin: 40px auto; background: rgba(255,255,255,0.05); border-radius: 16px; border: 1px solid rgba(224,123,57,0.2); overflow: hidden; }
          .header { background: linear-gradient(135deg, #E07B39, #F5A623); padding: 32px; text-align: center; }
          .header h1 { margin: 0; color: #fff; font-size: 24px; }
          .body { padding: 32px; }
          .body p { color: #A0A0B0; line-height: 1.6; }
          .footer { background: rgba(0,0,0,0.3); padding: 16px 32px; text-align: center; }
          .footer p { color: #A0A0B0; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to LPU OS Lab Analyser!</h1>
          </div>
          <div class="body">
            <p>Dear ${fullName},</p>
            <p>Your account has been successfully set up as a <strong style="color: #E07B39;">${role}</strong> on LPU OS Lab Analyser.</p>
            <p>You can now log in and start using the platform to ${role === 'student' ? 'upload and analyse your OS lab reports' : 'review student submissions'}.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} LPU OS Lab Analyser</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Failed to send welcome email:`, error.message);
    // Non-critical, don't throw
  }
};

module.exports = { sendOTPEmail, sendWelcomeEmail };
