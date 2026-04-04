import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Register from "./components/Register";
import StudentDashboard from "./components/StudentDashboard";
import FacultyDashboard from "./components/FacultyDashboard";
import WardenDashboard from "./components/WardenDashboard";
import ParentDashboard from "./components/ParentDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />

        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/warden" element={<WardenDashboard />} />
        <Route path="/parent" element={<ParentDashboard />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;