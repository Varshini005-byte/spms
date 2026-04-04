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

  const renderMyRequests = () => (
    <div className="scroll-content" style={{padding: 0}}>
      <h3 className="form-title">Track My Requests</h3>
      {requests.map(req => (
        <div key={req.id} className="request-form-container" style={{marginBottom: 20, borderLeft: '4px solid var(--primary)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 10}}>
             <span style={{fontWeight: 700, fontSize: '0.9rem'}}>{req.category}</span>
             <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{new Date(req.created_at).toLocaleDateString()}</span>
          </div>
          
          <div className="status-stepper" style={{display: 'flex', justifyContent: 'space-between', marginTop: 15, position: 'relative'}}>
            {[
              { label: 'Counsellor', status: req.status_counselor, name: req.c_name },
              { label: 'Teacher', status: req.status_class_teacher, name: req.t_name },
              { label: 'HOD', status: req.status_hod, name: req.h_name },
              { label: 'Warden', status: req.status_warden, name: req.w_name }
            ].map((step, i) => (
              <div key={i} style={{textAlign: 'center', flex: 1, position: 'relative', zIndex: 1}}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', margin: '0 auto',
                  background: step.status === 'Approved' ? '#10b981' : step.status === 'Pending' ? '#f59e0b' : step.status === 'Rejected' ? '#ef4444' : '#e2e8f0',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem'
                }}>
                  {step.status === 'Approved' ? '✓' : step.status === 'Pending' ? '...' : i+1}
                </div>
                <div style={{fontSize: '0.65rem', fontWeight: 700, marginTop: 4, color: 'var(--text-main)'}}>{step.label}</div>
                {step.name && <div style={{fontSize: '0.6rem', color: 'var(--text-muted)'}}>{step.name}</div>}
              </div>
            ))}
          </div>
          
          <div style={{marginTop: 15, padding: '10px', background: 'var(--bg-input)', borderRadius: 8, fontSize: '0.85rem'}}>
            <strong>Final Status:</strong> 
            <span style={{marginLeft: 8, color: req.final_status.includes('Approved') ? '#10b981' : req.final_status === 'Rejected' ? '#ef4444' : '#f59e0b'}}>
              {req.final_status}
            </span>
          </div>
        </div>
      ))}
      {requests.length === 0 && <p style={{textAlign: 'center', color: '#94a3b8'}}>No requests found.</p>}
    </div>
  );

  const renderPasses = () => (
    <div className="scroll-content" style={{padding: 0}}>
      <h3 className="form-title">Active Exit Passes</h3>
      {requests.filter(r => r.final_status.includes("Approved")).map(req => (
        <div key={req.id} className="request-form-container" style={{textAlign: 'center', marginBottom: 20}}>
          <div style={{marginBottom: 15, padding: 10, background: '#f8fafc', borderRadius: 12, display: 'inline-block'}}>
            <QRCodeCanvas value={`ID:${req.id}-STU:${user.id}`} size={160} />
          </div>
          <div className="request-detail"><strong>Category:</strong> {req.category}</div>
          <div className="request-detail"><strong>Date:</strong> {new Date(req.created_at).toLocaleDateString()}</div>
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
          {activeView === "My Requests" && (
            <>
              <button className="back-btn" onClick={() => setActiveView("Dashboard")}><ArrowLeft size={16}/> Back</button>
              {renderMyRequests()}
            </>
          )}
          {activeView === "My Passes" && (
            <>
              <button className="back-btn" onClick={() => setActiveView("Dashboard")}><ArrowLeft size={16}/> Back</button>
              {renderPasses()}
            </>
          )}
          {activeView !== "Dashboard" && activeView !== "My Requests" && activeView !== "My Passes" && (
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
