require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const pool = new Pool({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });

// ============================================================
// Seeds 2 additional faculty accounts:
//   class_teacher  → Faculty ID: FAC_TEA01 | password: teacher123
//   hod            → Faculty ID: FAC_HOD01 | password: hod123456
// These are for TESTING the approval workflow.
// You can also register them via the app's Register page.
// ============================================================

const newFaculty = [
  {
    name: "Sunitha",
    email: "sunitha@spms.ac.in",
    faculty_id: "24A551",
    phone_no: "9000000001",
    role: "faculty",
    sub_role: "counselor",
    password: "password123",
  },
  {
    name: "Vikranth",
    email: "vikranth@spms.ac.in",
    faculty_id: "24A531",
    phone_no: "9000000002",
    role: "faculty",
    sub_role: "class_teacher",
    password: "password123",
  },
  {
    name: "Raghavender",
    email: "raghavender@spms.ac.in",
    faculty_id: "24A532",
    phone_no: "9000000003",
    role: "faculty",
    sub_role: "hod",
    password: "password123",
  },
];

async function seed() {
  try {
    for (const f of newFaculty) {
      // Check if already exists
      const existing = await pool.query(
        `SELECT id FROM users WHERE faculty_id = $1`, [f.faculty_id]
      );
      if (existing.rows.length > 0) {
        // Just update sub_role
        await pool.query(
          `UPDATE users SET sub_role=$1 WHERE faculty_id=$2`,
          [f.sub_role, f.faculty_id]
        );
        console.log(`🔄 Updated ${f.name} (${f.faculty_id}) → sub_role: ${f.sub_role}`);
        continue;
      }

      const hash = await bcrypt.hash(f.password, 10);
      await pool.query(
        `INSERT INTO users (name, email, password, role, sub_role, faculty_id, phone_no, attendance, residence_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,100,'day_scholar')`,
        [f.name, f.email, hash, f.role, f.sub_role, f.faculty_id, f.phone_no]
      );
      console.log(`✅ Created: ${f.name} | Faculty ID: ${f.faculty_id} | sub_role: ${f.sub_role} | password: ${f.password}`);
    }

    // Show final faculty list
    const all = await pool.query(
      `SELECT id, name, faculty_id, sub_role FROM users WHERE role='faculty' ORDER BY sub_role`
    );
    console.log("\n📋 All Faculty Accounts:");
    all.rows.forEach(r =>
      console.log(`  [ID:${r.id}] ${r.name} | ${r.faculty_id} | ${r.sub_role || "⚠️ NO ROLE"}`)
    );

    console.log(`
╔══════════════════════════════════════════════════════╗
║           FACULTY LOGIN CREDENTIALS                   ║
╠══════════════════════════════════════════════════════╣
║  Counselor:     ID=24A551      pass=<your password>  ║
║  Class Teacher: ID=FAC_TEA01  pass=teacher123        ║
║  HOD:           ID=FAC_HOD01  pass=hod123456         ║
╚══════════════════════════════════════════════════════╝
`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

seed();
