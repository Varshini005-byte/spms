require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });

async function clearDatabase() {
  try {
    console.log("Cleaning up all data...");
    
    const tables = [
      'otps', 
      'faculty_notifications', 
      'permissions', 
      'approvals', 
      'registration_otps', 
      'requests',
      'notifications',
      'parent_otp_verifications',
      'otp_audit_log',
      'users'
    ];

    for (const table of tables) {
      try {
        await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        console.log(`Cleared ${table}`);
      } catch (e) {
        console.log(`Skipping ${table}: ${e.message}`);
      }
    }
    
    console.log("Database cleared successfully! ✅");
  } catch (err) {
    console.error("Cleanup Error:", err);
  } finally {
    process.exit(0);
  }
}

clearDatabase();
