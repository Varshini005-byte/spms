import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const loginUser = async () => {
    try {
      const res = await fetch("https://spms-ie7g.onrender.com/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (data.success) {
        alert("Login successful ✅");
        navigate(`/${data.user.role}`);
      } else {
        alert("Invalid credentials ❌");
      }

    } catch {
      alert("Server error ⚠️");
    }
  };

  return (
    <div>
      <div className="header">
        <h2>BVRIT - Smart Permission System</h2>
      </div>

      <div className="main">

        <p className="register-text">
          Click <span onClick={() => navigate("/register")}>here</span> to Register
        </p>

        <div className="card">
          <h2>Login</h2>

          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button onClick={loginUser}>Login</button>
        </div>

      </div>
    </div>
  );
}