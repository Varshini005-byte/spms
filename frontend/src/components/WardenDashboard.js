import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, User, Activity, FileText, Tag, PieChart as PieChartIcon, BarChart as BarChartIcon, Sun, Moon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTheme } from "../App";
import "./StudentDashboard.css"; 

export default function WardenDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [requests, setRequests] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [viewMode, setViewMode] = useState("pending"); // "pending" or "history"

  const fetchRequests = () => {
    const url = viewMode === 'history' 
      ? `https://spms-ie7g.onrender.com/permissions?role=warden&view=history`
      : `https://spms-ie7g.onrender.com/permissions?role=warden`;

    fetch(url)
      .then(res => res.json())
      .then(data => { if(data.success) setRequests(data.data) })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchRequests();
  }, [viewMode]);

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`https://spms-ie7g.onrender.com/permissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "warden", action })
      });
      const data = await res.json();
      if(data.success) {
        setRequests(requests.filter(r => r.id !== id));
      }
    } catch {
      alert("Error");
    }
  };

  const analyticsData = [
    { name: 'Urgent', value: requests.filter(r => r.priority === 'Urgent').length },
    { name: 'Normal', value: requests.filter(r => r.priority === 'Normal').length },
  ];
  const COLORS = ['#ef4444', '#10b981'];

  return (
    <div className="app-container">
      <div className="mobile-wrapper">
        <div className="top-nav">
          <div>
            <h1 className="nav-title">Warden Portal</h1>
            <p className="nav-subtitle">{user.name} ({user.phone_no})</p>
          </div>
          <div style={{display: 'flex', gap: 10}}>
            <button className="logout-btn" style={{background: viewMode === 'history' ? '#10b981' : 'var(--bg-input)', color: viewMode === 'history' ? 'white' : 'var(--text-main)'}} onClick={() => setViewMode(viewMode === 'pending' ? 'history' : 'pending')}>
              <FileText size={18}/>
            </button>
            <button className="logout-btn" style={{background: '#f1f5f9', color: '#1e293b'}} onClick={() => setShowAnalytics(!showAnalytics)}>
              {showAnalytics ? <BarChartIcon size={18}/> : <PieChartIcon size={18}/>}
            </button>
            <button className="logout-btn" onClick={() => navigate("/")}>Logout</button>
          </div>
        </div>
        <div className="scroll-content">
          {showAnalytics ? (
            <div className="request-form-container" style={{height: 300, textAlign: 'center'}}>
              <h3 className="form-title">Hostel Stats</h3>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie data={analyticsData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {analyticsData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <>
              <h3 className="form-title">Hosteler Requests ({requests.length})</h3>
              {requests.map(req => (
                <div key={req.id} className="request-form-container" style={{marginBottom: 15, borderLeft: req.priority === 'Urgent' ? '5px solid #ef4444' : '5px solid #10b981'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                    <span className="stat-label" style={{color: req.priority === 'Urgent' ? '#ef4444' : '#64748b'}}>{req.priority} PRIORITY</span>
                    {req.suspicious_flag && <span style={{color: '#ef4444', fontSize: '0.75rem', fontWeight: 700}}>⚠️ RISK</span>}
                  </div>

                  <div className="status-stepper" style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20, padding: '10px', background: 'var(--bg-input)', borderRadius: 10}}>
                    {[
                      { label: 'Coun.', status: req.status_counselor, name: req.c_name },
                      { label: 'Tea.', status: req.status_class_teacher, name: req.t_name },
                      { label: 'HOD', status: req.status_hod, name: req.h_name },
                      { label: 'War.', status: req.status_warden, name: req.w_name }
                    ].map((step, i) => (
                      <div key={i} style={{textAlign: 'center', flex: 1}}>
                        <div style={{
                          width: 12, height: 12, borderRadius: '50%', margin: '0 auto',
                          background: step.status === 'Approved' ? '#10b981' : step.status === 'Pending' ? '#f59e0b' : step.status === 'Rejected' ? '#ef4444' : '#e2e8f0'
                        }}></div>
                        <div style={{fontSize: '0.6rem', fontWeight: 700, marginTop: 4, color: 'var(--text-main)'}}>{step.label}</div>
                        {step.name && <div style={{fontSize: '0.5rem', color: 'var(--text-muted)'}}>{step.name.split(' ')[0]}</div>}
                      </div>
                    ))}
                  </div>

                  <div className="request-detail"><User size={16} /> <strong>Student:</strong> {req.name}</div>
                  <div className="request-detail"><Tag size={16} /> <strong>Category:</strong> {req.category}</div>
                  <div className="request-detail"><Activity size={16} /> <strong>Attendance:</strong> {req.attendance}%</div>
                  <div className="request-detail"><FileText size={16} /> <strong>Reason:</strong> {req.reason}</div>
                  {req.attachment_url && <a href={`https://spms-ie7g.onrender.com${req.attachment_url}`} target="_blank" rel="noreferrer" style={{fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none'}}>View Document</a>}
                  
                  {viewMode === 'pending' ? (
                    <div style={{marginTop: 15, display: 'flex', gap: 10}}>
                      <button className="submit-btn" style={{flex: 1, padding: 12, fontSize: '0.85rem', background: "#10b981"}} onClick={() => handleAction(req.id, "Approved")}>Approve</button>
                      <button className="submit-btn" style={{flex: 1, padding: 12, fontSize: '0.85rem', background: "#ef4444"}} onClick={() => handleAction(req.id, "Rejected")}>Reject</button>
                    </div>
                  ) : (
                    <div style={{marginTop: 15, padding: '10px', background: 'var(--bg-input)', borderRadius: 8, fontSize: '0.85rem', textAlign: 'center'}}>
                      <strong>Final Status:</strong> <span style={{color: req.final_status.includes('Approved') ? '#10b981' : '#ef4444'}}>{req.final_status}</span>
                    </div>
                  )}
                </div>
              ))}
              {requests.length === 0 && <p style={{textAlign: 'center', color: '#94a3b8', marginTop: 40}}>No pending requests.</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
