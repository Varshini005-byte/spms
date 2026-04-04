import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("Dashboard");
  const [form, setForm] = useState({ reason: "", from: "", to: "", desc: "", attachment: null });

  // Navigation Options identical to Screenshot #4
  const menuOptions = [
    { name: "Dashboard", icon: "🏠" },
    { name: "Medical Leave", icon: "🩺" },
    { name: "Campus Events (In-Pass)", icon: "🎓" },
    { name: "Off-Campus Events", icon: "🚀" },
    { name: "General Outing", icon: "🚶" }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Request for ${activeView} submitted!`);
    setActiveView("Dashboard");
  };

  const renderDashboardCards = () => (
    <>
      <div className="stat-card">
        <div>
          <div className="stat-label">Total Requests</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat-icon">📋</div>
      </div>
      <div className="stat-card">
        <div>
          <div className="stat-label">Pending</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat-icon">⏳</div>
      </div>
      <div className="stat-card">
        <div>
          <div className="stat-label">Approved</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat-icon" style={{color: "#4cd137"}}>✅</div>
      </div>
      <div className="stat-card">
        <div>
          <div className="stat-label">Rejected</div>
          <div className="stat-value">0</div>
        </div>
        <div className="stat-icon">❌</div>
      </div>

      <div className="menu-list">
        {menuOptions.map(opt => (
          <div key={opt.name} className={`menu-item ${activeView === opt.name ? 'active' : ''}`} onClick={() => setActiveView(opt.name)}>
            <span className="menu-icon">{opt.icon}</span>
            <span className="menu-text">{opt.name}</span>
          </div>
        ))}
      </div>
    </>
  );

  const renderForm = () => (
    <div className="request-form-container">
      <h3 className="form-title">Request {activeView}</h3>
      <form onSubmit={handleSubmit} className="custom-form">
        <label>Reason</label>
        <input type="text" placeholder="Brief reason for permission" required />
        
        <label>From Date</label>
        <input type="date" required />
        
        <label>To Date</label>
        <input type="date" required />

        <label>Description (Optional)</label>
        <textarea rows="3" placeholder="Additional details..." />

        {activeView === "Medical Leave" && (
          <>
            <label>Attach Document (PDF/Image)</label>
            <input type="file" />
          </>
        )}

        <button type="submit" className="submit-btn" style={{marginTop: '20px'}}>Submit Request</button>
      </form>
    </div>
  );

  return (
    <div className="app-container">
      <div className="mobile-wrapper">
        
        <div className="top-nav">
          <div>
            <h1 className="nav-title">BVRIT SPMS</h1>
            <p className="nav-subtitle">Student Portal</p>
          </div>
          <button className="logout-btn" onClick={() => navigate("/")}>Logout</button>
        </div>

        <div className="scroll-content">
          {activeView === "Dashboard" && renderDashboardCards()}
          {activeView !== "Dashboard" && (
            <>
              <button className="back-btn" onClick={() => setActiveView("Dashboard")}>← Back to Dashboard</button>
              {renderForm()}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
