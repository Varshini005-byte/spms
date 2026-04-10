const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const updatedRegisterRoute = `app.post("/register", async (req, res) => {
  const { name, email, password, role, residence_type, roll_no, faculty_id, phone_no, parent_of_roll_no, parent_email } = req.body;

  try {
    let checkQuery = "SELECT * FROM users WHERE email=$1";
    let checkVal = email;
    if (role === 'student') { checkQuery = "SELECT * FROM users WHERE roll_no=$1"; checkVal = roll_no; }
    else if (role === 'faculty') { checkQuery = "SELECT * FROM users WHERE faculty_id=$1"; checkVal = faculty_id; }
    else if (role === 'warden' || role === 'parent') { checkQuery = "SELECT * FROM users WHERE phone_no=$1"; checkVal = phone_no; }

    const check = await pool.query(checkQuery, [checkVal]);
    if (check.rows.length > 0) return res.json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultResType = residence_type || 'day_scholar';
    const cleanRollNo = (role === 'student') ? roll_no : null;
    const cleanFacultyId = (role === 'faculty') ? faculty_id : null;
    const cleanPhoneNo = phone_no || null;
    
    // AUTOMATIC MENTOR LINKING for Students
    let cId = null, tId = null, hId = null;
    if (role === 'student') {
       const coun = await pool.query("SELECT id FROM users WHERE sub_role='counselor' LIMIT 1");
       const tea = await pool.query("SELECT id FROM users WHERE sub_role='class_teacher' LIMIT 1");
       const hod = await pool.query("SELECT id FROM users WHERE sub_role='hod' LIMIT 1");
       
       cId = coun.rows[0]?.id || null;
       tId = tea.rows[0]?.id || null;
       hId = hod.rows[0]?.id || null;
    }

    await pool.query(
      \`INSERT INTO users (name, email, password, role, attendance, residence_type, roll_no, faculty_id, phone_no, parent_of_roll_no, parent_email, counselor_id, class_teacher_id, hod_id) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)\`,
      [name, email, hashedPassword, role, 100, defaultResType, cleanRollNo, cleanFacultyId, cleanPhoneNo, parent_of_roll_no, parent_email, cId, tId, hId]
    );

    try {
      const { sendFacultyNotificationEmail } = require("./utils/otpUtils");
      await sendFacultyNotificationEmail(email, "[SPMS] Welcome!", {
        studentName: name, rollNo: cleanRollNo || faculty_id || 'N/A', category: "Account Registration",
        actionMsg: \`Hello \${name}! Account created. Your Counselor, Teacher, and HOD have been automatically linked to your profile.\`,
        reason: "Registration Success"
      });
    } catch (e) {}

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Registration failed" });
  }
});`;

const start = code.indexOf('app.post("/register"');
const end = code.indexOf('// ================= LOGIN =================');

if (start !== -1 && end !== -1) {
    code = code.substring(0, start) + updatedRegisterRoute + "\n\n" + code.substring(end);
    fs.writeFileSync('server.js', code);
    console.log("Successfully updated register for automatic linking");
} else {
    console.log("Failed to find boundaries");
}
