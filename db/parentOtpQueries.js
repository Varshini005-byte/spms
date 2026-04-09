/**
 * Database query layer for Parent OTP Verification.
 * All functions accept a `pool` (pg Pool) instance.
 */

/**
 * Get student info along with parent_email.
 */
async function getStudentWithParent(pool, studentId) {
  const result = await pool.query(
    `SELECT id, name, email, parent_email, residence_type
     FROM users WHERE id = $1`,
    [studentId]
  );
  return result.rows[0] || null;
}

/**
 * Get a permission by ID.
 */
async function getPermissionById(pool, permissionId) {
  const result = await pool.query(
    `SELECT * FROM permissions WHERE id = $1`,
    [permissionId]
  );
  return result.rows[0] || null;
}

/**
 * Count OTPs created for a student in the last 60 seconds (rate limiting).
 */
async function countRecentOtps(pool, studentId) {
  const result = await pool.query(
    `SELECT COUNT(*) AS count FROM parent_otp_verifications
     WHERE student_id = $1 AND created_at > NOW() - INTERVAL '1 minute'`,
    [studentId]
  );
  return parseInt(result.rows[0].count, 10);
}

/**
 * Invalidate (delete) all previous unverified OTPs for a student + permission.
 */
async function invalidatePreviousOtps(pool, studentId, permissionId) {
  await pool.query(
    `DELETE FROM parent_otp_verifications
     WHERE student_id = $1 AND permission_id = $2 AND verified = FALSE`,
    [studentId, permissionId]
  );
}

/**
 * Insert a new OTP record.
 */
async function createOtpRecord(pool, studentId, permissionId, parentContact, otp, expiresAt) {
  const result = await pool.query(
    `INSERT INTO parent_otp_verifications 
       (student_id, permission_id, parent_contact, otp, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [studentId, permissionId, parentContact, otp, expiresAt]
  );
  return result.rows[0];
}

/**
 * Find a valid (unexpired, unverified) OTP for a student.
 */
async function findValidOtp(pool, studentId, otp) {
  const result = await pool.query(
    `SELECT * FROM parent_otp_verifications
     WHERE student_id = $1 
       AND otp = $2 
       AND verified = FALSE 
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [studentId, otp]
  );
  return result.rows[0] || null;
}

/**
 * Mark an OTP as verified (single-use).
 */
async function markOtpVerified(pool, otpId) {
  await pool.query(
    `UPDATE parent_otp_verifications SET verified = TRUE WHERE id = $1`,
    [otpId]
  );
}

/**
 * Increment the attempts counter on failed verification.
 */
async function incrementAttempts(pool, otpId) {
  await pool.query(
    `UPDATE parent_otp_verifications SET attempts = attempts + 1 WHERE id = $1`,
    [otpId]
  );
}

/**
 * Update the parent status on a permission.
 */
async function updatePermissionParentStatus(pool, permissionId, status) {
  await pool.query(
    `UPDATE permissions SET status_parent = $1 WHERE id = $2`,
    [status, permissionId]
  );
}

/**
 * Check and update final_status if all approvals are complete.
 * Mirrors the logic in server.js PUT /permissions/:id.
 */
async function checkAndUpdateFinalStatus(pool, permissionId) {
  const result = await pool.query(
    `SELECT * FROM permissions WHERE id = $1`,
    [permissionId]
  );
  if (result.rows.length === 0) return;

  const p = result.rows[0];
  if (p.final_status !== "Pending") return;

  const cOk = p.status_counselor === "N/A" || p.status_counselor === "Approved";
  const tOk = p.status_class_teacher === "N/A" || p.status_class_teacher === "Approved";
  const hOk = p.status_hod === "N/A" || p.status_hod === "Approved";
  const wOk = p.status_warden === "N/A" || p.status_warden === "Approved";
  const pOk = p.status_parent === "N/A" || p.status_parent === "Approved";

  if (cOk && tOk && hOk && wOk && pOk) {
    await pool.query(
      `UPDATE permissions SET final_status = 'Approved' WHERE id = $1`,
      [permissionId]
    );
  }
}

/**
 * Log an OTP action for audit trail.
 */
async function logOtpAction(pool, studentId, permissionId, action, ipAddress) {
  try {
    await pool.query(
      `INSERT INTO otp_audit_log (student_id, permission_id, action, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [studentId, permissionId, action, ipAddress]
    );
  } catch (err) {
    // Non-critical — don't block the main flow
    console.error("[OTP Audit] Logging failed:", err.message);
  }
}

module.exports = {
  getStudentWithParent,
  getPermissionById,
  countRecentOtps,
  invalidatePreviousOtps,
  createOtpRecord,
  findValidOtp,
  markOtpVerified,
  incrementAttempts,
  updatePermissionParentStatus,
  checkAndUpdateFinalStatus,
  logOtpAction,
};
