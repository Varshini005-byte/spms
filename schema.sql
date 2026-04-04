-- 1. Alter users table to add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS residence_type VARCHAR(50) DEFAULT 'day_scholar';

-- 2. Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id),
  category VARCHAR(50),
  reason TEXT,
  attachment_url TEXT,
  status_faculty VARCHAR(20) DEFAULT 'N/A',
  status_warden VARCHAR(20) DEFAULT 'N/A',
  status_parent VARCHAR(20) DEFAULT 'N/A',
  final_status VARCHAR(20) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
