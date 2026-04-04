import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css"; // We reuse the polished Dashboard styles

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "student",
    residence_type: "day_scholar"
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      alert("Passwords do not match ❌");
      return;
    }

    try {
      const res = await fetch("https://spms-ie7g.onrender.com/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.success) {
        alert("Registered successfully ✅");
        navigate("/");
      } else {
        alert(data.message || "User already exists ❌");
      }
    } catch {
      alert("Server error ⚠️");
    }
  };

  return (
    <div className="app-container">
      <div className="mobile-wrapper" style={{justifyContent: 'center'}}>
        <div className="scroll-content">
          <div className="request-form-container">
            <h3 className="form-title" style={{color: '#1976d2', textAlign: 'center'}}>Create an Account</h3>
            
            <form onSubmit={handleRegister} className="custom-form">
              <label>Full Name</label>
              <input required placeholder="Your Name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
              
              <label>College Email (.edu or .ac.in)</label>
              <input required type="email" placeholder="student@bvrit.ac.in" onChange={(e) => setForm({ ...form, email: e.target.value })} />
              
              <label>Password</label>
              <input required type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
              
              <label>Confirm Password</label>
              <input required type="password" placeholder="Re-enter Password" onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
              
              <label>Role</label>
              <select style={{padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', outline: 'none'}} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="warden">Warden</option>
                <option value="parent">Parent</option>
              </select>

              {form.role === 'student' && (
                <>
                  <label>Residence</label>
                  <select style={{padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', outline: 'none'}} onChange={(e) => setForm({ ...form, residence_type: e.target.value })}>
                    <option value="day_scholar">Day Scholar</option>
                    <option value="hosteler">Hosteler</option>
                  </select>
                </>
              )}

              <button type="submit" className="submit-btn" style={{marginTop: '25px'}}>Register Securely</button>
              <button type="button" className="back-btn" style={{marginTop: '20px', display: 'block', width: '100%'}} onClick={() => navigate("/")}>← Back to Login</button>
            </form>
            
          </div>
        </div>
      </div>
    </div>
  );
}