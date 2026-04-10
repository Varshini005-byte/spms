import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css"; // We reuse the polished Dashboard styles

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
    parent_of_roll_no: ""
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      alert("Passwords do not match ❌");
      return;
    }

    // Basic validation for phone number
    if (form.phone_no && form.phone_no.length < 10) {
      alert("Invalid Phone Number ❌");
      return;
    }

    try {
      const res = await fetch("https://spms-ie7g.onrender.com/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.success) {
        alert("Registered successfully ✅");
        navigate("/");
      } else {
        alert(data.message || "Registration failed ❌");
      }
    } catch {
      alert("Server error ⚠️");
    }
  };

  return (
    <div className="app-container">
      <div className="mobile-wrapper" style={{justifyContent: 'center', height: '100vh'}}>
        <div className="scroll-content">
          <div className="request-form-container" style={{maxWidth: '400px', margin: '20px auto'}}>
            <h3 className="form-title" style={{color: '#1976d2', textAlign: 'center'}}>Create an Account</h3>
            
            <form onSubmit={handleRegister} className="custom-form">
              <label>Full Name</label>
              <input required placeholder="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              
              <label>Role</label>
              <select 
                style={{padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', outline: 'none', marginBottom: '15px'}} 
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="warden">Warden</option>
                <option value="parent">Parent</option>
              </select>

              {form.role === 'student' && (
                <>
                  <label>Roll Number</label>
                  <input required placeholder="e.g. 21B01A0501" value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value })} />
                  <label>College Email</label>
                  <input required type="email" placeholder="student@bvrit.ac.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <label>Phone Number</label>
                  <input required type="tel" placeholder="Your Phone No" value={form.phone_no} onChange={(e) => setForm({ ...form, phone_no: e.target.value })} />
                  <label>Residence</label>
                  <select style={{padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', outline: 'none', marginBottom: '15px'}} value={form.residence_type} onChange={(e) => setForm({ ...form, residence_type: e.target.value })}>
                    <option value="day_scholar">Day Scholar</option>
                    <option value="hosteler">Hosteler</option>
                  </select>
                </>
              )}

              {form.role === 'faculty' && (
                <>
                  <label>Faculty ID</label>
                  <input required placeholder="e.g. FID123" value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value })} />
                  <label>Phone Number</label>
                  <input required type="tel" placeholder="Your Phone No" value={form.phone_no} onChange={(e) => setForm({ ...form, phone_no: e.target.value })} />
                  <label>Official Email</label>
                  <input required type="email" placeholder="faculty@bvrit.ac.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </>
              )}

              {form.role === 'warden' && (
                <>
                  <label>Phone Number (Login ID)</label>
                  <input required type="tel" placeholder="Your Phone No" value={form.phone_no} onChange={(e) => setForm({ ...form, phone_no: e.target.value })} />
                  <label>Email</label>
                  <input required type="email" placeholder="warden@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </>
              )}

              {form.role === 'parent' && (
                <>
                  <label>Parent Phone No (Login ID)</label>
                  <input required type="tel" placeholder="Your Phone No" value={form.phone_no} onChange={(e) => setForm({ ...form, phone_no: e.target.value })} />
                  <label>Student Roll No (To Link)</label>
                  <input required placeholder="e.g. 21B01A0501" value={form.parent_of_roll_no} onChange={(e) => setForm({ ...form, parent_of_roll_no: e.target.value })} />
                  <label>Email</label>
                  <input required type="email" placeholder="parent@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </>
              )}
              
              <label>Password</label>
              <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              
              <label>Confirm Password</label>
              <input required type="password" placeholder="Re-enter Password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />

              <button type="submit" className="submit-btn" style={{marginTop: '25px'}}>Register Securely</button>
              <button type="button" className="back-btn" style={{marginTop: '20px', display: 'block', width: '100%'}} onClick={() => navigate("/")}>← Back to Login</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}