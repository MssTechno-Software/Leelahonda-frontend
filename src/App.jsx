import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import LeelamayiLoader from "./components/LeelamayiLoader";
import SessionExpiredModal from "./components/SessionExpiredModal";
import { setSessionExpiredHandler } from "./api/api";


import Login from "./pages/Login";
import Inventory from "./pages/Inventory";
import AuditManagement from "./pages/AuditManagement";
import DeliveredStock from "./pages/DeliveredStock";
import DeliveryTracking from "./pages/DeliveryTracking";
import UserManagement from "./pages/UserManagement";
import AddUser from "./pages/AddUser";
import ProtectedRoute from "./routes/ProtectedRoute";
import MainLayout from "./pages/MainLayout";


function App() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
//session expries
  useEffect(() => {
  setSessionExpiredHandler(() => {
    setSessionExpired(true);
  });
}, []);
const handleLoginAgain = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");

  setSessionExpired(false);

  navigate("/", {
    replace: true,
  });
};

  if (loading) {
    return <LeelamayiLoader loading={loading} />;
  }

 return (
  <>
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<Login />} />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/audit-management" element={<AuditManagement />} />
        <Route path="/delivered" element={<DeliveredStock />} />
        <Route path="/track" element={<DeliveryTracking />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/users/add" element={<AddUser />} />
      </Route>
    </Routes>

    <SessionExpiredModal
      isOpen={sessionExpired}
      onLogin={handleLoginAgain}
    />
    
  </>
);
}

export default App;