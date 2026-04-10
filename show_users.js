require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });

async function showAll() {
  try {
    console.log("\n===== ALL USERS IN DB =====");

    const users = await pool.query(
      `SELECT id, name, role, sub_role, faculty_id, roll_no, phone_no, residence_type, attendance
       FROM users ORDER BY role, sub_role`
    );

    const grouped = {};
    users.rows.forEach(u => {
      const key = u.role;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(u);
    });

    for (const [role, list] of Object.entries(grouped)) {
      console.log(`\n🔸 ${role.toUpperCase()} (${list.length})`);
      list.forEach(u => {
        const identifier = u.roll_no || u.faculty_id || u.phone_no || "-";
        const extra = u.sub_role ? ` [${u.sub_role}]` : "";
        console.log(`  ID:${u.id} | ${u.name} | ${identifier}${extra} | att:${u.attendance}%`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

showAll();
