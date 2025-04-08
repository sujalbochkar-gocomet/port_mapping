import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import PortSearch from "./pages/PortSearch";
import PortMap from "./pages/PortMap";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import IssueReportMain from "./components/IssueReport-Main";
import IssueReportResolveIssue from "./components/IssueReport-ResolveIssue";
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
        <Route path="/port-map" element={<PortMap />} />
        <Route path="/port-search" element={<PortSearch />} />
        <Route path="/admin/issue/dashboard" element={<IssueReportMain />} />
        <Route
          path="/admin/issue/resolve/:id"
          element={<IssueReportResolveIssue />}
        />
        <Route path="*" element={<Navigate to="/port-map" replace />} />
      </Routes>
    </div>
  );
}

export default App;
