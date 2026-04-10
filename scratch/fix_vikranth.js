require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });

async function fix() {
  await pool.query("UPDATE users SET sub_role='hod' WHERE name='vikranth'");
  console.log("Updated Vikranth to HOD");
  process.exit(0);
}
fix();
