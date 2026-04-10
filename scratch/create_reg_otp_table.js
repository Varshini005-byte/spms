require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });

async function setup() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS registration_otps (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("Created registration_otps table successfully");
  process.exit(0);
}
setup();
