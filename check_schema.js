require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  try {
    // Check faculty_notifications table
    const notif = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'faculty_notifications'
      ORDER BY ordinal_position
    `);
    console.log("✅ faculty_notifications columns:", notif.rows.map(r => r.column_name).join(", "));

    // Check new permissions columns
    const perm = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'permissions' AND column_name IN ('hod_bypass', 'parent_name')
    `);
    console.log("✅ permissions new cols:", perm.rows.map(r => r.column_name).join(", "));

    // Check student 24211a0551 exists
    const student = await pool.query(`
      SELECT id, name, roll_no, attendance, residence_type, sub_role 
      FROM users WHERE UPPER(roll_no) = '24211A0551'
    `);
    if (student.rows.length > 0) {
      const s = student.rows[0];
      console.log(`✅ Student found: ${s.name} | Roll: ${s.roll_no} | Attendance: ${s.attendance}% | Type: ${s.residence_type}`);
    } else {
      console.log("⚠️  Student 24211A0551 NOT found in DB");
    }

    // Check faculty sub_roles
    const faculty = await pool.query(`
      SELECT name, faculty_id, sub_role FROM users WHERE role = 'faculty' ORDER BY sub_role
    `);
    console.log("\n📋 Faculty accounts:");
    faculty.rows.forEach(f => console.log(`  - ${f.name} (${f.faculty_id}) → sub_role: ${f.sub_role || 'NOT SET'}`));

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

check();
