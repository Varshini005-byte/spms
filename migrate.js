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
      ADD COLUMN IF NOT EXISTS residence_type VARCHAR(50) DEFAULT 'day_scholar';
    `);

    // 2. Create Permissions table
    console.log("Creating permissions table...");
    await pool.query(`
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
        priority VARCHAR(20) DEFAULT 'Normal',
        suspicious_flag BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Updating existing permissions table if missing columns...");
    await pool.query(`
      ALTER TABLE permissions ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'Normal';
      ALTER TABLE permissions ADD COLUMN IF NOT EXISTS suspicious_flag BOOLEAN DEFAULT FALSE;
    `);

    console.log("Migrations successfully completed!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrate();
