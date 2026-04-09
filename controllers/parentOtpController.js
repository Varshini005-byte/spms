const { generateOTP, sendOtpEmail } = require("../utils/otpUtils");
const db = require("../db/parentOtpQueries");

const MAX_OTP_PER_MINUTE = 3;
const OTP_EXPIRY_MINUTES = 5;
const MAX_VERIFY_ATTEMPTS = 5;

/**
 * POST /parent/send-otp
 * Body: { student_id, permission_id }
 * Generates and sends OTP to the student's parent email.
 */
async function sendOtp(pool, req, res) {
  const { student_id, permission_id } = req.body;

  if (!student_id || !permission_id) {
    return res.status(400).json({
      success: false,
      message: "student_id and permission_id are required",
    });
  }

  try {
    // 1. Rate-limit check
    const recentCount = await db.countRecentOtps(pool, student_id);
    if (recentCount >= MAX_OTP_PER_MINUTE) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please wait 1 minute before retrying.",
      });
    }

    // 2. Fetch student + parent email
    const student = await db.getStudentWithParent(pool, student_id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }
    if (!student.parent_email) {
      return res.status(400).json({
        success: false,
        message: "No parent email registered for this student. Please update your profile.",
      });
    }

    // 3. Validate permission exists and needs parent approval
    const permission = await db.getPermissionById(pool, permission_id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission request not found",
      });
    }
    if (permission.status_parent !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Parent approval is not pending (current: ${permission.status_parent})`,
      });
    }

    // 4. Invalidate previous OTPs for this permission
    await db.invalidatePreviousOtps(pool, student_id, permission_id);

    // 5. Generate OTP + expiry
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // 6. Store in database
    await db.createOtpRecord(
      pool,
      student_id,
      permission_id,
      student.parent_email,
      otp,
      expiresAt
    );

    // 7. Send email
    await sendOtpEmail(
      student.parent_email,
      otp,
      student.name,
      permission.category || "Permission"
    );

    // 8. Audit log
    const clientIp = req.ip || req.connection?.remoteAddress || "unknown";
    await db.logOtpAction(pool, student_id, permission_id, "SENT", clientIp);

    console.log(`[OTP] Sent to ${student.parent_email} for student ${student.name} (perm: ${permission_id})`);

    return res.json({
      success: true,
      message: "OTP sent to parent's email",
      data: {
        parent_email_masked: maskEmail(student.parent_email),
        expires_in_seconds: OTP_EXPIRY_MINUTES * 60,
      },
    });
  } catch (err) {
    console.error("[OTP] Send error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
}

/**
 * POST /parent/verify-otp
 * Body: { student_id, otp, permission_id }
 * Validates OTP and approves parent status on the permission.
 */
async function verifyOtp(pool, req, res) {
  const { student_id, otp, permission_id } = req.body;

  if (!student_id || !otp) {
    return res.status(400).json({
      success: false,
      message: "student_id and otp are required",
    });
  }

  try {
    // 1. Find valid OTP
    const otpRecord = await db.findValidOtp(pool, student_id, otp);

    if (!otpRecord) {
      // Log failed attempt
      const clientIp = req.ip || req.connection?.remoteAddress || "unknown";
      await db.logOtpAction(pool, student_id, permission_id || null, "FAILED", clientIp);

      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // 2. Check max verification attempts
    if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Maximum verification attempts exceeded. Please request a new OTP.",
      });
    }

    // 3. Mark OTP as verified (single-use)
    await db.markOtpVerified(pool, otpRecord.id);

    // 4. Update permission status_parent = 'Approved'
    const targetPermId = permission_id || otpRecord.permission_id;
    await db.updatePermissionParentStatus(pool, targetPermId, "Approved");

    // 5. Check if all approvals complete → update final_status
    await db.checkAndUpdateFinalStatus(pool, targetPermId);

    // 6. Audit log
    const clientIp = req.ip || req.connection?.remoteAddress || "unknown";
    await db.logOtpAction(pool, student_id, targetPermId, "VERIFIED", clientIp);

    console.log(`[OTP] Verified for student ${student_id}, permission ${targetPermId}`);

    return res.json({
      success: true,
      message: "OTP verified successfully. Parent approval granted.",
      data: {
        permission_id: targetPermId,
        status_parent: "Approved",
      },
    });
  } catch (err) {
    console.error("[OTP] Verify error:", err);
    return res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
}

/**
 * POST /parent/resend-otp
 * Body: { student_id, permission_id }
 * Invalidates previous OTPs and sends a new one.
 */
async function resendOtp(pool, req, res) {
  // Resend uses the same logic as sendOtp
  // (sendOtp already invalidates previous OTPs)
  console.log("[OTP] Resend requested");
  const clientIp = req.ip || req.connection?.remoteAddress || "unknown";

  // Log the resend action before delegating
  if (req.body.student_id && req.body.permission_id) {
    await db.logOtpAction(pool, req.body.student_id, req.body.permission_id, "RESENT", clientIp);
  }

  return sendOtp(pool, req, res);
}

/**
 * Mask an email for privacy in API responses.
 * "parent@gmail.com" → "p****t@gmail.com"
 */
function maskEmail(email) {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

module.exports = { sendOtp, verifyOtp, resendOtp };
