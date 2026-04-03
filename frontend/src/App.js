import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";  

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* temporary pages */}
        <Route path="/student" element={<h1>Student Page</h1>} />
        <Route path="/warden" element={<h1>Warden Page</h1>} />
        <Route path="/faculty" element={<h1>Faculty Page</h1>} />
        <Route path="/parent" element={<h1>Parent Page</h1>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;c