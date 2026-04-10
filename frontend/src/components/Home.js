import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Briefcase, Shield, Users, Sun, Moon } from "lucide-react";
import { useTheme } from "../App";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const LoginCard = ({ title, type, role, icon }) => {
    const [idInput, setIdInput] = useState("");
    const [passInput, setPassInput] = useState("");

    const handleLogin = async () => {
      try {
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: idInput, password: passInput, role: role })
        });
        const data = await res.json();
        
        if (data.success) {
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate(`/${data.user.role}`);
        } else {
          alert(data.message || "Invalid credentials ❌");
        }
      } catch (err) {
        console.error(err);
        alert("Server error ⚠️");
      }
    };

    const getLabel = () => {
      if (role === 'student') return "Roll Number :";
      if (role === 'faculty') return "Faculty ID :";
      if (role === 'warden' || role === 'parent') return "Phone Number :";
      return "Login ID :";
    };

    return (
      <div className="portal-card">
        <div className={`portal-header ${type}`}>{title}</div>
        <div className="portal-body">
          <div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
            <label>{getLabel()}</label>
            <input type="text" placeholder={`Enter ${getLabel().replace(' :', '')}`} onChange={(e) => setIdInput(e.target.value)} />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
            <label>Password :</label>
            <input type="password" placeholder="••••••••" onChange={(e) => setPassInput(e.target.value)} />
          </div>

          <div className="login-btn-container">
            <button className="login-btn" onClick={handleLogin}>LOGIN</button>
          </div>
          
          <div className="portal-icon" style={{marginTop: 15, textAlign: 'center', opacity: 0.3}}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="home-container">
      <div className="banner-section">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
           <h1 style={{margin: 0}}>Smart Permission Management</h1>
           <button onClick={toggleTheme} style={{background: 'var(--bg-input)', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-main)'}}>
             {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
           </button>
        </div>
        <div className="banner-links" style={{marginTop: 15}}>
           Click <span onClick={() => navigate("/register")}>here</span> to Register
        </div>
      </div>

      <div className="portals-grid">
        <LoginCard title="Faculty Login" type="employee" role="faculty" icon={<Briefcase size={48} color="#94a3b8" />} />
        <LoginCard title="Student Login" type="student" role="student" icon={<GraduationCap size={48} color="#94a3b8" />} />
        <LoginCard title="Warden Login" type="warden" role="warden" icon={<Shield size={48} color="#94a3b8" />} />
        <LoginCard title="Parent Login" type="parent" role="parent" icon={<Users size={48} color="#94a3b8" />} />
      </div>
    </div>
  );
}