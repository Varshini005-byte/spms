import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

import { API_BASE } from "../apiConfig";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "student",
    residence_type: "day_scholar",
    roll_no: "",
    faculty_id: "",
    phone_no: "",
    parent_of_roll_no: "",
    parent_email: "",
    counselor_id: "",
    class_teacher_id: "",
    hod_id: "",
    otp: ""
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/faculty-list`)
      .then(res => res.json())
      .then(data => { if (data.success) setFacultyList(data.data); })
      .catch(console.error);
  }, []);

  const handleSendOtp = async () => {
    if (!form.email) return setError("Please enter your email first 📧");
    setOtpLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/register/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email })
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        alert(data.message);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Failed to send OTP. Check your connection.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (form.password !== form.confirm) {
      setError("Passwords do not match ❌");
      setLoading(false);
      return;
    }

    if (form.phone_no && form.phone_no.length < 10) {
      setError("Phone number must be at least 10 digits ❌");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.success) {
        alert("Account created successfully! ✅");
        navigate("/");
      } else {
        setError(data.message || "Registration failed ❌");
      }
    } catch {
      setError("Network error. Please try again later. ⚠️");
    } finally {
      setLoading(false);
    }
  };

  const RequiredStar = () => <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>;

  return (
    <div className="app-container">
      <div className="mobile-wrapper" style={{ justifyContent: "center", height: "100vh" }}>
        <div className="scroll-content">
          <div className="request-form-container" style={{ maxWidth: "400px", margin: "20px auto" }}>
            <h1 className="form-title" style={{ color: "#1976d2", textAlign: "center", marginBottom: "5px" }}>Register</h1>
            <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>Join the Smart Permission System</p>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", color: "#b91c1c", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.85rem", textAlign: "center", fontWeight: "600" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="custom-form">
              <label>Full Name<RequiredStar /></label>
              <input required placeholder="Enter your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

              <label>Account Role<RequiredStar /></label>
              <select
                style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", backgroundColor: "var(--bg-input)", color: "var(--text-main)", marginBottom: "15px", width: "100%" }}
                value={form.role}
                onChange={(e) => {
                    const newRole = e.target.value;
                    setForm({ 
                        ...form, 
                        role: newRole,
                        roll_no: "",
                        faculty_id: "",
                        parent_of_roll_no: "",
                        residence_type: newRole === 'student' ? 'day_scholar' : form.residence_type
                    });
                }}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="warden">Warden</option>
                <option value="parent">Parent</option>
              </select>

              {form.role === "student" && (
                <>
                  <label>Roll Number<RequiredStar /></label>
                  <input required placeholder="e.g. 21B01A0501" value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value.toUpperCase() })} />
                  <label>College Email<RequiredStar /></label>
                  <input required type="email" placeholder="student@bvrit.ac.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <label>Personal Phone No<RequiredStar /></label>
                  <input required type="tel" placeholder="10-digit mobile number" value={form.phone_no} onChange={(e) => setForm({ ...form, phone_no: e.target.value })} />
                  <label>Parent Email Address<RequiredStar /></label>
                  <input required type="email" placeholder="parent@example.com" value={form.parent_email} onChange={(e) => setForm({ ...form, parent_email: e.target.value })} />
                  <label>Residence Type<RequiredStar /></label>
                  <select style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", backgroundColor: "var(--bg-input)", color: "var(--text-main)", marginBottom: "15px", width: "100%" }} value={form.residence_type} onChange={(e) => setForm({ ...form, residence_type: e.target.value })}>
                    <option value="day_scholar">Day Scholar</option>
                    <option value="hosteler">Hosteler</option>
                  </select>

                  <label>Select Counselor<RequiredStar /></label>
                  <select required style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", backgroundColor: "var(--bg-input)", color: "var(--text-main)", marginBottom: "15px", width: "100%" }} value={form.counselor_id} onChange={(e) => setForm({ ...form, counselor_id: e.target.value })}>
                    <option value="">-- Choose Counselor --</option>
                    {facultyList.filter(f => f.sub_role === 'counselor').map(f => (
                       <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>

                  <label>Select Class Teacher<RequiredStar /></label>
                  <select required style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", backgroundColor: "var(--bg-input)", color: "var(--text-main)", marginBottom: "15px", width: "100%" }} value={form.class_teacher_id} onChange={(e) => setForm({ ...form, class_teacher_id: e.target.value })}>
                    <option value="">-- Choose Class Teacher --</option>
                    {facultyList.filter(f => f.sub_role === 'class_teacher').map(f => (
                       <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>

                  <label>Select HOD<RequiredStar /></label>
                  <select required style={{ padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", outline: "none", backgroundColor: "var(--bg-input)", color: "var(--text-main)", marginBottom: "15px", width: "100%" }} value={form.hod_id} onChange={(e) => setForm({ ...form, hod_id: e.target.value })}>
                    <option value="">-- Choose HOD --</option>
                    {facultyList.filter(f => f.sub_role === 'hod').map(f => (
                       <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </>
              )}

              {form.role === "faculty" && (
                <>
                  <label>Faculty ID<RequiredStar /></label>
                  <input required placeholder="e.g. FAC501" value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value.toUpperCase() })} />
                  <label>Official Email<RequiredStar /></label>
                  <input required type="email" placeholder="faculty@bvrit.ac.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <label>Phone Number<RequiredStar /></label>
                  <input required type="tel" placeholder="Active mobile number" value={form.phone_no} onChange={(e) => setForm({ ...form, phone_no: e.target.value })} />
                </>
              )}

              {form.role === "warden" && (
                <>
                  <label>Phone Number (Your Login ID)<RequiredStar /></label>
                  <input required type="tel" placeholder="Warden Mobile Number" value={form.phone_no} onChange={(e) => setForm({ ...form, phone_no: e.target.value })} />
                  <label>Official Email<RequiredStar /></label>
                  <input required type="email" placeholder="warden@bvrit.ac.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </>
              )}

              {form.role === "parent" && (
                <>
                  <label>Parent Mobile No (Your Login ID)<RequiredStar /></label>
                  <input required type="tel" placeholder="Mobile Number" value={form.phone_no} onChange={(e) => setForm({ ...form, phone_no: e.target.value })} />
                  <label>Student's Roll No (To Link)<RequiredStar /></label>
                  <input required placeholder="e.g. 21B01A0501" value={form.parent_of_roll_no} onChange={(e) => setForm({ ...form, parent_of_roll_no: e.target.value.toUpperCase() })} />
                  <label>Email Address<RequiredStar /></label>
                  <input required type="email" placeholder="yourname@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </>
              )}

              <label>Create Password<RequiredStar /></label>
              <input required type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

              <label>Confirm Password<RequiredStar /></label>
              <input required type="password" placeholder="Re-type Password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />

              <div style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "12px", border: "1px solid var(--border)", marginTop: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Email Verification<RequiredStar /></label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input 
                    placeholder="Enter 6-digit code" 
                    value={form.otp} 
                    onChange={(e) => setForm({ ...form, otp: e.target.value })} 
                    style={{ flex: 1, marginBottom: 0 }}
                  />
                  <button 
                    type="button" 
                    onClick={handleSendOtp} 
                    disabled={otpLoading}
                    style={{ padding: "0 15px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", fontSize: "0.75rem", cursor: "pointer", opacity: otpLoading ? 0.7 : 1 }}
                  >
                    {otpSent ? "Resend" : "Send Code"}
                  </button>
                </div>
                {otpSent && <p style={{ fontSize: "0.7rem", color: "#10b981", marginTop: "5px", margin: 0 }}>Code sent to {form.email}!</p>}
              </div>

              <button type="submit" className="submit-btn" style={{ marginTop: "25px", opacity: loading ? 0.7 : 1, pointerEvents: loading ? "none" : "auto" }}>
                {loading ? "Creating Account..." : "Register Securely"}
              </button>

              <button type="button" className="back-btn" style={{ marginTop: "15px", display: "block", width: "100%", border: "1px solid #e2e8f0", background: "transparent", color: "#64748b" }} onClick={() => navigate("/")}>
                Already have an account? Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}