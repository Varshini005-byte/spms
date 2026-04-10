require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log("Starting migrations...");

    // 1. Alter Users table
    console.log("Altering users table...");
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS residence_type VARCHAR(50) DEFAULT 'day_scholar',
      ADD COLUMN IF NOT EXISTS attendance INTEGER DEFAULT 100,
      ADD COLUMN IF NOT EXISTS counselor_id INTEGER,
      ADD COLUMN IF NOT EXISTS class_teacher_id INTEGER,
      ADD COLUMN IF NOT EXISTS hod_id INTEGER,
      ADD COLUMN IF NOT EXISTS department VARCHAR(100),
      ADD COLUMN IF NOT EXISTS section VARCHAR(20),
      ADD COLUMN IF NOT EXISTS sub_role VARCHAR(50),
      ADD COLUMN IF NOT EXISTS roll_no VARCHAR(20) UNIQUE,
      ADD COLUMN IF NOT EXISTS faculty_id VARCHAR(20) UNIQUE,
      ADD COLUMN IF NOT EXISTS phone_no VARCHAR(15) UNIQUE,
      ADD COLUMN IF NOT EXISTS parent_of_roll_no VARCHAR(20),
      ADD COLUMN IF NOT EXISTS parent_email VARCHAR(100);
    `);

    // 1.5. Create OTP tables
    console.log("Creating OTP verification tables...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parent_otp_verifications (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id),
        permission_id INTEGER,
        parent_contact VARCHAR(100),
        otp VARCHAR(6),
        verified BOOLEAN DEFAULT FALSE,
        attempts INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS otp_audit_log (
        id SERIAL PRIMARY KEY,
        student_id INTEGER,
        permission_id INTEGER,
        action VARCHAR(100),
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create Permissions table
    console.log("Creating/Updating permissions table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id),
        category VARCHAR(50),
        reason TEXT,
        attachment_url TEXT,
        status_counselor VARCHAR(20) DEFAULT 'Pending',
        c_approved_at TIMESTAMP,
        c_name VARCHAR(100),
        status_class_teacher VARCHAR(20) DEFAULT 'N/A',
        t_approved_at TIMESTAMP,
        t_name VARCHAR(100),
        status_hod VARCHAR(20) DEFAULT 'N/A',
        h_approved_at TIMESTAMP,
        h_name VARCHAR(100),
        status_warden VARCHAR(20) DEFAULT 'N/A',
        w_approved_at TIMESTAMP,
        w_name VARCHAR(100),
        status_parent VARCHAR(20) DEFAULT 'N/A',
        final_status VARCHAR(20) DEFAULT 'Pending',
        priority VARCHAR(20) DEFAULT 'Normal',
        suspicious_flag BOOLEAN DEFAULT FALSE,
        rejected_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Adding missing columns to permissions...");
    await pool.query(`
      ALTER TABLE permissions 
      ADD COLUMN IF NOT EXISTS status_counselor VARCHAR(20) DEFAULT 'Pending',
      ADD COLUMN IF NOT EXISTS c_approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS c_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS status_class_teacher VARCHAR(20) DEFAULT 'N/A',
      ADD COLUMN IF NOT EXISTS t_approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS t_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS status_hod VARCHAR(20) DEFAULT 'N/A',
      ADD COLUMN IF NOT EXISTS h_approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS h_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS status_warden VARCHAR(20) DEFAULT 'N/A',
      ADD COLUMN IF NOT EXISTS w_approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS w_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(100);
    `);

    console.log("Migrations successfully completed!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrate();
