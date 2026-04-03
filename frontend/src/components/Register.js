import { useState } from "react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");

  const registerUser = async () => {
    try {
      const res = await fetch("https://spms-ie7g.onrender.com/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, role }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Registered successfully ✅");
      } else {
        alert("User already exists ❌");
      }
    } catch {
      alert("Server error ⚠️");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Register</h2>

      <input placeholder="Name" onChange={(e) => setName(e.target.value)} /><br /><br />
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} /><br /><br />

      <select onChange={(e) => setRole(e.target.value)}>
        <option value="student">Student</option>
        <option value="faculty">Faculty</option>
        <option value="warden">Warden</option>
        <option value="parent">Parent</option>
      </select><br /><br />

      <button onClick={registerUser}>Register</button>
    </div>
  );
}