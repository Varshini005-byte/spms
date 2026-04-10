require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });

async function test() {
  try {
    const res = await pool.query('SELECT * FROM users WHERE roll_no=$1', ['24211a0551']);
    console.log("Success:", res.rows.length);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit(0);
  }
}
test();
