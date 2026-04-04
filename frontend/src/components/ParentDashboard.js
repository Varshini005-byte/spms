import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Activity, FileText, Tag } from "lucide-react";
import "./StudentDashboard.css";

export default function ParentDashboard() {
  const navigate = useNavigate();
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

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`https://spms-ie7g.onrender.com/permissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "parent", action })
      });
      const data = await res.json();
      if(data.success) {
        alert(`Request definitively ${action}!`);
        setRequests(requests.filter(r => r.id !== id));
      }
    } catch {
      alert("Error");
    }
  };

  if(!auth) {
    return (
      <div className="app-container">
        <div className="mobile-wrapper" style={{justifyContent: 'center'}}>
          <div className="scroll-content">
            <div className="request-form-container" style={{textAlign: 'center'}}>
               <h3 className="form-title" style={{color: '#3498db'}}>Parent Virtual Login</h3>
               <p style={{fontSize: '0.85rem', color: '#666'}}>Enter Student ID to review their requests.</p>
               <input type="text" placeholder="Student ID" className="custom-form" onChange={(e) => setStudentIdInput(e.target.value)} style={{width: '100%', padding: 12, margin: '15px 0', border: '1px solid #ccc', borderRadius: 8}} />
               <button className="submit-btn" style={{width: '100%'}} onClick={loginWithMockOTP}>Get OTP</button>
               <button className="back-btn" style={{marginTop: 20}} onClick={() => navigate("/")}>← Back to Home</button>
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
            <h1 className="nav-title">BVRIT SPMS</h1>
            <p className="nav-subtitle" style={{color: '#3498db'}}>Parent Portal</p>
          </div>
          <button className="logout-btn" onClick={() => setAuth(false)}>Logout</button>
        </div>
        <div className="scroll-content">
          <h3 className="form-title">Your Student's Requests</h3>
          {requests.map(req => (
            <div key={req.id} className="request-form-container" style={{marginBottom: 15}}>
              <div className="request-detail"><Tag size={16} /> <strong>Category:</strong> {req.category}</div>
              <div className="request-detail"><Activity size={16} /> <strong>Attendance:</strong> {req.attendance}% {req.attendance < 75 && <span style={{color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: 4}}><AlertTriangle size={16} /> LOW</span>}</div>
              <div className="request-detail"><FileText size={16} /> <strong>Reason:</strong> {req.reason}</div>
              {req.attachment_url && <a href={`https://spms-ie7g.onrender.com${req.attachment_url}`} target="_blank" rel="noreferrer">View Attached Document</a>}
              <div style={{marginTop: 15, display: 'flex', gap: 10}}>
                <button className="submit-btn" style={{flex: 1, padding: 10}} onClick={() => handleAction(req.id, "Approved")}>Approve</button>
                <button className="submit-btn" style={{flex: 1, padding: 10, background: "#e74c3c"}} onClick={() => handleAction(req.id, "Rejected")}>Reject</button>
              </div>
            </div>
          ))}
          {requests.length === 0 && <p style={{textAlign: 'center', color: '#666', marginTop: 40}}>No pending approval needed.</p>}
        </div>
      </div>
    </div>
  );
}
