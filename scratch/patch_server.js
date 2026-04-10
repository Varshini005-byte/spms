const fs = require('fs');

const code = fs.readFileSync('server.js', 'utf8');
const target = '// ================= NOTIFICATIONS =================';
const replacement = `
app.put("/permissions/:id/escalate", async (req, res) => {
  const permId = req.params.id;
  try {
     await pool.query("UPDATE permissions SET priority='Urgent' WHERE id=$1", [permId]);
     res.json({ success: true, message: "Request escalated successfully" });
  } catch (err) {
     console.error(err);
     res.status(500).json({ success: false });
  }
});

// ================= NOTIFICATIONS =================
`;

fs.writeFileSync('server.js', code.replace(target, replacement.trim() + '\n'));
console.log("Patched server.js successfully!");
