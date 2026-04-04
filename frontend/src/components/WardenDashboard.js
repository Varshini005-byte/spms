import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css"; 

export default function WardenDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch("https://spms-ie7g.onrender.com/permissions?role=warden")
      .then(res => res.json())
      .then(data => { if(data.success) setRequests(data.data) })
      .catch(err => console.error(err));
  }, []);

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`https://spms-ie7g.onrender.com/permissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "warden", action })
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
            <p className="nav-subtitle" style={{color: '#2ecc71'}}>Warden Portal</p>
          </div>
          <button className="logout-btn" onClick={() => navigate("/")}>Logout</button>
        </div>
        <div className="scroll-content">
          <h3 className="form-title">Hosteler Requests</h3>
          {requests.map(req => (
            <div key={req.id} className="request-form-container" style={{marginBottom: 15}}>
              <p><strong>Student:</strong> {req.name}</p>
              <p><strong>Category:</strong> {req.category}</p>
              <p><strong>Attendance:</strong> {req.attendance}% {req.attendance < 75 && "⚠️ LOW"}</p>
              <p><strong>Reason:</strong> {req.reason}</p>
              {req.attachment_url && <a href={`https://spms-ie7g.onrender.com${req.attachment_url}`} target="_blank" rel="noreferrer">View Medical Document</a>}
              <div style={{marginTop: 15, display: 'flex', gap: 10}}>
                <button className="submit-btn" style={{flex: 1, padding: 10}} onClick={() => handleAction(req.id, "Approved")}>Approve</button>
                <button className="submit-btn" style={{flex: 1, padding: 10, background: "#e74c3c"}} onClick={() => handleAction(req.id, "Rejected")}>Reject</button>
              </div>
            </div>
          ))}
          {requests.length === 0 && <p style={{textAlign: 'center', color: '#666', marginTop: 40}}>No pending hostel requests.</p>}
        </div>
      </div>
    </div>
  );
}
