import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import PortSearch from "./pages/PortSearch";
import PortMap from "./pages/PortMap";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/port-map" element={<PortMap />} />
        <Route path="/port-search" element={<PortSearch />} />
        <Route path="*" element={<Navigate to="/port-search" replace />} />
      </Routes>
    </div>
  );
}

export default App;
