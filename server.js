const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const app = express();

app.use(cors());
app.use(express.json());

// DB CONNECTION
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

// TEST
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});


// ================= REGISTER =================
app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const check = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (check.rows.length > 0) {
      return res.json({ success: false });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await pool.query(
      "INSERT INTO users (name, email, password, role, attendance) VALUES ($1,$2,$3,$4,$5)",
      [name, email, hashedPassword, role, 100]
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
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false });
    }

    delete user.password;

    res.json({
      success: true,
      user: user
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
});


// START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running 🚀");
});