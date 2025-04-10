import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import PortMap from "./pages/PortMap";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Shipment from "./pages/PortShipment";
import IssueDashboard from "./pages/Issue-Dashboard";
import IssueResolve from "./pages/Issue-Resolve";
import DataReport from "./pages/Data-Report";
function App() {
  return (
    <div>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{
          fontSize: "15px",
          fontWeight: "500",
          lineHeight: "1.5",
        }}
        toastStyle={{
          background: "rgba(255, 255, 255, 0.98)",
          color: "#1F2937",
          borderRadius: "16px",
          padding: "18px 24px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.08)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          minWidth: "300px",
        }}
      />
      <Routes>
        <Route path="*" element={<Navigate to="/port-map" replace />} />

        <Route path="/port-map" element={<PortMap />} />
        <Route path="/shipment" element={<Shipment />} />
        <Route path="/admin/issue/dashboard" element={<IssueDashboard />} />
        <Route path="/admin/issue/resolve/:id" element={<IssueResolve />} />
        <Route path="/admin/data-report" element={<DataReport />} />
      </Routes>
    </div>
  );
}

export default App;
