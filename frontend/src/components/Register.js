import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "student"
  });

  const handleRegister = async () => {

    if (form.password !== form.confirm) {
      alert("Passwords do not match ❌");
      return;
    }

    try {
      const res = await fetch("https://spms-ie7g.onrender.com/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (data.success) {
        alert("Registered successfully ✅");
        navigate("/");
      } else {
        alert("User already exists ❌");
      }

    } catch {
      alert("Server error ⚠️");
    }
  };

  return (
    <div className="main">

      <div className="card">
        <h2>Register</h2>

        <input
          placeholder="Full Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <input
          type="password"
          placeholder="Re-enter Password"
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        />

        <select
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="warden">Warden</option>
          <option value="parent">Parent</option>
        </select>

        <button onClick={handleRegister}>Register</button>
      </div>

    </div>
  );
}