import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Stethoscope, GraduationCap, Rocket, MapPin, ClipboardList, Clock, CheckCircle, XCircle, QrCode, ArrowLeft, Sun, Moon, AlertTriangle } from "lucide-react";
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
  const [form, setForm] = useState({ reason: "", attachment: null, isEmergency: false });
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
    { name: "Emergency Leave", icon: <AlertTriangle size={20} color="#ef4444" /> },
    { name: "My Passes", icon: <QrCode size={20} /> }
  ];

  const handleEscalate = async (id) => {
    if (!window.confirm("Are you sure you want to escalate this to an Emergency? The HOD will be notified directly.")) return;
    try {
      const res = await fetch(`${API_BASE}/permissions/${id}/escalate`, { method: "PUT" });
      const data = await res.json();
      if (data.success) {
        setNotification({ message: "Escalated to Emergency! 🚨", type: "success" });
        fetchHistory();
      } else {
        setNotification({ message: "Escalation failed ❌", type: "error" });
      }
    } catch {
      setNotification({ message: "Network error ⚠️", type: "error" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("student_id", user.id);
    formData.append("category", activeView);
    formData.append("reason", form.reason);
    formData.append("is_emergency", activeView === "Emergency Leave" ? "true" : "false");
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
        setForm({ reason: "", attachment: null, isEmergency: false });
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
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px'}}>
          <div className="stat-card" style={{margin: 0}}>
            <div><div className="stat-label">Pending</div><div className="stat-value">{stats.pending}</div></div>
            <div className="stat-icon"><Clock size={24} color="#f59e0b" /></div>
          </div>
          <div className="stat-card" style={{margin: 0}}>
            <div><div className="stat-label">Approved</div><div className="stat-value">{stats.approved}</div></div>
            <div className="stat-icon"><CheckCircle size={24} color="#10b981" /></div>
          </div>
        </div>

        <div className="menu-list" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '25px'}}>
          {menuOptions.filter(opt => opt.name !== 'Dashboard' && opt.name !== 'My Requests' && opt.name !== 'My Passes').map(opt => (
            <div key={opt.name} className="menu-item" onClick={() => setActiveView(opt.name)} style={{flexDirection: 'column', height: '80px', justifyContent: 'center', textAlign: 'center'}}>
              <span className="menu-icon">{opt.icon}</span>
              <span className="menu-text" style={{fontSize: '0.75rem'}}>{opt.name}</span>
            </div>
          ))}
        </div>

        <h3 className="form-title">Recent Request Flow</h3>
        {requests.slice(0, 3).map(req => (
          <div key={req.id} className="request-form-container" style={{marginBottom: 15, padding: '15px', borderLeft: '4px solid var(--primary)', borderRadius: '12px', background: 'var(--bg-app)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}>
             {renderRequestItem(req)}
          </div>
        ))}
        {requests.length > 3 && (
          <button className="submit-btn" style={{background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '8px'}} onClick={() => setActiveView("My Requests")}>
            View All History
          </button>
        )}
        {requests.length === 0 && <p style={{textAlign: 'center', color: '#94a3b8'}}>No recent requests.</p>}
      </>
    );
  };

  const renderRequestItem = (req) => (
    <>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 12}}>
         <span style={{fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)'}}>{req.category}</span>
         <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{new Date(req.created_at).toLocaleDateString()}</span>
      </div>
      
      <div className="status-stepper" style={{display: 'flex', justifyContent: 'space-between', marginTop: 5, position: 'relative'}}>
        {[
          { label: 'Coun.', status: req.status_counselor, name: req.c_name, key: 'status_counselor' },
          { label: 'Tea.', status: req.status_class_teacher, name: req.t_name, key: 'status_class_teacher' },
          { label: 'HOD', status: req.status_hod, name: req.h_name, key: 'status_hod' },
          { label: 'War.', status: req.status_warden, name: req.w_name, key: 'status_warden' },
          { label: 'Par.', status: req.status_parent, name: req.parent_name, key: 'status_parent' }
        ].map((step, i) => {
          const isRejectedHere = step.status === 'Rejected';
          return (
            <div key={i} style={{textAlign: 'center', flex: 1, position: 'relative', zIndex: 1}}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', margin: '0 auto',
                background: step.status === 'Approved' ? '#10b981' : step.status === 'Pending' ? '#f59e0b' : step.status === 'Rejected' ? '#ef4444' : '#e2e8f0',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700
              }}>
                {step.status === 'Approved' ? '✓' : step.status === 'Pending' ? '...' : i+1}
              </div>
              <div style={{fontSize: '0.55rem', fontWeight: 700, marginTop: 4, color: 'var(--text-main)'}}>{step.label}</div>
              {step.status === 'Approved' && step.name && (
                 <div style={{fontSize: '0.5rem', color: '#10b981', fontWeight: 500}}>{step.name.split(' ')[0]}</div>
              )}
              {isRejectedHere && (
                 <div style={{fontSize: '0.5rem', color: '#ef4444', fontWeight: 500}}>Rejected {req.rejected_by ? `by ${req.rejected_by.split(' ')[0]}` : ''}</div>
              )}
              {step.status === 'Pending' && (
                 <div style={{fontSize: '0.5rem', color: '#f59e0b', fontWeight: 500}}>Pending</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{marginTop: 15, padding: '10px', background: 'var(--bg-input)', borderRadius: 8, fontSize: '0.8rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <strong>Final Status:</strong> 
          <span className={`status-badge ${req.final_status.toLowerCase().includes('approved') ? 'approved' : req.final_status.toLowerCase().includes('rejected') ? 'rejected' : 'pending'}`} style={{padding: '2px 8px', fontSize: '0.7rem'}}>
            {req.final_status}
          </span>
        </div>
      </div>

      {req.final_status === 'Pending' && req.priority !== 'Urgent' && (Date.now() - new Date(req.created_at).getTime() > 30 * 60 * 1000) && (
        <div style={{ marginTop: 15 }}>
          <button 
            className="submit-btn" 
            style={{ width: '100%', padding: '10px', fontSize: '0.8rem', background: '#8b5cf6' }}
            onClick={() => handleEscalate(req.id)}
          >
            🚨 Escalate to Emergency (No response > 30 mins)
          </button>
        </div>
      )}
    </>
  );

  const renderMyRequests = () => (
    <div className="scroll-content" style={{padding: 0}}>
      <h3 className="form-title">Track My Requests</h3>
      {requests.map(req => (
        <div key={req.id} className="request-form-container" style={{marginBottom: 20, borderLeft: '4px solid var(--primary)'}}>
          {renderRequestItem(req)}
          {req.attachment_url && <div style={{marginTop: 10, fontSize: '0.75rem'}}><a href={req.attachment_url.startsWith('http') ? req.attachment_url : `${API_BASE}${req.attachment_url}`} target="_blank" rel="noreferrer" style={{color: '#2563eb', textDecoration: 'none'}}>View Attachment</a></div>}
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
