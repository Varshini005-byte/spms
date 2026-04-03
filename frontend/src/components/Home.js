import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const loginUser = async (role) => {
    try {
      const res = await fetch("https://spms-ie7g.onrender.com/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Login successful ✅");
        navigate(`/${role}`);
      } else {
        alert("Invalid user ❌");
      }
    } catch (err) {
      alert("Server error ⚠️");
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div className="header">
        <h2>BVRIT - Smart Permission System</h2>
      </div>

      {/* MAIN */}
      <div className="main">
        <p className="register-text">
          Click <span onClick={() => navigate("/register")}>here</span> to Register
        </p>

        <h1 className="title">Login Portals</h1>

        <div className="card-container">

          {/* STUDENT */}
          <div className="card student">
            <h3>Student Login</h3>
            <input
              type="email"
              placeholder="Enter Email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={() => loginUser("student")}>Login</button>
          </div>

          {/* FACULTY */}
          <div className="card faculty">
            <h3>Faculty Login</h3>
            <input
              type="email"
              placeholder="Enter Email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={() => loginUser("faculty")}>Login</button>
          </div>

          {/* WARDEN */}
          <div className="card warden">
            <h3>Warden Login</h3>
            <input
              type="email"
              placeholder="Enter Email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={() => loginUser("warden")}>Login</button>
          </div>

          {/* PARENT */}
          <div className="card parent">
            <h3>Parent Login</h3>
            <input
              type="email"
              placeholder="Enter Email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={() => loginUser("parent")}>Login</button>
          </div>

        </div>
      </div>
    </div>
  );
}