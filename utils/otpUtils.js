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
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 600;">
          🔐 SPMS — Parent Verification
        </h1>
      </div>

      <!-- Body -->
      <div style="padding: 32px 24px;">
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          Dear Parent,
        </p>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          Your ward <strong>${studentName}</strong> has submitted a 
          <strong>${category}</strong> request that requires your approval.
        </p>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Please use the following OTP to approve the request:
        </p>

        <!-- OTP Box -->
        <div style="text-align: center; margin: 0 0 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 16px 40px; border-radius: 12px; border: 2px dashed #667eea;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #333;">
              ${otp}
            </span>
          </div>
        </div>

        <p style="color: #e74c3c; font-size: 13px; text-align: center; margin: 0 0 16px; font-weight: 600;">
          ⏱ This OTP expires in 5 minutes
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

        <p style="color: #888; font-size: 12px; line-height: 1.5; margin: 0;">
          If you did not expect this request, please ignore this email or contact the institution.<br/>
          Do not share this OTP with anyone.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f8f9fa; padding: 16px 24px; text-align: center;">
        <p style="color: #aaa; font-size: 11px; margin: 0;">
          Smart Permission Management System (SPMS) &copy; ${new Date().getFullYear()}
        </p>
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
  console.log(`[OTP] Email sent to ${to} | MessageId: ${result.messageId}`);
  return result;
}

module.exports = { generateOTP, sendOtpEmail };
