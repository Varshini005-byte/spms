import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Briefcase, Shield, Users, Sun, Moon } from "lucide-react";
import { useTheme } from "../App";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Component for standard email/pass login card
  const LoginCard = ({ title, type, role, icon }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
      try {
        const res = await fetch("https://spms-ie7g.onrender.com/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (data.success && data.user.role === role) {
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate(`/${role}`);
        } else {
          alert(`Invalid credentials for ${title}`);
        }
      } catch {
        // Fallback for local UI testing without resolving backend
        if (email && password) navigate(`/${role}`);
      }
    };

    return (
      <div className="portal-card">
        <div className={`portal-header ${type}`}>{title}</div>
        <div className="portal-body">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin}>LOGIN</button>
          <div className="portal-icon">{icon}</div>
        </div>
      </div>
    );
  };

  // Component for Parent OTP login card
  const ParentLoginCard = () => {
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");

    const handleLogin = () => {
      if (mobile && otp) {
        navigate(`/parent`); // Directly routing for UI testing
      } else {
        alert("Enter Mobile and OTP");
      }
    };

    return (
      <div className="portal-card">
        <div className="portal-header parent">Parent Login</div>
        <div className="portal-body">
          <input type="text" placeholder="Mobile No" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <button onClick={handleLogin}>LOGIN</button>
          <div className="portal-icon"><Users size={48} color="#94a3b8" /></div>
        </div>
      </div>
    );
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <button onClick={toggleTheme} style={{position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: 10, borderRadius: '50%', cursor: 'pointer'}}>
          {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
        </button>
        <h1>BVRIT - Smart Permission System</h1>
      </div>

      <div className="register-link">
        Click <span onClick={() => navigate("/register")}>here</span> to Register
      </div>

      <div className="portals-grid">
        <LoginCard title="Student Login" type="student" role="student" icon={<GraduationCap size={48} color="#94a3b8" />} />
        <LoginCard title="Faculty Login" type="faculty" role="faculty" icon={<Briefcase size={48} color="#94a3b8" />} />
        <LoginCard title="Warden Login" type="warden" role="warden" icon={<Shield size={48} color="#94a3b8" />} />
        <ParentLoginCard />
      </div>
    </div>
  );
}