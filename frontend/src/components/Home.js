import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Briefcase, Shield, Users, Sun, Moon } from "lucide-react";
import { useTheme } from "../App";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Component for standard ID/Pass login card
  const LoginCard = ({ title, type, role, icon }) => {
    const [idInput, setIdInput] = useState("");
    const [passInput, setPassInput] = useState("");
    const [subRole, setSubRole] = useState("counselor");

    const handleLogin = () => {
      if (idInput && passInput) {
        // Mock data logic for professional demo
        const names = {
          student: "Varshini (Student)",
          faculty: `Prof. Rao (${subRole.replace('_', ' ')})`,
          warden: "Chief Warden",
          parent: "Student Parent"
        };
        
        let userData = { 
          id: idInput, 
          name: names[role] || "User", 
          role: role, 
          sub_role: role === 'faculty' ? subRole : null 
        };
        
        localStorage.setItem("user", JSON.stringify(userData));
        navigate(`/${role}`);
      } else {
        alert("Please enter ID and Password");
      }
    };

    return (
      <div className="portal-card">
        <div className={`portal-header ${type}`}>
          {title}
        </div>
        <div className="portal-body">
          <input type="text" placeholder="College ID" value={idInput} onChange={(e) => setIdInput(e.target.value)} />
          <input type="password" placeholder="Password" value={passInput} onChange={(e) => setPassInput(e.target.value)} />
          
          {role === 'faculty' && (
            <select 
              style={{width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', marginBottom: 10}} 
              onChange={(e) => setSubRole(e.target.value)}
            >
               <option value="counselor">Role: Counselor</option>
               <option value="class_teacher">Role: Class Teacher</option>
               <option value="hod">Role: HOD</option>
            </select>
          )}

          <button onClick={handleLogin}>Login</button>
          <div className="portal-icon" style={{marginTop: 15, opacity: 0.2}}>{icon}</div>
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