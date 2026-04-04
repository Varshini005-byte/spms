import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, User, Activity, FileText } from "lucide-react";
import "./StudentDashboard.css"; 

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch("https://spms-ie7g.onrender.com/permissions?role=faculty")
      .then(res => res.json())
      .then(data => { if(data.success) setRequests(data.data) })
      .catch(err => console.error(err));
  }, []);

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`https://spms-ie7g.onrender.com/permissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "faculty", action })
      });
      const data = await res.json();
      if(data.success) {
        alert("Action successful");
        setRequests(requests.filter(r => r.id !== id));
      }
    } catch {
      alert("Error");
    }
  };

  return (
    <div className="app-container">
      <div className="mobile-wrapper">
        <div className="top-nav">
          <div>
            <h1 className="nav-title">BVRIT SPMS</h1>
            <p className="nav-subtitle" style={{color: '#9b59b6'}}>Faculty Portal</p>
          </div>
          <button className="logout-btn" onClick={() => navigate("/")}>Logout</button>
        </div>
        <div className="scroll-content">
          <h3 className="form-title">Pending Approvals</h3>
          {requests.map(req => (
            <div key={req.id} className="request-form-container" style={{marginBottom: 15}}>
              <div className="request-detail"><User size={16} /> <strong>Student:</strong> {req.name} ({req.residence_type})</div>
              <div className="request-detail"><Activity size={16} /> <strong>Attendance:</strong> {req.attendance}% {req.attendance < 75 && <span style={{color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: 4}}><AlertTriangle size={16} /> LOW</span>}</div>
              <div className="request-detail"><FileText size={16} /> <strong>Reason:</strong> {req.reason}</div>
              {req.attachment_url && <a href={`https://spms-ie7g.onrender.com${req.attachment_url}`} target="_blank" rel="noreferrer">View Attachment</a>}
              <div style={{marginTop: 15, display: 'flex', gap: 10}}>
                <button className="submit-btn" style={{flex: 1, padding: 10}} onClick={() => handleAction(req.id, "Approved")}>Approve</button>
                <button className="submit-btn" style={{flex: 1, padding: 10, background: "#e74c3c"}} onClick={() => handleAction(req.id, "Rejected")}>Reject</button>
              </div>
            </div>
          ))}
          {requests.length === 0 && <p style={{textAlign: 'center', color: '#666', marginTop: 40}}>No pending requests.</p>}
        </div>
      </div>
    </div>
  );
}
