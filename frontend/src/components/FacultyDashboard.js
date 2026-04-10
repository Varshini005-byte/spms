import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, User, Activity, FileText,
  PieChart as PieChartIcon, BarChart as BarChartIcon,
  Sun, Moon, Bell, Search, X, ShieldAlert, CheckCircle2
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTheme } from "../App";
import "./StudentDashboard.css";
import { API_BASE } from "../apiConfig";

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const subRole = user.sub_role || "counselor";

  const [requests, setRequests] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [viewMode, setViewMode] = useState("pending"); // "pending" | "history"

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Student lookup (counselor / class_teacher only)
  const [showLookup, setShowLookup] = useState(false);
  const [lookupRollNo, setLookupRollNo] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  // ---------- data fetch ----------
  const fetchRequests = useCallback(() => {
    const url =
      viewMode === "history"
        ? `${API_BASE}/permissions?role=faculty&view=history&id=${user.id}`
        : `${API_BASE}/permissions?role=faculty&sub_role=${subRole}&id=${user.id}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { if (d.success) setRequests(d.data); })
      .catch(console.error);
  }, [viewMode, subRole]);

  const fetchNotifications = useCallback(() => {
    if (!user.id) return;
    fetch(`${API_BASE}/notifications?faculty_id=${user.id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setNotifications(d.data); })
      .catch(console.error);
  }, [user.id]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Poll notifications every 30 s
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ---------- actions ----------
  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE}/permissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "faculty",
          sub_role: subRole,
          action,
          name: user.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.bypassed) {
          alert("✅ Emergency leave approved directly by HOD. Counselor & Class Teacher have been notified.");
        }
        setRequests(prev => prev.filter(r => r.id !== id));
      } else {
        alert(data.message || "Action failed");
      }
    } catch {
      alert("Server error ⚠️");
    }
  };

  const markNotificationsRead = async () => {
    if (!user.id) return;
    await fetch(`${API_BASE}/notifications/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ faculty_id: user.id }),
    }).catch(console.error);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleShowNotifPanel = () => {
    setShowNotifPanel(v => !v);
    if (!showNotifPanel && unreadCount > 0) markNotificationsRead();
  };

  // ---------- student lookup ----------
  const handleLookup = async () => {
    if (!lookupRollNo.trim()) return;
    setLookupLoading(true);
    setLookupError("");
    setLookupResult(null);
    try {
      const res = await fetch(
        `${API_BASE}/permissions/student-lookup?roll_no=${lookupRollNo.trim().toUpperCase()}`
      );
      const data = await res.json();
      if (data.success) {
        setLookupResult(data);
      } else {
        setLookupError(data.message || "Student not found");
      }
    } catch {
      setLookupError("Network error. Try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  // ---------- analytics ----------
  const analyticsData = [
    { name: "Urgent", value: requests.filter(r => r.priority === "Urgent").length },
    { name: "Normal", value: requests.filter(r => r.priority === "Normal").length },
  ];
  const COLORS = ["#ef4444", "#3b82f6"];

  // ---------- helpers ----------
  const StepDot = ({ step, req }) => {
    const isBypassed = step.status === "Bypassed";
    const dotColor =
      step.status === "Approved"
        ? "#10b981"
        : step.status === "Pending"
        ? "#f59e0b"
        : step.status === "Rejected"
        ? "#ef4444"
        : isBypassed
        ? "#8b5cf6"
        : "#e2e8f0";
    return (
      <div style={{ textAlign: "center", flex: 1 }}>
        <div
          style={{
            width: 14, height: 14, borderRadius: "50%", margin: "0 auto",
            background: dotColor, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {step.status === "Approved" && (
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />
          )}
        </div>
        <div style={{ fontSize: "0.6rem", fontWeight: 700, marginTop: 4, color: "var(--text-main)" }}>
          {step.label}
        </div>
        {step.status === "Approved" && step.name && (
          <div style={{ fontSize: "0.5rem", color: "#10b981", fontWeight: 500 }}>
            {step.name.split(" ")[0]}
          </div>
        )}
        {step.status === "Rejected" && (
          <div style={{ fontSize: "0.5rem", color: "#ef4444" }}>
            Rejected {req.rejected_by ? `by ${req.rejected_by.split(" ")[0]}` : ""}
          </div>
        )}
        {isBypassed && (
          <div style={{ fontSize: "0.5rem", color: "#8b5cf6", fontWeight: 700 }}>
            ⚡ Bypassed
          </div>
        )}
        {step.status === "Pending" && (
          <div style={{ fontSize: "0.5rem", color: "#f59e0b" }}>Pending</div>
        )}
      </div>
    );
  };

  const RequestCard = ({ req, showActions = true }) => (
    <div
      key={req.id}
      className="request-form-container"
      style={{
        marginBottom: 15,
        borderLeft: req.priority === "Urgent" ? "5px solid #ef4444" : "5px solid #e2e8f0",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span className="stat-label" style={{ color: req.priority === "Urgent" ? "#ef4444" : "#64748b" }}>
          {req.priority} PRIORITY
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {req.hod_bypass && (
            <span style={{
              background: "#8b5cf6", color: "white", fontSize: "0.65rem",
              fontWeight: 700, padding: "2px 7px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3
            }}>
              <ShieldAlert size={10} /> HOD Emergency
            </span>
          )}
          {req.suspicious_flag && (
            <span style={{ color: "#ef4444", fontSize: "0.75rem", fontWeight: 700 }}>⚠️ RISK</span>
          )}
        </div>
      </div>

      {/* Status stepper */}
      <div className="status-stepper" style={{
        display: "flex", justifyContent: "space-between", marginBottom: 14,
        padding: "10px", background: "var(--bg-input)", borderRadius: 10
      }}>
        {[
          { label: "Coun.", status: req.status_counselor, name: req.c_name },
          { label: "Tea.", status: req.status_class_teacher, name: req.t_name },
          { label: "HOD", status: req.status_hod, name: req.h_name },
          { label: "War.", status: req.status_warden, name: req.w_name },
          { label: "Par.", status: req.status_parent, name: req.parent_name },
        ].map((step, i) => (
          <StepDot key={i} step={step} req={req} />
        ))}
      </div>

      <div className="request-detail"><User size={16} /> <strong>Student:</strong> {req.name}</div>
      {req.roll_no && <div className="request-detail"><FileText size={16} /> <strong>Roll No:</strong> {req.roll_no}</div>}
      <div className="request-detail"><Activity size={16} /> <strong>Attendance:</strong> {req.attendance}%</div>
      <div className="request-detail"><FileText size={16} /> <strong>Reason:</strong> {req.reason}</div>
      {req.attachment_url && (
        <a
          href={req.attachment_url.startsWith("http") ? req.attachment_url : `${API_BASE}${req.attachment_url}`}
          target="_blank" rel="noreferrer"
          style={{ fontSize: "0.85rem", color: "#2563eb", textDecoration: "none" }}
        >
          View Document
        </a>
      )}

      {showActions && viewMode === "pending" ? (
        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          {/* HOD sees emergency bypass button for urgent leaves not yet through normal queue */}
          {subRole === "hod" && req.priority === "Urgent" && req.status_class_teacher !== "Approved" && (
            <button
              className="submit-btn"
              style={{ flex: 1, padding: 11, fontSize: "0.8rem", background: "#8b5cf6" }}
              onClick={() => {
                if (window.confirm("⚡ Directly approve this EMERGENCY leave, bypassing counselor & class teacher? They will be notified.")) {
                  handleAction(req.id, "Approved");
                }
              }}
            >
              ⚡ Emergency Approve
            </button>
          )}
          {/* Normal approve/reject (for non-emergency or when queue is ready) */}
          {!(subRole === "hod" && req.priority === "Urgent" && req.status_class_teacher !== "Approved") && (
            <>
              <button
                className="submit-btn"
                style={{ flex: 1, padding: 11, fontSize: "0.85rem" }}
                onClick={() => handleAction(req.id, "Approved")}
              >
                Approve
              </button>
              <button
                className="submit-btn"
                style={{ flex: 1, padding: 11, fontSize: "0.85rem", background: "#ef4444" }}
                onClick={() => handleAction(req.id, "Rejected")}
              >
                Reject
              </button>
            </>
          )}
        </div>
      ) : showActions ? (
        <div style={{
          marginTop: 12, padding: "8px 10px", background: "var(--bg-input)",
          borderRadius: 8, fontSize: "0.85rem", textAlign: "center"
        }}>
          <strong>Final Status:</strong>{" "}
          <span style={{ color: req.final_status?.toLowerCase().includes("approved") ? "#10b981" : "#ef4444" }}>
            {req.final_status}
          </span>
        </div>
      ) : null}
    </div>
  );

  const isLookupRole = subRole === "counselor" || subRole === "class_teacher";

  return (
    <div className="app-container">
      <div className="mobile-wrapper">
        {/* TOP NAV */}
        <div className="top-nav">
          <div>
            <h1 className="nav-title">Faculty Portal</h1>
            <p className="nav-subtitle">
              {user.name} &nbsp;·&nbsp;
              <span style={{
                textTransform: "capitalize",
                background: subRole === "hod" ? "#ef4444" : subRole === "counselor" ? "#3b82f6" : "#10b981",
                color: "white", fontSize: "0.65rem", fontWeight: 700,
                padding: "2px 8px", borderRadius: 20
              }}>
                {subRole === "class_teacher" ? "Class Teacher" : subRole === "hod" ? "HOD" : "Counselor"}
              </span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Notification Bell (counselor & class_teacher) */}
            {isLookupRole && (
              <button
                id="notif-bell-btn"
                className="logout-btn"
                style={{ position: "relative", background: showNotifPanel ? "#f59e0b" : "var(--bg-input)", color: showNotifPanel ? "white" : "var(--text-main)" }}
                onClick={handleShowNotifPanel}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: -4, right: -4,
                    background: "#ef4444", color: "white",
                    fontSize: "0.6rem", fontWeight: 800,
                    width: 16, height: 16, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}
            {/* Student Lookup (counselor & class_teacher) */}
            {isLookupRole && (
              <button
                id="student-lookup-btn"
                className="logout-btn"
                style={{ background: showLookup ? "#6366f1" : "var(--bg-input)", color: showLookup ? "white" : "var(--text-main)" }}
                onClick={() => { setShowLookup(v => !v); setLookupResult(null); setLookupError(""); }}
              >
                <Search size={18} />
              </button>
            )}
            <button
              className="logout-btn"
              style={{ background: "var(--bg-input)" }}
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              className="logout-btn"
              style={{
                background: viewMode === "history" ? "#6366f1" : "var(--bg-input)",
                color: viewMode === "history" ? "white" : "var(--text-main)"
              }}
              onClick={() => setViewMode(viewMode === "pending" ? "history" : "pending")}
            >
              <FileText size={18} />
            </button>
            <button
              className="logout-btn"
              style={{ background: "#f1f5f9", color: "#1e293b" }}
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              {showAnalytics ? <BarChartIcon size={18} /> : <PieChartIcon size={18} />}
            </button>
            <button className="logout-btn" onClick={() => navigate("/")}>Logout</button>
          </div>
        </div>

        {/* ======= NOTIFICATION PANEL ======= */}
        {showNotifPanel && isLookupRole && (
          <div style={{
            margin: "0 16px 16px 16px", borderRadius: 14,
            background: "var(--bg-card, var(--bg-input))",
            border: "1px solid var(--border, #e2e8f0)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            overflow: "hidden"
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", borderBottom: "1px solid var(--border, #e2e8f0)",
              background: "#f59e0b", color: "white"
            }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
                <Bell size={16} /> Emergency Notifications
              </span>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", color: "white" }}
                onClick={() => setShowNotifPanel(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto", padding: "12px 16px" }}>
              {notifications.length === 0 ? (
                <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.85rem", marginTop: 20 }}>
                  No notifications yet.
                </p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} style={{
                    padding: "10px 12px", marginBottom: 10, borderRadius: 10,
                    background: n.is_read ? "var(--bg-input)" : "rgba(245,158,11,0.08)",
                    border: n.is_read ? "1px solid var(--border, #e2e8f0)" : "1px solid #f59e0b",
                    display: "flex", gap: 10, alignItems: "flex-start"
                  }}>
                    <ShieldAlert size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-main)", lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    {!n.is_read && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", flexShrink: 0, marginTop: 6 }} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======= STUDENT LOOKUP PANEL ======= */}
        {showLookup && isLookupRole && (
          <div style={{
            margin: "0 16px 16px 16px", borderRadius: 14,
            background: "var(--bg-card, var(--bg-input))",
            border: "1px solid var(--border, #e2e8f0)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            padding: "16px"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", color: "#6366f1", display: "flex", alignItems: "center", gap: 6 }}>
                <Search size={16} /> Student Lookup
              </h3>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }} onClick={() => { setShowLookup(false); setLookupResult(null); }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="lookup-roll-input"
                type="text"
                placeholder="Enter Student Roll No (e.g. 24211A0551)"
                value={lookupRollNo}
                onChange={e => setLookupRollNo(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleLookup()}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 8,
                  border: "1px solid var(--border, #e2e8f0)",
                  background: "var(--bg-input)", color: "var(--text-main)", fontSize: "0.85rem"
                }}
              />
              <button
                id="lookup-submit-btn"
                className="submit-btn"
                style={{ padding: "10px 16px", fontSize: "0.85rem" }}
                onClick={handleLookup}
                disabled={lookupLoading}
              >
                {lookupLoading ? "..." : "Search"}
              </button>
            </div>
            {lookupError && (
              <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: 8 }}>{lookupError}</p>
            )}
            {lookupResult && (
              <div style={{ marginTop: 14 }}>
                <div style={{
                  padding: "10px 12px", borderRadius: 10,
                  background: "var(--bg-input)", marginBottom: 10,
                  display: "flex", gap: 12, alignItems: "center"
                }}>
                  <User size={28} style={{ color: "#6366f1" }} />
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{lookupResult.student.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {lookupResult.student.roll_no} &nbsp;·&nbsp; Attendance: {lookupResult.student.attendance}%
                      &nbsp;·&nbsp; {lookupResult.student.residence_type === "hosteler" ? "🏠 Hosteler" : "🚗 Day Scholar"}
                    </div>
                  </div>
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {lookupResult.data.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>No leave requests found.</p>
                  ) : (
                    lookupResult.data.map(req => (
                      <RequestCard key={req.id} req={req} showActions={false} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======= MAIN CONTENT ======= */}
        <div className="scroll-content">
          {showAnalytics ? (
            <div className="request-form-container" style={{ height: 300, textAlign: "center" }}>
              <h3 className="form-title">Priority Distribution</h3>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie data={analyticsData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {analyticsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <>
              <h3 className="form-title">
                {viewMode === "pending" ? "Pending Approvals" : "Approval History"} ({requests.length})
                {subRole === "hod" && viewMode === "pending" && (
                  <span style={{
                    marginLeft: 10, fontSize: "0.7rem", background: "#8b5cf6",
                    color: "white", padding: "2px 8px", borderRadius: 20, fontWeight: 600
                  }}>
                    {requests.filter(r => r.priority === "Urgent" && r.status_class_teacher !== "Approved").length} Emergency
                  </span>
                )}
              </h3>
              {requests.map(req => (
                <RequestCard key={req.id} req={req} showActions={true} />
              ))}
              {requests.length === 0 && (
                <div style={{ textAlign: "center", marginTop: 50 }}>
                  <CheckCircle2 size={40} style={{ color: "#10b981", margin: "0 auto" }} />
                  <p style={{ color: "#94a3b8", marginTop: 10 }}>
                    No {viewMode} requests found.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
