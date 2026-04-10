require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });

// ============================================================
// Configure faculty sub-roles here
// sub_role options: 'counselor' | 'class_teacher' | 'hod'
// ============================================================
const FACULTY_ROLES = [
  { faculty_id: "24A551", sub_role: "counselor" },  // sunitha → counselor by default
  // Add more faculty members below as they register:
  // { faculty_id: "FAC002", sub_role: "class_teacher" },
  // { faculty_id: "FAC003", sub_role: "hod" },
];

async function assignRoles() {
  try {
    for (const f of FACULTY_ROLES) {
      const res = await pool.query(
        `UPDATE users SET sub_role = $1 WHERE faculty_id = $2 RETURNING name, faculty_id, sub_role`,
        [f.sub_role, f.faculty_id]
      );
      if (res.rows.length > 0) {
        const r = res.rows[0];
        console.log(`✅ ${r.name} (${r.faculty_id}) → sub_role set to: ${r.sub_role}`);
      } else {
        console.log(`⚠️  Faculty ID ${f.faculty_id} not found`);
      }
    }

    // Show final state
    const all = await pool.query(
      `SELECT name, faculty_id, sub_role FROM users WHERE role='faculty' ORDER BY sub_role`
    );
    console.log("\n📋 Current Faculty sub_roles:");
    all.rows.forEach(r =>
      console.log(`  - ${r.name} (${r.faculty_id}) → ${r.sub_role || "NOT SET ⚠️"}`)
    );

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

assignRoles();
