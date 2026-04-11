const crypto = require("crypto");
const nodemailer = require("nodemailer");

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt for uniform distribution (no modulo bias).
 * @returns {string} 6-digit OTP string
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create a reusable Nodemailer transporter (Gmail SMTP).
 * Reads credentials from environment variables.
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Send OTP email to parent.
 * @param {string} to - Parent's email address
 * @param {string} otp - The 6-digit OTP
 * @param {string} studentName - Name of the student
 * @param {string} category - Permission category (e.g., "Leave", "Outing")
 * @returns {Promise<object>} Nodemailer send result
 */
async function sendOtpEmail(to, otp, studentName, category = "Permission") {
  const transporter = createTransporter();

  const htmlContent = `
    <div style="font-family: 'Google Sans', Roboto, Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; color: #3c4043;">
      <div style="padding: 32px 24px; border-bottom: 1px solid #f1f3f4; text-align: center;">
        <span style="font-size: 24px; color: #1a73e8; font-weight: 500;">BVRIT SPMS</span>
      </div>
      <div style="padding: 32px 24px; text-align: center;">
        <h2 style="font-size: 22px; color: #202124; margin-top: 0; font-weight: 500;">Parent Approval Required</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #5f6368;">
          Your ward, <strong>${studentName}</strong>, has submitted a <strong>${category}</strong> request.
        </p>
        <p style="font-size: 14px; line-height: 1.5; color: #5f6368; margin-bottom: 32px;">
          Use the following approval code to authorize this request:
        </p>
        <div style="margin: 32px 0;">
          <span style="font-size: 32px; font-weight: 500; letter-spacing: 6px; color: #202124; background-color: #f8f9fa; padding: 16px 32px; border-radius: 4px; border: 1px solid #dadce0;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 12px; color: #d93025; font-weight: 500; margin-top: 32px;">
          This code expires in 5 minutes.
        </p>
      </div>
      <div style="padding: 16px; background-color: #f8f9fa; text-align: center; font-size: 11px; color: #9aa0a6;">
        Smart Permission Management System &copy; ${new Date().getFullYear()}
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"SPMS Verification" <${process.env.EMAIL_USER}>`,
    to,
    subject: `[SPMS] Parent Approval OTP for ${studentName} — ${category} Request`,
    html: htmlContent,
  };

  const result = await transporter.sendMail(mailOptions);
  console.log(`\n-----------------------------------------`);
  console.log(`[OTP DEBUG] Sent to: ${to}`);
  console.log(`[OTP CODE]  👉  ${otp}  👈`);
  console.log(`-----------------------------------------\n`);
  return result;
}

/**
 * Send notification email to faculty/warden.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {object} details - { studentName, rollNo, category, link }
 */
async function sendFacultyNotificationEmail(to, subject, details) {
  const transporter = createTransporter();
  const { studentName, rollNo, category, actionMsg, reason } = details;

  const htmlContent = `
    <div style="font-family: 'Google Sans', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; color: #3c4043;">
      <div style="padding: 32px 24px; border-bottom: 1px solid #f1f3f4;">
        <span style="font-size: 24px; color: #1a73e8; font-weight: 500;">BVRIT SPMS</span>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="font-size: 20px; color: #202124; margin-top: 0; font-weight: 500;">Action Required: Permission Request</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #5f6368;">
          Hello,
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #202124; margin-bottom: 24px;">
          ${actionMsg}
        </p>
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 14px; color: #3c4043; border-collapse: collapse;">
            <tr><td style="padding-bottom: 8px; font-weight: 500;">Student:</td><td style="padding-bottom: 8px;">${studentName} (${rollNo})</td></tr>
            <tr><td style="padding-bottom: 8px; font-weight: 500;">Category:</td><td style="padding-bottom: 8px;">${category}</td></tr>
            ${reason ? `<tr><td style="font-weight: 500;">Reason:</td><td>${reason}</td></tr>` : ''}
          </table>
        </div>
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://spms-frontendf.onrender.com" style="background-color: #1a73e8; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 500; display: inline-block;">View in Portal</a>
        </div>
      </div>
      <div style="padding: 24px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #70757a;">
        <p style="margin: 0;">Smart Permission Management System (SPMS) &copy; ${new Date().getFullYear()}</p>
        <p style="margin: 4px 0 0;">This is an automated notification. Please do not reply to this email.</p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"BVRIT SPMS Notifications" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent
  });
}

/**
 * Send status update email to student.
 */
async function sendStatusNotificationEmail(to, subject, details) {
  const transporter = createTransporter();
  const { studentName, category, status, approverName } = details;

  const isApproved = status.includes('Approved');
  const accentColor = isApproved ? '#1e8e3e' : '#d93025';

  const htmlContent = `
    <div style="font-family: 'Google Sans', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; color: #3c4043;">
      <div style="padding: 32px 24px; border-bottom: 1px solid #f1f3f4;">
        <span style="font-size: 24px; color: #1a73e8; font-weight: 500;">BVRIT SPMS</span>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="font-size: 20px; color: #202124; margin-top: 0; font-weight: 500;">Request Update</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #5f6368;">
          Hello ${studentName},
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #202124;">
          Your <strong>${category}</strong> request has been <span style="color: ${accentColor}; font-weight: bold;">${status}</span>.
        </p>
        <p style="font-size: 14px; color: #5f6368; margin-bottom: 24px;">
          Action taken by: <strong>${approverName}</strong>
        </p>
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://spms-frontendf.onrender.com" style="background-color: #1a73e8; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 500; display: inline-block;">Open Dashboard</a>
        </div>
      </div>
      <div style="padding: 24px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #70757a;">
        <p style="margin: 0;">Smart Permission Management System (SPMS) &copy; ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"BVRIT SPMS Status" <${process.env.EMAIL_USER}>`,
    to,
    subject: `[Update] Your Request is ${status}`,
    html: htmlContent
  });
}

/**
 * Send OTP for student/faculty registration.
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP
 */
async function sendRegistrationOtpEmail(to, otp) {
  const transporter = createTransporter();

  const htmlContent = `
    <div style="font-family: 'Google Sans', Roboto, Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; color: #3c4043;">
      <div style="padding: 32px 24px; border-bottom: 1px solid #f1f3f4; text-align: center;">
        <span style="font-size: 24px; color: #1a73e8; font-weight: 500;">BVRIT SPMS</span>
      </div>
      <div style="padding: 32px 24px; text-align: center;">
        <h2 style="font-size: 22px; color: #202124; margin-top: 0; font-weight: 500;">Verify your email</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #5f6368; margin-bottom: 32px;">
          Use the following verification code to complete your registration for the Smart Permission Management System.
        </p>
        <div style="margin: 32px 0;">
          <span style="font-size: 32px; font-weight: 500; letter-spacing: 6px; color: #202124; background-color: #f8f9fa; padding: 16px 32px; border-radius: 4px; border: 1px solid #dadce0;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 12px; color: #70757a; margin-top: 32px;">
          This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      <div style="padding: 16px; background-color: #f8f9fa; text-align: center; font-size: 11px; color: #9aa0a6;">
        Smart Permission Management System &copy; ${new Date().getFullYear()}
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"BVRIT Accounts" <${process.env.EMAIL_USER}>`,
    to,
    subject: "[SPMS] Verify your email address",
    html: htmlContent
  });
}

module.exports = { generateOTP, sendOtpEmail, sendFacultyNotificationEmail, sendRegistrationOtpEmail, sendStatusNotificationEmail };
