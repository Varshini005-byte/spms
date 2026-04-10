require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  try {
    console.log("Seeding database...");
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 4 Students
    const students = [
      { name: "Student One", email: "s1@bvrit.ac.in", roll_no: "21B01A0501", phone_no: "9000000001", residence_type: "hosteler" },
      { name: "Student Two", email: "s2@bvrit.ac.in", roll_no: "21B01A0502", phone_no: "9000000002", residence_type: "day_scholar" },
      { name: "Student Three", email: "s3@bvrit.ac.in", roll_no: "21B01A0503", phone_no: "9000000003", residence_type: "hosteler" },
      { name: "Student Four", email: "s4@bvrit.ac.in", roll_no: "21B01A0504", phone_no: "9000000004", residence_type: "day_scholar" }
    ];

    for (let s of students) {
      await pool.query(
        "INSERT INTO users (name, email, password, role, roll_no, phone_no, residence_type) VALUES ($1,$2,$3,'student',$4,$5,$6) ON CONFLICT (roll_no) DO NOTHING",
        [s.name, s.email, hashedPassword, s.roll_no, s.phone_no, s.residence_type]
      );
    }

    // 4 Faculty
    const faculty = [
      { name: "Faculty One", email: "f1@bvrit.ac.in", faculty_id: "FID001", phone_no: "8000000001" },
      { name: "Faculty Two", email: "f2@bvrit.ac.in", faculty_id: "FID002", phone_no: "8000000002" },
      { name: "Faculty Three", email: "f3@bvrit.ac.in", faculty_id: "FID003", phone_no: "8000000003" },
      { name: "Faculty Four", email: "f4@bvrit.ac.in", faculty_id: "FID004", phone_no: "8000000004" }
    ];

    for (let f of faculty) {
      await pool.query(
        "INSERT INTO users (name, email, password, role, faculty_id, phone_no) VALUES ($1,$2,$3,'faculty',$4,$5) ON CONFLICT (faculty_id) DO NOTHING",
        [f.name, f.email, hashedPassword, f.faculty_id, f.phone_no]
      );
    }

    // 2 Wardens
    const wardens = [
      { name: "Warden One", email: "w1@example.com", phone_no: "7000000001" },
      { name: "Warden Two", email: "w2@example.com", phone_no: "7000000002" }
    ];

    for (let w of wardens) {
      await pool.query(
        "INSERT INTO users (name, email, password, role, phone_no) VALUES ($1,$2,$3,'warden',$4) ON CONFLICT (phone_no) DO NOTHING",
        [w.name, w.email, hashedPassword, w.phone_no]
      );
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
