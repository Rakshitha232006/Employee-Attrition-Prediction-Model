import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Predict from "./pages/Predict.jsx";
import Employees from "./pages/Employees.jsx";
import Chat from "./pages/Chat.jsx";
import Analytics from "./pages/Analytics.jsx";
import UploadAnalyze from "./pages/UploadAnalyze.jsx";
import History from "./pages/History.jsx";
import FeatureImportance from "./pages/FeatureImportance.jsx";
import Login from "./pages/Login.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<UploadAnalyze />} />
        <Route path="predict" element={<Predict />} />
        <Route path="employees" element={<Employees />} />
        <Route path="chat" element={<Chat />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="history" element={<History />} />
        <Route path="features" element={<FeatureImportance />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
