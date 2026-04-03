import React from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">

      <h1 className="title">Smart Permission Management System</h1>

      <div className="card-container">

        <div className="card student">
          <h2>Student Login</h2>
          <button onClick={() => navigate("/student")}>Login</button>
        </div>

        <div className="card warden">
          <h2>Warden Login</h2>
          <button onClick={() => navigate("/warden")}>Login</button>
        </div>

        <div className="card faculty">
          <h2>Faculty Login</h2>
          <button onClick={() => navigate("/faculty")}>Login</button>
        </div>

        <div className="card parent">
          <h2>Parent Login</h2>
          <button onClick={() => navigate("/parent")}>Login</button>
        </div>

      </div>

    </div>
  );
}