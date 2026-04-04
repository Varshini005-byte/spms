import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Stethoscope, GraduationCap, Rocket, MapPin, ClipboardList, Clock, CheckCircle, XCircle, QrCode, ArrowLeft, Sun, Moon } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useTheme } from "../App";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [activeView, setActiveView] = useState("Dashboard");
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ category: "", reason: "", attachment: null });

  useEffect(() => {
    if (!user.id) return navigate("/");
    fetchHistory();
  }, [user.id]);

  const fetchHistory = () => {
    fetch(`https://spms-ie7g.onrender.com/permissions?role=student&id=${user.id}`)
      .then(res => res.json())
      .then(data => { if (data.success) setRequests(data.data) })
      .catch(err => console.error(err));
  };

  const menuOptions = [
    { name: "Dashboard", icon: <Home size={20} /> },
    { name: "Medical Leave", icon: <Stethoscope size={20} /> },
    { name: "Campus Events", icon: <GraduationCap size={20} /> },
    { name: "Off-Campus Events", icon: <Rocket size={20} /> },
    { name: "General Outing", icon: <MapPin size={20} /> },
    { name: "My Passes", icon: <QrCode size={20} /> }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("student_id", user.id);
    formData.append("category", activeView);
    formData.append("reason", form.reason);
    if (form.attachment) formData.append("attachment", form.attachment);

    try {
      const res = await fetch("https://spms-ie7g.onrender.com/permissions/request", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert(data.autoApproved ? "Auto-Approved! Check 'My Passes' ✅" : "Request Submitted ✅");
        fetchHistory();
        setActiveView("Dashboard");
      }
    } catch {
      alert("Error submitting request");
    }
  };

  const renderDashboardCards = () => {
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.final_status === "Pending").length,
      approved: requests.filter(r => r.final_status.includes("Approved")).length,
      rejected: requests.filter(r => r.final_status.includes("Rejected")).length
    };

    return (
      <>
        <div className="stat-card">
          <div><div className="stat-label">Total Requests</div><div className="stat-value">{stats.total}</div></div>
          <div className="stat-icon"><ClipboardList size={28} color="#64748b" /></div>
        </div>
        <div className="stat-card">
          <div><div className="stat-label">Pending</div><div className="stat-value">{stats.pending}</div></div>
          <div className="stat-icon"><Clock size={28} color="#f59e0b" /></div>
        </div>
        <div className="stat-card">
          <div><div className="stat-label">Approved</div><div className="stat-value">{stats.approved}</div></div>
          <div className="stat-icon"><CheckCircle size={28} color="#10b981" /></div>
        </div>
        <div className="stat-card">
          <div><div className="stat-label">Rejected</div><div className="stat-value">{stats.rejected}</div></div>
          <div className="stat-icon"><XCircle size={28} color="#ef4444" /></div>
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
  };

  const renderPasses = () => (
    <div className="passes-container">
      <h3 className="form-title">Active Exit Passes</h3>
      {requests.filter(r => r.final_status.includes("Approved")).map(pass => (
        <div key={pass.id} className="request-form-container" style={{marginBottom: 20, textAlign: 'center'}}>
          <div style={{background: '#f8fafc', padding: 20, borderRadius: 16, display: 'inline-block', marginBottom: 15}}>
            <QRCodeCanvas value={`PASS-${pass.id}-${user.id}`} size={160} />
          </div>
          <h4 style={{margin: '0 0 10px 0'}}>{pass.category}</h4>
          <p style={{fontSize: '0.85rem', color: '#64748b'}}>{pass.reason}</p>
          <div className="status-badge approved">SCAN READY</div>
        </div>
      ))}
      {requests.filter(r => r.final_status.includes("Approved")).length === 0 && <p style={{textAlign: 'center', color: '#94a3b8'}}>No active passes found.</p>}
    </div>
  );

  const renderForm = () => (
    <div className="request-form-container">
      <h3 className="form-title">Request {activeView}</h3>
      <form onSubmit={handleSubmit} className="custom-form">
        <label>Reason</label>
        <input type="text" placeholder="Brief reason for permission" required onChange={e => setForm({...form, reason: e.target.value})} />
        
        {activeView === "Medical Leave" && (
          <>
            <label>Attach Proof (PDF/Image)</label>
            <input type="file" onChange={e => setForm({...form, attachment: e.target.files[0]})} />
          </>
        )}

        <button type="submit" className="submit-btn" style={{marginTop: '25px'}}>Submit Request</button>
      </form>
    </div>
  );

  return (
    <div className="app-container">
      <div className="mobile-wrapper">
        <div className="top-nav">
          <div><h1 className="nav-title">BVRIT SPMS</h1><p className="nav-subtitle">{user.name} (Student)</p></div>
          <div style={{display: 'flex', gap: 10}}>
             <button className="logout-btn" style={{background: 'var(--bg-input)'}} onClick={toggleTheme}>
               {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
             </button>
             <button className="logout-btn" onClick={() => { localStorage.clear(); navigate("/"); }}>Logout</button>
          </div>
        </div>

        <div className="scroll-content">
          {activeView === "Dashboard" && renderDashboardCards()}
          {activeView === "My Passes" && (
            <>
              <button className="back-btn" onClick={() => setActiveView("Dashboard")}><ArrowLeft size={16}/> Back</button>
              {renderPasses()}
            </>
          )}
          {activeView !== "Dashboard" && activeView !== "My Passes" && (
            <>
              <button className="back-btn" onClick={() => setActiveView("Dashboard")}><ArrowLeft size={16}/> Back</button>
              {renderForm()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
