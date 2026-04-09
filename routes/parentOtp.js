const express = require("express");
const { sendOtp, verifyOtp, resendOtp } = require("../controllers/parentOtpController");

/**
 * Parent OTP routes factory.
 * Accepts the shared pg Pool instance from server.js.
 *
 * Routes:
 *   POST /parent/send-otp     → Generate & send OTP to parent email
 *   POST /parent/verify-otp   → Validate OTP & approve permission
 *   POST /parent/resend-otp   → Invalidate old + send new OTP
 */
function parentOtpRoutes(pool) {
  const router = express.Router();

  router.post("/parent/send-otp", (req, res) => sendOtp(pool, req, res));
  router.post("/parent/verify-otp", (req, res) => verifyOtp(pool, req, res));
  router.post("/parent/resend-otp", (req, res) => resendOtp(pool, req, res));

  return router;
}

module.exports = parentOtpRoutes;
