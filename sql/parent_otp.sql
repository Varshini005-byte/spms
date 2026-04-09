-- =============================================
-- Parent OTP Authentication — Database Migration
-- =============================================

-- 1. Add parent_email column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_email VARCHAR(100);

-- 2. Create parent_otp_verifications table
CREATE TABLE IF NOT EXISTS parent_otp_verifications (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  parent_contact VARCHAR(100) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_otp_student_verified
  ON parent_otp_verifications(student_id, verified);

CREATE INDEX IF NOT EXISTS idx_otp_permission
  ON parent_otp_verifications(permission_id);

CREATE INDEX IF NOT EXISTS idx_otp_expires
  ON parent_otp_verifications(expires_at);

-- 4. OTP attempt logging table (optional enhancement)
CREATE TABLE IF NOT EXISTS otp_audit_log (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  permission_id INTEGER,
  action VARCHAR(20) NOT NULL,        -- 'SENT', 'VERIFIED', 'FAILED', 'EXPIRED', 'RESENT'
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
