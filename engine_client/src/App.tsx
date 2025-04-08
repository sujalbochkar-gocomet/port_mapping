import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import PortSearch from "./pages/PortSearch";
import PortMap from "./pages/PortMap";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/port-map" element={<PortMap />} />
        <Route path="/port-search" element={<PortSearch />} />
        <Route path="*" element={<Navigate to="/port-map" replace />} />
      </Routes>
    </div>
  );
}

export default App;
