import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, User, Activity, FileText, PieChart as PieChartIcon, BarChart as BarChartIcon, Sun, Moon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTheme } from "../App";
import "./StudentDashboard.css"; 

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [requests, setRequests] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = () => {
    const subRole = user.sub_role || 'counselor'; // Default for demo
    fetch(`https://spms-ie7g.onrender.com/permissions?role=faculty&sub_role=${subRole}`)
      .then(res => res.json())
      .then(data => { if(data.success) setRequests(data.data) })
      .catch(err => console.error(err));
  };

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`https://spms-ie7g.onrender.com/permissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          role: "faculty", 
          sub_role: user.sub_role || 'counselor', 
          action,
          name: user.name
        })
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
  const COLORS = ['#ef4444', '#3b82f6'];

  return (
    <div className="app-container">
      <div className="mobile-wrapper">
        <div className="top-nav">
          <div>
            <h1 className="nav-title">BVRIT SPMS</h1>
            <p className="nav-subtitle" style={{color: '#6366f1'}}>Faculty Portal</p>
          </div>
          <div style={{display: 'flex', gap: 10}}>
            <button className="logout-btn" style={{background: 'var(--bg-input)'}} onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
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
              <h3 className="form-title">Priority Distribution</h3>
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
              <h3 className="form-title">Pending Approvals ({requests.length})</h3>
              {requests.map(req => (
                <div key={req.id} className="request-form-container" style={{marginBottom: 15, borderLeft: req.priority === 'Urgent' ? '5px solid #ef4444' : '5px solid #e2e8f0'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                    <span className="stat-label" style={{color: req.priority === 'Urgent' ? '#ef4444' : '#64748b'}}>{req.priority} PRIORITY</span>
                    {req.suspicious_flag && <span style={{color: '#ef4444', fontSize: '0.75rem', fontWeight: 700}}>⚠️ RISK</span>}
                  </div>
                  
                  <div className="status-stepper" style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20, padding: '10px', background: 'var(--bg-input)', borderRadius: 10}}>
                    {[
                      { label: 'Coun.', status: req.status_counselor, name: req.c_name },
                      { label: 'Tea.', status: req.status_class_teacher, name: req.t_name },
                      { label: 'HOD', status: req.status_hod, name: req.h_name }
                    ].map((step, i) => (
                      <div key={i} style={{textAlign: 'center', flex: 1}}>
                        <div style={{
                          width: 12, height: 12, borderRadius: '50%', margin: '0 auto',
                          background: step.status === 'Approved' ? '#10b981' : step.status === 'Pending' ? '#f59e0b' : '#e2e8f0'
                        }}></div>
                        <div style={{fontSize: '0.6rem', fontWeight: 700, marginTop: 4}}>{step.label}</div>
                        {step.name && <div style={{fontSize: '0.5rem', color: 'var(--text-muted)'}}>{step.name.split(' ')[0]}</div>}
                      </div>
                    ))}
                  </div>

                  <div className="request-detail"><User size={16} /> <strong>Student:</strong> {req.name}</div>
                  <div className="request-detail"><Activity size={16} /> <strong>Attendance:</strong> {req.attendance}%</div>
                  <div className="request-detail"><FileText size={16} /> <strong>Reason:</strong> {req.reason}</div>
                  {req.attachment_url && <a href={`https://spms-ie7g.onrender.com${req.attachment_url}`} target="_blank" rel="noreferrer" style={{fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none'}}>View Document</a>}
                  <div style={{marginTop: 15, display: 'flex', gap: 10}}>
                    <button className="submit-btn" style={{flex: 1, padding: 12, fontSize: '0.85rem'}} onClick={() => handleAction(req.id, "Approved")}>Approve</button>
                    <button className="submit-btn" style={{flex: 1, padding: 12, fontSize: '0.85rem', background: "#ef4444"}} onClick={() => handleAction(req.id, "Rejected")}>Reject</button>
                  </div>
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
