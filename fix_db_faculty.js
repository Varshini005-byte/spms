require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });

async function fixDB() {
  try {
    console.log("Updating Raghavender to counselor...");
    await pool.query("UPDATE users SET sub_role='counselor' WHERE id=40");

    console.log("Mapping varshinibaswannagari (student 25) to faculty...");
    // sunitha (36) or raghavender (40) can be the counselor. Let's use raghavender (40).
    const cId = 40; 
    const tId = 38; // Lakshmi Priya
    const hId = 39; // Dr. Ramesh HOD

    await pool.query(
      "UPDATE users SET counselor_id=$1, class_teacher_id=$2, hod_id=$3 WHERE id=25",
      [cId, tId, hId]
    );

    console.log("All fixed!");
    process.exit(0);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}

fixDB();
