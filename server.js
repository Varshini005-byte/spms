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
    let statusFac = "Pending", statusWar = "N/A", statusPar = "N/A";

    // --- AUTO-APPROVAL LOGIC ---
    const autoApproveKeywords = ["lunch", "snack", "canteen"];
    const isShortOuting = category === "General Outing" && autoApproveKeywords.some(word => reason.toLowerCase().includes(word));

    if (user.attendance < 75 && !isShortOuting) {
      finalStatus = "Rejected (Low Attendance)";
      statusFac = "Rejected";
    } else if (isShortOuting) {
      finalStatus = "Approved (Auto)";
      statusFac = "Approved";
      statusWar = isHosteler ? "Approved" : "N/A";
      statusPar = "N/A";
    } else {
       if (category === "Health") {
          if (isHosteler) { statusFac = "N/A"; statusWar = "Pending"; statusPar = "Pending"; } 
          else { statusFac = "Pending"; statusPar = "Pending"; }
       } else if (category === "Event In") {
          statusFac = "Pending";
       } else if (category === "Event Out" || category === "Others") {
          if (isHosteler) { statusFac = "Pending"; statusWar = "Pending"; statusPar = "Pending"; } 
          else { statusFac = "Pending"; statusPar = "Pending"; }
       }
    }

    await pool.query(
      `INSERT INTO permissions (student_id, category, reason, attachment_url, status_faculty, status_warden, status_parent, final_status, priority, suspicious_flag)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [student_id, category, reason, attachmentUrl, statusFac, statusWar, statusPar, finalStatus, priority, suspiciousFlag]
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
       queryStr += ` WHERE p.status_faculty = 'Pending' ORDER BY p.priority DESC, p.created_at DESC`;
    } else if (role === 'warden') {
       queryStr += ` WHERE p.status_warden = 'Pending' AND p.status_faculty IN ('N/A', 'Approved') ORDER BY p.priority DESC, p.created_at DESC`;
    } else if (role === 'parent') {
       queryStr += ` WHERE p.status_parent = 'Pending' AND p.student_id = $1 AND p.status_faculty IN ('N/A', 'Approved') AND p.status_warden IN ('N/A', 'Approved') ORDER BY p.created_at DESC`;
       values = [id];
    } else if (role === 'admin') {
       // Fetch everything for Analytics
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
  const { role, action } = req.body; 
  try {
     const permRes = await pool.query("SELECT * FROM permissions WHERE id=$1", [permId]);
     if (permRes.rows.length === 0) return res.json({ success: false });
     const perm = permRes.rows[0];

     let newStatusFac = perm.status_faculty;
     let newStatusWar = perm.status_warden;
     let newStatusPar = perm.status_parent;

     if (role === 'faculty') newStatusFac = action;
     else if (role === 'warden') newStatusWar = action;
     else if (role === 'parent') newStatusPar = action;

     let newFinal = "Pending";
     if (action === 'Rejected') {
        newFinal = "Rejected";
     } else {
        const facOk = (newStatusFac === 'N/A' || newStatusFac === 'Approved');
        const warOk = (newStatusWar === 'N/A' || newStatusWar === 'Approved');
        const parOk = (newStatusPar === 'N/A' || newStatusPar === 'Approved');
        if (facOk && warOk && parOk) newFinal = "Approved";
     }

     await pool.query(
        `UPDATE permissions SET status_faculty=$1, status_warden=$2, status_parent=$3, final_status=$4 WHERE id=$5`,
        [newStatusFac, newStatusWar, newStatusPar, newFinal, permId]
     );
     res.json({ success: true, finalStatus: newFinal });
  } catch (err) {
     console.error(err);
     res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running 🚀 on port " + PORT);
});