import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Activity, FileText, Tag, Sun, Moon } from "lucide-react";
import { useTheme } from "../App";
import "./StudentDashboard.css";

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [auth, setAuth] = useState(false);
  const [requests, setRequests] = useState([]);
  const [studentIdInput, setStudentIdInput] = useState("");

  const loginWithMockOTP = () => {
    if(studentIdInput) {
      alert("MOCK SMS SENT: Your OTP is 1234");
      const otp = prompt("Enter the OTP sent to your phone:");
      if(otp === "1234") {
        setAuth(true);
        fetchRequests(studentIdInput);
      } else {
        alert("Invalid OTP");
      }
    }
  };

  const fetchRequests = (id) => {
    fetch(`https://spms-ie7g.onrender.com/permissions?role=parent&id=${id}`)
      .then(res => res.json())
      .then(data => { if(data.success) setRequests(data.data) })
      .catch(err => console.error(err));
  };

  const handleAction = async (req, action) => {
    if (action === "Rejected") {
        // Just reject directly (no OTP needed for rejection usually, or up to you)
        try {
          const res = await fetch(`https://spms-ie7g.onrender.com/permissions/${req.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "parent", action, name: user.name })
          });
          const data = await res.json();
          if(data.success) {
            alert("Request Rejected!");
            fetchRequests(studentIdInput);
          }
        } catch { alert("Error"); }
        return;
    }

    // OTP Required for Approval
    const otpCode = prompt("🔐 An OTP has been sent to your registered email.\n\nPlease enter the 6-digit code to Approve:");
    if (!otpCode) return;

    try {
      const res = await fetch(`https://spms-ie7g.onrender.com/parent/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            student_id: req.student_id, 
            otp: otpCode, 
            permission_id: req.id 
        })
      });
      const data = await res.json();
      if(data.success) {
        alert("✅ OTP Verified and Approved!");
        fetchRequests(studentIdInput);
      } else {
        alert(data.message || "Invalid OTP ❌");
      }
    } catch {
      alert("Server error ⚠️");
    }
  };

  if(!auth) {
    return (
      <div className="app-container">
        <div className="mobile-wrapper" style={{justifyContent: 'center', background: 'var(--bg-app)'}}>
          <div className="scroll-content">
            <div className="request-form-container" style={{textAlign: 'center'}}>
               <h3 className="form-title" style={{color: '#3498db'}}>Parent Virtual Login</h3>
               <p style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Enter Student Roll No to review their requests.</p>
               <input type="text" placeholder="Roll No (e.g. 21B01...)" className="custom-form" onChange={(e) => setStudentIdInput(e.target.value.toUpperCase())} style={{width: '100%', padding: 12, margin: '15px 0', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-main)'}} />
               <button className="submit-btn" style={{width: '100%'}} onClick={() => {
                   if(studentIdInput) {
                       setAuth(true);
                       fetchRequests(studentIdInput);
                   }
               }}>Login</button>
               <div style={{marginTop: 20, display: 'flex', justifyContent: 'center', gap: 10}}>
                 <button className="logout-btn" onClick={toggleTheme}>
                   {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
                 </button>
                 <button className="back-btn" onClick={() => navigate("/")}>← Back to Home</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="mobile-wrapper">
        <div className="top-nav">
          <div>
            <h1 className="nav-title">Parent Portal</h1>
            <p className="nav-subtitle">{user?.name} (Parent of {user?.parent_of_roll_no})</p>
          </div>
          <div style={{display: 'flex', gap: 10}}>
            <button className="logout-btn" style={{background: 'var(--bg-input)'}} onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
            </button>
            <button className="logout-btn" onClick={() => setAuth(false)}>Logout</button>
          </div>
        </div>
        <div className="scroll-content">
          <h3 className="form-title">Your Student's Requests</h3>
          {requests.map(req => (
            <div key={req.id} className="request-form-container" style={{marginBottom: 15, borderLeft: '5px solid var(--primary)'}}>
              <div className="status-stepper" style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20, padding: '10px', background: 'var(--bg-input)', borderRadius: 10}}>
                {[
                  { label: 'Coun.', status: req.status_counselor, name: req.c_name },
                  { label: 'Tea.', status: req.status_class_teacher, name: req.t_name },
                  { label: 'HOD.', status: req.status_hod, name: req.h_name },
                  { label: 'Ward.', status: req.status_warden, name: req.w_name }
                ].map((step, i) => (
                  <div key={i} style={{textAlign: 'center', flex: 1}}>
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%', margin: '0 auto',
                      background: step.status === 'Approved' ? '#10b981' : step.status === 'Pending' ? '#f59e0b' : '#e2e8f0'
                    }}></div>
                    <div style={{fontSize: '0.6rem', fontWeight: 700, marginTop: 4, color: 'var(--text-main)'}}>{step.label}</div>
                    {step.name && <div style={{fontSize: '0.5rem', color: 'var(--text-muted)'}}>{step.name.split(' ')[0]}</div>}
                  </div>
                ))}
              </div>

              <div className="request-detail"><Tag size={16} /> <strong>Category:</strong> {req.category}</div>
              <div className="request-detail"><Activity size={16} /> <strong>Attendance:</strong> {req.attendance}% {req.attendance < 75 && <span style={{color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: 4}}><AlertTriangle size={16} /> LOW</span>}</div>
              <div className="request-detail"><FileText size={16} /> <strong>Reason:</strong> {req.reason}</div>
              {req.attachment_url && <a href={`https://spms-ie7g.onrender.com${req.attachment_url}`} target="_blank" rel="noreferrer" style={{fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none'}}>View Document</a>}
              <div style={{marginTop: 15, display: 'flex', gap: 10}}>
                <button className="submit-btn" style={{flex: 1, padding: 12, fontSize: '0.85rem', background: '#10b981'}} onClick={() => handleAction(req, "Approved")}>Approve</button>
                <button className="submit-btn" style={{flex: 1, padding: 12, fontSize: '0.85rem', background: "#ef4444"}} onClick={() => handleAction(req, "Rejected")}>Reject</button>
              </div>
            </div>
          ))}
          {requests.length === 0 && <p style={{textAlign: 'center', color: '#94a3b8', marginTop: 40}}>No pending approval needed.</p>}
        </div>
      </div>
    </div>
  );
}
