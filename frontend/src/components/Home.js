import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>

      {/* Header */}
      <div className="header">
        <h2>BVRIT - Smart Permission System</h2>
      </div>

      {/* Main Section */}
      <div className="main">

        {/* Register Link */}
        <p className="register-text">
          Click <span onClick={() => navigate("/register")}>here</span> to Register
        </p>

        <h1 className="title">Login Portals</h1>

        <div className="card-container">

          {/* Student */}
          <div className="card student">
            <h3>Student Login</h3>
            <input type="text" placeholder="Enter Email" />
            <input type="password" placeholder="Enter Password" />
            <button>Login</button>
          </div>

          {/* Faculty */}
          <div className="card faculty">
            <h3>Faculty Login</h3>
            <input type="text" placeholder="Enter Email" />
            <input type="password" placeholder="Enter Password" />
            <button>Login</button>
          </div>

          {/* Warden */}
          <div className="card warden">
            <h3>Warden Login</h3>
            <input type="text" placeholder="Enter Email" />
            <input type="password" placeholder="Enter Password" />
            <button>Login</button>
          </div>

          {/* Parent */}
          <div className="card parent">
            <h3>Parent Login</h3>
            <input type="text" placeholder="Enter Email" />
            <input type="password" placeholder="Enter Password" />
            <button>Login</button>
          </div>

        </div>
      </div>

    </div>
  );
}