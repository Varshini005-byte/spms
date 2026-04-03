import React, { useState } from "react";

function App() {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginUser = async (selectedRole) => {
    try {
      const response = await fetch("https://spms-ie7g.onrender.com/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          role: selectedRole
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`${selectedRole} Login Successful ✅`);
      } else {
        alert("Invalid Login ❌");
      }

    } catch (err) {
      alert("Server error ⚠️");
    }
  };

  const Card = (title, color) => (
    <div style={{
      background: "white",
      padding: "20px",
      borderRadius: "12px",
      width: "230px",
      textAlign: "center",
      boxShadow: "0 10px 20px rgba(0,0,0,0.2)"
    }}>
      <h3 style={{ color }}>{title} Login</h3>

      <input
        placeholder="Enter Email"
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          margin: "10px 0"
        }}
      />

      <input
        type="password"
        placeholder="Enter Password"
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "10px"
        }}
      />

      <button
        onClick={() => loginUser(title)}
        style={{
          background: color,
          color: "white",
          padding: "8px 15px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Login
      </button>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(to right, #4facfe, #00f2fe)",
      textAlign: "center",
      paddingTop: "50px"
    }}>
      <h1 style={{ color: "white" }}>
        Smart Permission System 🚀
      </h1>

      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "25px",
        marginTop: "40px",
        flexWrap: "wrap"
      }}>
        {Card("Student", "#ff7f50")}
        {Card("Faculty", "#6a5acd")}
        {Card("Warden", "#ff4d4d")}
        {Card("Parent", "#20b2aa")}
      </div>
    </div>
  );
}

export default App;