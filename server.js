const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

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

app.get("/", (req, res) => { res.send("Backend Running 🚀"); });

// ================= REGISTER =================
app.post("/register", async (req, res) => {
  const { name, email, password, role, residence_type } = req.body;

  if (role === 'student' && !email.endsWith(".edu") && !email.endsWith(".ac.in")) {
    return res.json({ success: false, message: "Use official college email (.edu or .ac.in)" });
  }

  try {
    const check = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (check.rows.length > 0) return res.json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultResType = residence_type || 'day_scholar';

    await pool.query(
      `INSERT INTO users (name, email, password, role, attendance, residence_type) 
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [name, email, hashedPassword, role, 100, defaultResType]
    );
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
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

// ================= PERMISSIONS =================
app.post("/permissions/request", upload.single("attachment"), async (req, res) => {
  const { student_id, category, reason } = req.body;
  const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const userRes = await pool.query("SELECT attendance, residence_type FROM users WHERE id=$1", [student_id]);
    if (userRes.rows.length === 0) return res.json({ success: false, message: "User not found" });
    
    const user = userRes.rows[0];
    const isHosteler = user.residence_type === "hosteler";

    // --- SMART LOGIC ---
    let priority = "Normal";
    const urgentKeywords = ["hospital", "emergency", "sick", "accident", "death", "urgent"];
    if (urgentKeywords.some(word => reason.toLowerCase().includes(word))) {
      priority = "Urgent";
    }

    let suspiciousFlag = user.attendance < 60;

    let finalStatus = "Pending";
    let statusCoun = "Pending", statusTea = "N/A", statusHod = "N/A", statusWar = "N/A", statusPar = "N/A";

    // --- AUTO-APPROVAL LOGIC ---
    const autoApproveKeywords = ["lunch", "snack", "canteen"];
    const isShortOuting = category === "General Outing" && autoApproveKeywords.some(word => reason.toLowerCase().includes(word));

    if (user.attendance < 75 && !isShortOuting) {
      finalStatus = "Rejected (Low Attendance)";
      statusCoun = "Rejected";
    } else if (isShortOuting) {
      finalStatus = "Approved (Auto)";
      statusCoun = "Approved"; statusTea = "Approved"; statusHod = "Approved";
      statusWar = isHosteler ? "Approved" : "N/A";
      statusPar = "N/A";
    } else {
       if (category === "Health") {
          if (isHosteler) { statusCoun = "N/A"; statusTea = "N/A"; statusHod = "N/A"; statusWar = "Pending"; statusPar = "Pending"; } 
          else { statusCoun = "Pending"; statusPar = "Pending"; }
       } else if (category === "Event In") {
          statusCoun = "Pending";
       } else {
          statusCoun = "Pending";
          if (isHosteler) { statusWar = "Pending"; statusPar = "Pending"; } 
          else { statusPar = "Pending"; }
       }
    }

    await pool.query(
      `INSERT INTO permissions (student_id, category, reason, attachment_url, status_counselor, status_class_teacher, status_hod, status_warden, status_parent, final_status, priority, suspicious_flag)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [student_id, category, reason, attachmentUrl, statusCoun, statusTea, statusHod, statusWar, statusPar, finalStatus, priority, suspiciousFlag]
    );
    res.json({ success: true, autoApproved: isShortOuting });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get("/permissions", async (req, res) => {
  const { role, id } = req.query; 

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
       if (subRole === 'counselor') queryStr += ` WHERE p.status_counselor = 'Pending'`;
       else if (subRole === 'class_teacher') queryStr += ` WHERE p.status_class_teacher = 'Pending'`;
       else if (subRole === 'hod') queryStr += ` WHERE p.status_hod = 'Pending'`;
       queryStr += ` ORDER BY p.priority DESC, p.created_at DESC`;
    } else if (role === 'warden') {
       queryStr += ` WHERE p.status_warden = 'Pending' AND p.status_hod IN ('N/A', 'Approved') ORDER BY p.priority DESC, p.created_at DESC`;
    } else if (role === 'parent') {
       queryStr += ` WHERE p.status_parent = 'Pending' AND p.student_id = $1 AND p.status_hod IN ('N/A', 'Approved') AND p.status_warden IN ('N/A', 'Approved') ORDER BY p.created_at DESC`;
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
  const { role, sub_role, action, name } = req.body; 
  try {
     const permRes = await pool.query("SELECT * FROM permissions WHERE id=$1", [permId]);
     if (permRes.rows.length === 0) return res.json({ success: false });
     const p = permRes.rows[0];

     let q = "UPDATE permissions SET ";
     let vals = [];
     let idx = 1;

     if (action === 'Rejected') {
        q += `final_status='Rejected', status_counselor='Rejected' WHERE id=$${idx}`;
        vals.push(permId);
     } else {
        // Approval Logic
        if (sub_role === 'counselor') {
           q += `status_counselor='Approved', c_name=$${idx++}, c_approved_at=NOW(), status_class_teacher='Pending' WHERE id=$${idx}`;
           vals.push(name, permId);
        } else if (sub_role === 'class_teacher') {
           q += `status_class_teacher='Approved', t_name=$${idx++}, t_approved_at=NOW(), status_hod='Pending' WHERE id=$${idx}`;
           vals.push(name, permId);
        } else if (sub_role === 'hod') {
           q += `status_hod='Approved', h_name=$${idx++}, h_approved_at=NOW() WHERE id=$${idx}`;
           vals.push(name, permId);
        } else if (role === 'warden') {
           q += `status_warden='Approved', w_name=$${idx++}, w_approved_at=NOW() WHERE id=$${idx}`;
           vals.push(name, permId);
        } else if (role === 'parent') {
           q += `status_parent='Approved' WHERE id=$${idx}`;
           vals.push(permId);
        }
     }

     await pool.query(q, vals);

     // Check if Final Approval is reached
     const check = await pool.query("SELECT * FROM permissions WHERE id=$1", [permId]);
     const up = check.rows[0];
     if (up.final_status === 'Pending') {
        const cOk = (up.status_counselor === 'N/A' || up.status_counselor === 'Approved');
        const tOk = (up.status_class_teacher === 'N/A' || up.status_class_teacher === 'Approved');
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running 🚀 on port " + PORT);
});