import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Register from "./components/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />

        <Route path="/student" element={<h1>Student Dashboard</h1>} />
        <Route path="/faculty" element={<h1>Faculty Dashboard</h1>} />
        <Route path="/warden" element={<h1>Warden Dashboard</h1>} />
        <Route path="/parent" element={<h1>Parent Dashboard</h1>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;