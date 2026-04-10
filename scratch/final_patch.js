const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Use a regex that is less sensitive to exact whitespace/positioning
const registerBlockRegex = /\/\/ =+ REGISTER =+\s+app\.post\("\/register", async \(req, res\) => \{\s+const \{ name, email, password, role, residence_type, roll_no, faculty_id, phone_no, parent_of_roll_no, parent_email, counselor_id, class_teacher_id, hod_id \} = req\.body;/;

const replacementStr = `// ================= REGISTER =================
app.post("/register/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });

  const { generateOTP, sendRegistrationOtpEmail } = require("./utils/otpUtils");
  
  try {
     const otp = generateOTP();
     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
     
     await pool.query("DELETE FROM registration_otps WHERE email = $1", [email]);
     await pool.query("INSERT INTO registration_otps (email, otp, expires_at) VALUES ($1, $2, $3)", [email, otp, expiresAt]);
     
     await sendRegistrationOtpEmail(email, otp);
     res.json({ success: true, message: "Verification code sent to your email! 📩" });
  } catch (err) {
     console.error("Reg OTP Error:", err);
     res.status(500).json({ success: false, message: "Failed to send verification code" });
  }
});

app.post("/register", async (req, res) => {
  const { name, email, password, role, residence_type, roll_no, faculty_id, phone_no, parent_of_roll_no, parent_email, counselor_id, class_teacher_id, hod_id, otp } = req.body;

  // Real Email Verification Check
  try {
    const otpCheck = await pool.query(
      "SELECT * FROM registration_otps WHERE email=$1 AND otp=$2 AND expires_at > NOW()",
      [email, otp]
    );
    if (otpCheck.rows.length === 0) {
      return res.json({ success: false, message: "Invalid or expired verification code ❌" });
    }
  } catch (err) {
    console.error("OTP Validation Error:", err);
    return res.status(500).json({ success: false, message: "Internal verification error" });
  }`;

if (registerBlockRegex.test(code)) {
    code = code.replace(registerBlockRegex, replacementStr);
    // Also fix the double parenthesis bug found earlier if it still exists
    code = code.replace(/\);\s*\);/g, ');');
    fs.writeFileSync('server.js', code);
    console.log("Successfully Patched server.js with Regex");
} else {
    console.log("CRITICAL ERROR: Could not find registration block with regex");
    // Debug info
    console.log("Snippet from file:", code.substring(code.indexOf("// ================= REGISTER"), code.indexOf("} = req.body;") + 15));
}
