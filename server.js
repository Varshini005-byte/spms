const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const parentOtpRoutes = require("./routes/parentOtp");

const app = express();
app.use(cors());
app.use(express.json());

// File upload setup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads/') },
  filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname) }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

// DB CONNECTION
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

// Mount Parent OTP routes
app.use(parentOtpRoutes(pool));



// ================= REGISTER =================
app.post("/register", async (req, res) => {
  const { name, email, password, role, residence_type, roll_no, faculty_id, phone_no, parent_of_roll_no, parent_email, counselor_id, class_teacher_id, hod_id } = req.body;

  // Security: Check if phone number is already registered as a student to prevent misuse as parent
  if (role === 'parent' && phone_no) {
    try {
      const studentCheck = await pool.query("SELECT * FROM users WHERE phone_no=$1 AND role='student'", [phone_no]);
      if (studentCheck.rows.length > 0) {
        return res.json({ success: false, message: "Security Alert: This phone number is registered to a student and cannot be used for parent registration." });
      }
    } catch (err) {
      console.error(err);
    }
  }

  try {
    // Check for existing user using the specific identifier based on role
    let checkQuery = "SELECT * FROM users WHERE email=$1";
    let checkVal = email;

    if (role === 'student') { checkQuery = "SELECT * FROM users WHERE roll_no=$1"; checkVal = roll_no; }
    else if (role === 'faculty') { checkQuery = "SELECT * FROM users WHERE faculty_id=$1"; checkVal = faculty_id; }
    else if (role === 'warden' || role === 'parent') { checkQuery = "SELECT * FROM users WHERE phone_no=$1"; checkVal = phone_no; }

    if (checkVal) {
      const check = await pool.query(checkQuery, [checkVal]);
      if (check.rows.length > 0) return res.json({ success: false, message: "User already exists with this identifier" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultResType = residence_type || 'day_scholar';

    // Clean identifiers: replace empty strings with null to avoid UNIQUE constraint issues
    const cleanRollNo = (role === 'student') ? roll_no : null;
    const cleanFacultyId = (role === 'faculty') ? faculty_id : null;
    const cleanPhoneNo = (role === 'warden' || role === 'parent' || role === 'student' || role === 'faculty') ? phone_no : null;

    // For student registrations, correctly parse the faculty ids from strings to Ints (or null)
    let cId = role === 'student' && counselor_id ? parseInt(counselor_id, 10) : null;
    let tId = role === 'student' && class_teacher_id ? parseInt(class_teacher_id, 10) : null;
    let hId = role === 'student' && hod_id ? parseInt(hod_id, 10) : null;

    await pool.query(
      `INSERT INTO users (name, email, password, role, attendance, residence_type, roll_no, faculty_id, phone_no, parent_of_roll_no, parent_email, counselor_id, class_teacher_id, hod_id) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [name, email, hashedPassword, role, 100, defaultResType, cleanRollNo, cleanFacultyId, cleanPhoneNo, parent_of_roll_no, parent_email, cId, tId, hId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Registration Error:", err);
    let errorMsg = "Registration failed ❌";
    if (err.code === '23505') {
       if (err.detail.includes('email')) errorMsg = "Email already registered ❌";
       else if (err.detail.includes('roll_no')) errorMsg = "Roll Number already registered ❌";
       else if (err.detail.includes('faculty_id')) errorMsg = "Faculty ID already registered ❌";
       else if (err.detail.includes('phone_no')) errorMsg = "Phone Number already registered ❌";
       else errorMsg = "Duplicate entry found ❌";
    }
    res.status(400).json({ success: false, message: errorMsg });
  }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const { identifier, password, role } = req.body;
  try {
    let loginQuery = "SELECT * FROM users WHERE email=$1";
    if (role === 'student') loginQuery = "SELECT * FROM users WHERE roll_no=$1";
    else if (role === 'faculty') loginQuery = "SELECT * FROM users WHERE faculty_id=$1";
    else if (role === 'warden') loginQuery = "SELECT * FROM users WHERE phone_no=$1";
    else if (role === 'parent') loginQuery = "SELECT * FROM users WHERE phone_no=$1";

    const result = await pool.query(loginQuery, [identifier]);
    if (result.rows.length === 0) return res.json({ success: false, message: "User not found" });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

    delete user.password;
    res.json({ success: true, user: user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
});

// ================= FACULTY LIST (FOR REGISTRATION) =================
app.get("/faculty-list", async (req, res) => {
  try {
    const list = await pool.query(
      "SELECT id, name, sub_role FROM users WHERE role='faculty' ORDER BY name ASC"
    );
    res.json({ success: true, data: list.rows });
  } catch(err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ================= PERMISSIONS =================
app.post("/permissions/request", upload.single("attachment"), async (req, res) => {
  const { student_id, category, reason, is_emergency } = req.body;
  const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const userRes = await pool.query("SELECT attendance, residence_type FROM users WHERE id=$1", [student_id]);
    if (userRes.rows.length === 0) return res.json({ success: false, message: "User not found" });
    
    const user = userRes.rows[0];
    const isHosteler = user.residence_type === "hosteler";

    // --- SMART LOGIC ---
    let priority = "Normal";
    const urgentKeywords = ["hospital", "emergency", "sick", "accident", "death", "urgent"];
    if (is_emergency === 'true' || is_emergency === true || urgentKeywords.some(word => reason.toLowerCase().includes(word))) {
      priority = "Urgent";
    }

    let suspiciousFlag = user.attendance < 60;

    let finalStatus = "Pending";
    let statusCoun = "N/A", statusTea = "N/A", statusHod = "N/A", statusWar = "N/A", statusPar = "Pending";

    // --- AUTO-APPROVAL LOGIC ---
    const autoApproveKeywords = ["lunch", "snack", "canteen"];
    const isShortOuting = category === "General Outing" && autoApproveKeywords.some(word => reason.toLowerCase().includes(word));

    if (user.attendance < 75 && !isShortOuting) {
      finalStatus = "Rejected (Low Attendance)";
      statusCoun = "Rejected";
    } else if (isShortOuting) {
      finalStatus = "Approved (Auto)";
      statusCoun = "Approved"; statusTea = "Approved"; statusHod = "Approved";
      statusWar = "N/A"; statusPar = "N/A";
    } else {
       // Standard Sequential Flow
       statusCoun = "Pending";
       statusTea = "Pending";
       statusHod = "Pending";
       if (isHosteler) statusWar = "Pending";
       if (category === "Campus Events" || category === "Off-Campus Events") {
         statusPar = "N/A";
       } else {
         statusPar = "Pending";
       }
    }

    const insertResult = await pool.query(
      `INSERT INTO permissions (student_id, category, reason, attachment_url, status_counselor, status_class_teacher, status_hod, status_warden, status_parent, final_status, priority, suspicious_flag)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [student_id, category, reason, attachmentUrl, statusCoun, statusTea, statusHod, statusWar, statusPar, finalStatus, priority, suspiciousFlag]
    );

    const newPermId = insertResult.rows[0].id;

    // Auto-trigger OTP if parent approval is required
    if (statusPar === "Pending") {
      try {
        const { generateOTP, sendOtpEmail } = require("./utils/otpUtils");
        const otpDb = require("./db/parentOtpQueries");

        const student = await otpDb.getStudentWithParent(pool, student_id);
        if (student && student.parent_email) {
          const otp = generateOTP();
          const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
          await otpDb.createOtpRecord(pool, student_id, newPermId, student.parent_email, otp, expiresAt);
          await sendOtpEmail(student.parent_email, otp, student.name, category);
          console.log(`[OTP] Auto-sent to ${student.parent_email} for permission ${newPermId}`);
        }
      } catch (otpErr) {
        // OTP send failure should not block permission creation
        console.error("[OTP] Auto-send failed (non-blocking):", otpErr.message);
      }
    }

    res.json({ success: true, autoApproved: isShortOuting, permission_id: newPermId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get("/permissions", async (req, res) => {
  const { role, id, view } = req.query; 

  try {
    let queryStr = `
      SELECT p.*, u.name, u.attendance, u.residence_type
      FROM permissions p
      JOIN users u ON p.student_id = u.id
    `;
    let values = [];

    if (role === 'student') {
       queryStr += ` WHERE p.student_id = $1 ORDER BY p.created_at DESC`;
       values = [id];
    } else if (role === 'faculty') {
       const subRole = req.query.sub_role;
       // Strict filtering based on the student's mapped faculty
       if (view === 'history') {
         queryStr += ` WHERE p.student_id IN (SELECT id FROM users WHERE counselor_id=$1 OR class_teacher_id=$1 OR hod_id=$1) AND (p.status_counselor != 'Pending' OR p.status_class_teacher != 'Pending' OR p.status_hod != 'Pending')`;
         values = [id];
       } else {
         if (subRole === 'counselor') {
            queryStr += ` WHERE p.status_counselor = 'Pending' AND p.student_id IN (SELECT id FROM users WHERE counselor_id=$1)`;
            values = [id];
         } else if (subRole === 'class_teacher') {
            queryStr += ` WHERE p.status_class_teacher = 'Pending' AND (p.status_counselor = 'Approved' OR p.hod_bypass = TRUE) AND p.student_id IN (SELECT id FROM users WHERE class_teacher_id=$1)`;
            values = [id];
         } else if (subRole === 'hod') {
            queryStr += ` WHERE p.status_hod = 'Pending' AND (p.status_class_teacher = 'Approved' OR (p.priority = 'Urgent' AND p.final_status = 'Pending')) AND p.student_id IN (SELECT id FROM users WHERE hod_id=$1)`;
            values = [id];
         }
       }
       queryStr += ` ORDER BY p.priority DESC, p.created_at DESC`;
    } else if (role === 'warden') {
       if (view === 'history') {
         queryStr += ` WHERE p.status_warden != 'Pending'`;
       } else {
         queryStr += ` WHERE p.status_warden = 'Pending' AND p.status_hod = 'Approved'`;
       }
       queryStr += ` ORDER BY p.priority DESC, p.created_at DESC`;
    } else if (role === 'parent') {
       if (view === 'history') {
         queryStr += ` WHERE p.status_parent != 'Pending' AND p.student_id = (SELECT id FROM users WHERE UPPER(roll_no) = UPPER($1) LIMIT 1) ORDER BY p.created_at DESC`;
       } else {
         queryStr += ` WHERE p.status_parent = 'Pending' AND p.student_id = (SELECT id FROM users WHERE UPPER(roll_no) = UPPER($1) LIMIT 1) ORDER BY p.created_at DESC`;
       }
       values = [id]; 
    } else if (role === 'admin') {
       queryStr += ` ORDER BY p.created_at DESC`;
    }

    const requests = await pool.query(queryStr, values);
    res.json({ success: true, data: requests.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.put("/permissions/:id", async (req, res) => {
  const permId = req.params.id;
  const { role, sub_role, action, name, hod_id } = req.body; 
  try {
     const permRes = await pool.query("SELECT * FROM permissions WHERE id=$1", [permId]);
     if (permRes.rows.length === 0) return res.json({ success: false });
     const p = permRes.rows[0];

     let q = "UPDATE permissions SET ";
     let vals = [];
     let idx = 1;

     if (action === 'Rejected') {
        let statusCol = "";
        if (sub_role === 'counselor') statusCol = "status_counselor";
        else if (sub_role === 'class_teacher') statusCol = "status_class_teacher";
        else if (sub_role === 'hod') statusCol = "status_hod";
        else if (role === 'warden') statusCol = "status_warden";
        else if (role === 'parent') statusCol = "status_parent";

        q += `final_status='Rejected', ${statusCol}='Rejected', rejected_by=$${idx++} WHERE id=$${idx}`;
        vals.push(name, permId);
     } else {
        // Approval Logic with Sequential Check
        if (sub_role === 'counselor') {
           q += `status_counselor='Approved', c_name=$${idx++}, c_approved_at=NOW(), status_class_teacher='Pending' WHERE id=$${idx}`;
           vals.push(name, permId);
        } else if (sub_role === 'class_teacher') {
           if (p.status_counselor !== 'Approved' && !p.hod_bypass) return res.json({ success: false, message: "Awaiting Counselor approval" });
           q += `status_class_teacher='Approved', t_name=$${idx++}, t_approved_at=NOW(), status_hod='Pending' WHERE id=$${idx}`;
           vals.push(name, permId);
        } else if (sub_role === 'hod') {
           // HOD can bypass if leave is Urgent/Emergency
           const isEmergency = p.priority === 'Urgent';
           const normalQueueReady = p.status_class_teacher === 'Approved';

           if (!normalQueueReady && !isEmergency) {
             return res.json({ success: false, message: "Awaiting Class Teacher approval" });
           }

           if (isEmergency && !normalQueueReady) {
             // HOD EMERGENCY BYPASS: mark counselor & class_teacher as bypassed
             q += `status_hod='Approved', h_name=$${idx++}, h_approved_at=NOW(), hod_bypass=TRUE, ` +
                  `status_counselor=CASE WHEN status_counselor='Pending' THEN 'Bypassed' ELSE status_counselor END, ` +
                  `status_class_teacher=CASE WHEN status_class_teacher='Pending' THEN 'Bypassed' ELSE status_class_teacher END ` +
                  `WHERE id=$${idx}`;
             vals.push(name, permId);

             await pool.query(q, vals);

             // Send notifications to counselor and class teacher about HOD bypass
             try {
               // Get student details
               const studentInfo = await pool.query(
                 `SELECT u.name, u.roll_no, u.counselor_id, u.class_teacher_id
                  FROM users u WHERE u.id = $1`, [p.student_id]
               );
               const si = studentInfo.rows[0];
               const msg = `🚨 HOD Emergency Bypass: ${name} directly approved an URGENT leave for student ${si.name} (${si.roll_no}). Your approval was bypassed for emergency. Category: ${p.category}. Reason: "${p.reason.substring(0, 80)}..."` ;
               if (si.counselor_id) {
                 await pool.query(
                   `INSERT INTO faculty_notifications (faculty_id, permission_id, message) VALUES ($1, $2, $3)`,
                   [si.counselor_id, permId, msg]
                 );
               }
               if (si.teacher_id) {
                 await pool.query(
                   `INSERT INTO faculty_notifications (faculty_id, permission_id, message) VALUES ($1, $2, $3)`,
                   [si.teacher_id, permId, msg]
                 );
               }
             } catch (notifErr) {
               console.error("[Notification] Failed to create bypass notifications:", notifErr.message);
             }

             // Check final approval after bypass
             const check2 = await pool.query("SELECT * FROM permissions WHERE id=$1", [permId]);
             const up2 = check2.rows[0];
             if (up2.final_status === 'Pending') {
               const cOk = ['N/A','Approved','Bypassed'].includes(up2.status_counselor);
               const tOk = ['N/A','Approved','Bypassed'].includes(up2.status_class_teacher);
               const hOk = up2.status_hod === 'Approved';
               const wOk = ['N/A','Approved'].includes(up2.status_warden);
               const pOk = ['N/A','Approved'].includes(up2.status_parent);
               if (cOk && tOk && hOk && wOk && pOk) {
                 await pool.query("UPDATE permissions SET final_status='Approved' WHERE id=$1", [permId]);
               }
             }
             return res.json({ success: true, bypassed: true });
           }

           // Normal HOD approval (queue was ready)
           q += `status_hod='Approved', h_name=$${idx++}, h_approved_at=NOW() WHERE id=$${idx}`;
           vals.push(name, permId);
        } else if (role === 'warden') {
           if (p.status_hod !== 'Approved') return res.json({ success: false, message: "Awaiting HOD approval" });
           q += `status_warden='Approved', w_name=$${idx++}, w_approved_at=NOW() WHERE id=$${idx}`;
           vals.push(name, permId);
        } else if (role === 'parent') {
           q += `status_parent='Approved', parent_name=$${idx++} WHERE id=$${idx}`;
           vals.push(name || 'Parent', permId);
        }
     }

     await pool.query(q, vals);

     // Check if Final Approval is reached
     const check = await pool.query("SELECT * FROM permissions WHERE id=$1", [permId]);
     const up = check.rows[0];
     if (up.final_status === 'Pending') {
        const cOk = ['N/A','Approved','Bypassed'].includes(up.status_counselor);
        const tOk = ['N/A','Approved','Bypassed'].includes(up.status_class_teacher);
        const hOk = (up.status_hod === 'N/A' || up.status_hod === 'Approved');
        const wOk = (up.status_warden === 'N/A' || up.status_warden === 'Approved');
        const pOk = (up.status_parent === 'N/A' || up.status_parent === 'Approved');
        if (cOk && tOk && hOk && wOk && pOk) {
           await pool.query("UPDATE permissions SET final_status='Approved' WHERE id=$1", [permId]);
        }
     }

     res.json({ success: true });
  } catch (err) {
     console.error(err);
     res.status(500).json({ success: false });
  }
});

// ================= NOTIFICATIONS =================
app.get("/notifications", async (req, res) => {
  const { faculty_id } = req.query;
  try {
    const result = await pool.query(
      `SELECT fn.*, 
              p.category, p.reason, p.priority, p.final_status,
              u.name AS student_name, u.roll_no
       FROM faculty_notifications fn
       JOIN permissions p ON fn.permission_id = p.id
       JOIN users u ON p.student_id = u.id
       WHERE fn.faculty_id = $1
       ORDER BY fn.created_at DESC
       LIMIT 50`,
      [faculty_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.post("/notifications/read", async (req, res) => {
  const { faculty_id } = req.body;
  try {
    await pool.query(
      `UPDATE faculty_notifications SET is_read = TRUE WHERE faculty_id = $1`,
      [faculty_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ================= STUDENT LOOKUP BY ROLL NO (for counselor/class_teacher) =================
app.get("/permissions/student-lookup", async (req, res) => {
  const { roll_no, sub_role, view } = req.query;
  try {
    // Find student by roll_no
    const studentRes = await pool.query(
      `SELECT id, name, roll_no, attendance, residence_type FROM users WHERE UPPER(roll_no) = UPPER($1) AND role='student'`,
      [roll_no]
    );
    if (studentRes.rows.length === 0) {
      return res.json({ success: false, message: "Student not found" });
    }
    const student = studentRes.rows[0];

    // Get all permissions for that student
    let queryStr = `
      SELECT p.*, u.name, u.attendance, u.residence_type, u.roll_no
      FROM permissions p
      JOIN users u ON p.student_id = u.id
      WHERE p.student_id = $1
      ORDER BY p.created_at DESC
    `;
    const perms = await pool.query(queryStr, [student.id]);
    res.json({ success: true, student, data: perms.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ================= OTP VERIFICATION =================
app.post("/parent/resend-otp", async (req, res) => {
  const { student_id, permission_id } = req.body;
  const { generateOTP, sendOtpEmail } = require("./utils/otpUtils");
  const otpDb = require("./db/parentOtpQueries");

  try {
    const student = await otpDb.getStudentWithParent(pool, student_id);
    if (!student || !student.parent_email) {
      return res.json({ success: false, message: "No parent email found ❌" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    
    // Invalidate old and create new
    await otpDb.invalidatePreviousOtps(pool, student_id, permission_id);
    await otpDb.createOtpRecord(pool, student_id, permission_id, student.parent_email, otp, expiresAt);
    
    await sendOtpEmail(student.parent_email, otp, student.name);
    
    res.json({ success: true, message: "New OTP sent to email! 📩" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to resend OTP" });
  }
});

app.post("/parent/verify-otp", async (req, res) => {
  const { student_id, otp, permission_id } = req.body;
  const otpDb = require("./db/parentOtpQueries");

  try {
    const validOtp = await otpDb.findValidOtp(pool, student_id, otp);
    if (!validOtp) {
      return res.json({ success: false, message: "Invalid or expired OTP ❌" });
    }

    // Mark verified
    await otpDb.markOtpVerified(pool, validOtp.id);
    
    // Update permission status
    await otpDb.updatePermissionParentStatus(pool, permission_id, "Approved");
    await otpDb.checkAndUpdateFinalStatus(pool, permission_id);

    res.json({ success: true, message: "OTP Verified Successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// Serve STATIC files from the React app
app.use(express.static(path.join(__dirname, "frontend/build")));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running 🚀 on port " + PORT);
});