import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Stethoscope, GraduationCap, Rocket, MapPin, ClipboardList, Clock, CheckCircle, XCircle, QrCode, ArrowLeft, Sun, Moon } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useTheme } from "../App";
import "./StudentDashboard.css";
import { API_BASE } from "../apiConfig";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [activeView, setActiveView] = useState("Dashboard");
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ reason: "", attachment: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!user.id) return navigate("/");
    fetchHistory();
  }, [user.id]);

  const fetchHistory = () => {
    fetch(`${API_BASE}/permissions?role=student&id=${user.id}`)
      .then(res => res.json())
      .then(data => { if (data.success) setRequests(data.data) })
      .catch(err => console.error(err));
  };

  const menuOptions = [
    { name: "Dashboard", icon: <Home size={20} /> },
    { name: "My Requests", icon: <ClipboardList size={20} /> },
    { name: "Medical Leave", icon: <Stethoscope size={20} /> },
    { name: "Campus Events", icon: <GraduationCap size={20} /> },
    { name: "Off-Campus Events", icon: <Rocket size={20} /> },
    { name: "General Outing", icon: <MapPin size={20} /> },
    { name: "My Passes", icon: <QrCode size={20} /> }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("student_id", user.id);
    formData.append("category", activeView);
    formData.append("reason", form.reason);
    if (form.attachment) formData.append("attachment", form.attachment);

    try {
      const res = await fetch(`${API_BASE}/permissions/request`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          message: data.autoApproved ? "Auto-Approved! Check 'My Passes' ✅" : "Request Submitted Successfully ✅",
          type: "success"
        });
        setForm({ reason: "", attachment: null });
        fetchHistory();
        setTimeout(() => {
          setNotification(null);
          setActiveView("Dashboard");
        }, 3000);
      } else {
        setNotification({ message: data.message || "Submission failed ❌", type: "error" });
      }
    } catch {
      setNotification({ message: "Network error ⚠️", type: "error" });
    } finally {
      setIsSubmitting(false);
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
              { label: 'Counselor', status: req.status_counselor, name: req.c_name },
              { label: 'Teacher', status: req.status_class_teacher, name: req.t_name },
              { label: 'HOD', status: req.status_hod, name: req.h_name },
              { label: 'Warden', status: req.status_warden, name: req.w_name },
              { label: 'Parent', status: req.status_parent, name: req.parent_name }
            ].map((step, i) => (
              <div key={i} style={{textAlign: 'center', flex: 1, position: 'relative', zIndex: 1}}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', margin: '0 auto',
                  background: step.status === 'Approved' ? '#10b981' : step.status === 'Pending' ? '#f59e0b' : step.status === 'Rejected' ? '#ef4444' : '#e2e8f0',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700
                }}>
                  {step.status === 'Approved' ? '✓' : step.status === 'Pending' ? '...' : i+1}
                </div>
                <div style={{fontSize: '0.6rem', fontWeight: 700, marginTop: 4, color: 'var(--text-main)'}}>{step.label}</div>
                {step.status === 'Approved' && step.name && (
                   <div style={{fontSize: '0.5rem', color: '#10b981', fontWeight: 500}}>By {step.name.split(' ')[0]}</div>
                )}
                {step.status === 'Rejected' && (
                   <div style={{fontSize: '0.5rem', color: '#ef4444', fontWeight: 500}}>Rejected</div>
                )}
                {step.status === 'Pending' && (
                   <div style={{fontSize: '0.5rem', color: '#f59e0b', fontWeight: 500}}>Awaiting</div>
                )}
              </div>
            ))}
          </div>
 Riverside          
          <div style={{marginTop: 15, padding: '10px', background: 'var(--bg-input)', borderRadius: 8, fontSize: '0.85rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <strong>Final Status:</strong> 
              <span style={{color: req.final_status.includes('Approved') ? '#10b981' : req.final_status.includes('Rejected') ? '#ef4444' : '#f59e0b'}}>
                {req.final_status}
              </span>
            </div>
            {req.rejected_by && <div style={{marginTop: 5, fontSize: '0.75rem', color: '#ef4444'}}>Rejected by: {req.rejected_by}</div>}
            {req.attachment_url && <div style={{marginTop: 5}}><a href={req.attachment_url.startsWith('http') ? req.attachment_url : `${API_BASE}${req.attachment_url}`} target="_blank" rel="noreferrer" style={{color: '#2563eb', textDecoration: 'none'}}>View Attachment</a></div>}
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
        <input 
          type="text" 
          placeholder="Brief reason for permission" 
          required 
          value={form.reason}
          onChange={e => setForm({...form, reason: e.target.value})} 
        />
        
        <label>Attach Proof (Required for all categories)</label>
        <div style={{position: 'relative', marginTop: '8px'}}>
          <input 
            type="file" 
            id="file-upload"
            style={{display: 'none'}}
            required
            onChange={e => setForm({...form, attachment: e.target.files[0]})} 
          />
          <label 
            htmlFor="file-upload" 
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '12px', background: 'var(--bg-input)', border: '2px dashed var(--border)',
              borderRadius: '12px', cursor: 'pointer', margin: 0, color: 'var(--text-main)'
            }}
          >
            <MapPin size={18} /> {form.attachment ? form.attachment.name : "Choose File"}
          </label>
        </div>

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={isSubmitting}
          style={{marginTop: '25px', opacity: isSubmitting ? 0.7 : 1}}
        >
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );

  return (
    <div className="app-container">
      <div className="mobile-wrapper">
        <div className="top-nav">
          <div><h1 className="nav-title">BVRIT SPMS</h1><p className="nav-subtitle">{user.name} ({user.roll_no})</p></div>
          <div style={{display: 'flex', gap: 10}}>
             <button className="logout-btn" style={{background: 'var(--bg-input)'}} onClick={toggleTheme}>
               {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
             </button>
             <button className="logout-btn" onClick={() => { localStorage.clear(); navigate("/"); }}>Logout</button>
          </div>
        </div>

        <div className="scroll-content">
          {notification && (
            <div style={{
              position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, padding: '12px 24px', borderRadius: '12px',
              background: notification.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white', fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
            }}>
              {notification.message}
            </div>
          )}
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
