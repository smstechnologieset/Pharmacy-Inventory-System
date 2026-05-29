import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Medicine from "./pages/Medicine";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Expiration from "./pages/Expiration";
import Reports from "./pages/Reports";
import Staff from "./pages/Staff";
import Suppliers from "./pages/Suppliers";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import SuperAdmin from "./pages/SuperAdmin";
import StaffWaitingMessage from "./components/StaffWaitingMessage";
import PharmacySuspendedMessage from "./components/PharmacySuspendedMessage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoadingScreen from "./components/LoadingScreen.jsx";

// Basic Protected Route Component (Checks if logged in & handles special states)
const ProtectedRoute = ({ children }) => {
  const { user, loading, pharmacyStatus } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }
  if (!user) return <Navigate to="/login" />;

  // Super admin gets redirected to the super admin dashboard
  if (user.role === "superadmin") return <Navigate to="/super-admin" />;

  // Pharmacy suspended
  if (pharmacyStatus === "suspended") return <PharmacySuspendedMessage />;

  if (user.role === "staff") return <StaffWaitingMessage user={user} />;
  return children;
};

// Super Admin Route Guard
const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "superadmin") return <Navigate to="/" />;
  return children;
};

// Role Guard Component (Restricts access based on specific user roles)
const RoleGuard = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  // If allowedRoles is provided, and the user's role is NOT in the list, redirect to dashboard
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Super Admin Dashboard — completely separate layout */}
        <Route
          path="/super-admin"
          element={
            <SuperAdminRoute>
              <SuperAdmin />
            </SuperAdminRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
          {/* Dashboard is accessible to all authenticated, non-staff roles */}
          <Route index element={<Dashboard />} />

          {/* Core Operations - Accessible by Admin, Manager, Pharmacist */}
          <Route
            path="medicine"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "pharmacist"]}>
                <Medicine />
              </RoleGuard>
            }
          />
          <Route
            path="inventory"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "pharmacist"]}>
                <Inventory />
              </RoleGuard>
            }
          />
          <Route
            path="sales"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "pharmacist"]}>
                <Sales />
              </RoleGuard>
            }
          />
          <Route
            path="expiration"
            element={
              <RoleGuard allowedRoles={["admin", "manager", "pharmacist"]}>
                <Expiration />
              </RoleGuard>
            }
          />

          {/* Management & Reports - Accessible by Admin, Manager */}
          <Route
            path="suppliers"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <Suppliers />
              </RoleGuard>
            }
          />
          <Route
            path="reports"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <Reports />
              </RoleGuard>
            }
          />
          <Route
            path="staff"
            element={
              <RoleGuard allowedRoles={["admin", "manager"]}>
                <Staff />
              </RoleGuard>
            }
          />

          {/* System Settings - Admin Only */}
          <Route
            path="settings"
            element={
              <RoleGuard allowedRoles={["admin"]}>
                <Settings />
              </RoleGuard>
            }
          />

          <Route path="invoices" element={<Navigate to="/sales" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
