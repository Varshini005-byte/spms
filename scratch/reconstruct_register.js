const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const newRegisterRoute = `app.post("/register", async (req, res) => {
  const { name, email, password, role, residence_type, roll_no, faculty_id, phone_no, parent_of_roll_no, parent_email, counselor_id, class_teacher_id, hod_id } = req.body;

  // Security check for parent
  if (role === 'parent' && phone_no) {
    try {
      const studentCheck = await pool.query("SELECT * FROM users WHERE phone_no=$1 AND role='student'", [phone_no]);
      if (studentCheck.rows.length > 0) {
        return res.json({ success: false, message: "Security Alert: This phone number is registered to a student." });
      }
    } catch (err) { console.error(err); }
  }

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
    
    let cId = role === 'student' && counselor_id ? parseInt(counselor_id, 10) : null;
    let tId = role === 'student' && class_teacher_id ? parseInt(class_teacher_id, 10) : null;
    let hId = role === 'student' && hod_id ? parseInt(hod_id, 10) : null;

    await pool.query(
      \`INSERT INTO users (name, email, password, role, attendance, residence_type, roll_no, faculty_id, phone_no, parent_of_roll_no, parent_email, counselor_id, class_teacher_id, hod_id) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)\`,
      [name, email, hashedPassword, role, 100, defaultResType, cleanRollNo, cleanFacultyId, cleanPhoneNo, parent_of_roll_no, parent_email, cId, tId, hId]
    );

    // AUTOMATED NOTIFICATION (Receipt style)
    try {
      const { sendFacultyNotificationEmail } = require("./utils/otpUtils");
      await sendFacultyNotificationEmail(email, "[SPMS] Welcome to the System!", {
        studentName: name, rollNo: cleanRollNo || faculty_id || 'N/A', category: "Account Registration",
        actionMsg: \`Hello \${name}! Your SPMS account has been successfully created. You will now receive automated email notifications whenever a permission request is submitted or updated.\`,
        reason: "Registration Success"
      });
    } catch (e) { console.error("Welcome email fail:", e.message); }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Registration failed ❌" });
  }
});`;

// Replace everything from the start of /register to the start of /login
const start = code.indexOf('app.post("/register"');
const end = code.indexOf('// ================= LOGIN =================');

if (start !== -1 && end !== -1) {
    code = code.substring(0, start) + newRegisterRoute + "\n\n" + code.substring(end);
    fs.writeFileSync('server.js', code);
    console.log("Reconstructed /register route successfully");
} else {
    console.log("Failed to find boundaries");
}
