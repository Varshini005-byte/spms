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
    const [subRole, setSubRole] = useState("counselor");

    const handleLogin = () => {
      if (idInput && passInput) {
        const names = {
          student: "Varshini (Student)",
          faculty: `Prof. Rao (${subRole.replace('_', ' ')})`,
          warden: "Chief Warden",
          parent: "Student Parent"
        };
        let userData = { id: idInput, name: names[role] || "User", role, sub_role: role === 'faculty' ? subRole : null };
        localStorage.setItem("user", JSON.stringify(userData));
        navigate(`/${role}`);
      } else {
        alert("Enter Credentials");
      }
    };

    return (
      <div className="portal-card">
        <div className={`portal-header ${type}`}>{title}</div>
        <div className="portal-body">
          <div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
            <label>{role === 'parent' ? "Roll.No :" : "User Name :"}</label>
            <input type="text" onChange={(e) => setIdInput(e.target.value)} />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
            <label>{role === 'parent' ? "Mobile No :" : "Password :"}</label>
            <input type="password" onChange={(e) => setPassInput(e.target.value)} />
          </div>

          {role === 'faculty' && (
            <select style={{marginTop: 5}} onChange={(e) => setSubRole(e.target.value)}>
               <option value="counselor">Role: Counselor</option>
               <option value="class_teacher">Role: Class Teacher</option>
               <option value="hod">Role: HOD</option>
            </select>
          )}

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
        <img src="https://bvrit.edu.in/wp-content/uploads/2021/04/bvrit_logo.png" style={{height: 60}} alt="BVRIT Logo" />
        <h1>BVRIT - Smart Permission Management System</h1>
        <div className="banner-links">
           Click <span onClick={() => navigate("/register")}>here</span> to Register
           <br/>
           Click <span>here</span> to view the on-line payment process
        </div>
      </div>

      <div className="portals-grid" style={{background: '#f8fafc'}}>
        <LoginCard title="Employee Login" type="employee" role="faculty" icon={<Briefcase size={48} color="#94a3b8" />} />
        <LoginCard title="Student Login" type="student" role="student" icon={<GraduationCap size={48} color="#94a3b8" />} />
        <LoginCard title="Warden Login" type="warden" role="warden" icon={<Shield size={48} color="#94a3b8" />} />
        <LoginCard title="Parent Login" type="parent" role="parent" icon={<Users size={48} color="#94a3b8" />} />
      </div>

      <div className="footer-section">
        Copyright © All rights reserved by Padmasri Dr. B V Raju Institute of Technology, Vishnupur, Narsapur, Medak<br/>
        Powered by Webpros Solutions Pvt Ltd.,
      </div>
    </div>
  );
}