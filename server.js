const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const { Pool } = require("pg");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Debug (optional but useful)
app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});

// ✅ DB Connection
const pool = new Pool({
  connectionString: process.env.DB_URL,
});

// Test DB connection
pool.connect()
  .then(() => console.log("Connected to DB ✅"))
  .catch(err => console.log("DB Error ❌", err));

// ✅ Default route
app.get("/", (req, res) => {
  res.send("SPMS Backend Running 🚀");
});


// ================= USERS =================

// ✅ GET USERS
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching users");
  }
});

// ✅ ADD USER
app.post("/add-user", async (req, res) => {
  const { name, email, role, type, attendance } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO users (name, email, role, type, attendance) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [name, email, role, type, attendance || 100]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error inserting user");
  }
});


// ================= REQUEST SYSTEM =================

// ✅ CREATE REQUEST
app.post("/create-request", async (req, res) => {
  const { student_id, type, is_emergency } = req.body;

  try {
    // 🔴 Check user
    const user = await pool.query(
      "SELECT * FROM users WHERE id=$1",
      [student_id]
    );

    if (!user.rows.length) {
      return res.send("User not found ❌");
    }

    if (user.rows[0].attendance < 75) {
      return res.send("Permission denied (low attendance) ❌");
    }

    // 🟢 Create request
    const request = await pool.query(
      "INSERT INTO requests (student_id, type, is_emergency) VALUES ($1,$2,$3) RETURNING *",
      [student_id, type, is_emergency]
    );

    const request_id = request.rows[0].id;

    // 🔁 Approval chain logic
    let steps = [];

    if (type === "health") {
      steps = ["warden", "parent"];
    } else if (type === "event_in") {
      steps = ["faculty"];
    } else if (type === "event_out") {
      steps = ["faculty", "warden", "parent"];
    } else {
      steps = ["faculty"];
    }

    // 🚨 Emergency override
    if (is_emergency) {
      steps = ["hod"];
    }

    // Insert approvals
    for (let i = 0; i < steps.length; i++) {
      await pool.query(
        "INSERT INTO approvals (request_id, approver_role, step) VALUES ($1,$2,$3)",
        [request_id, steps[i], i + 1]
      );
    }

    res.send("Request created successfully ✅");

  } catch (err) {
    console.log(err);
    res.status(500).send("Error creating request");
  }
});


// ✅ APPROVE REQUEST
app.post("/approve", async (req, res) => {
  const { request_id } = req.body;

  try {
    const request = await pool.query(
      "SELECT * FROM requests WHERE id=$1",
      [request_id]
    );

    if (!request.rows.length) {
      return res.send("Request not found ❌");
    }

    const step = request.rows[0].current_step;

    // Approve current step
    await pool.query(
      "UPDATE approvals SET status='approved' WHERE request_id=$1 AND step=$2",
      [request_id, step]
    );

    // Move to next step
    await pool.query(
      "UPDATE requests SET current_step = current_step + 1 WHERE id=$1",
      [request_id]
    );

    res.send("Approved successfully ✅");

  } catch (err) {
    console.log(err);
    res.status(500).send("Error approving");
  }
});


// ✅ CHECK REQUEST STATUS
app.get("/request-status", async (req, res) => {
  const { request_id } = req.query;

  try {
    const result = await pool.query(
      "SELECT * FROM approvals WHERE request_id=$1 ORDER BY step",
      [request_id]
    );

    res.json(result.rows);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching status");
  }
});


// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});