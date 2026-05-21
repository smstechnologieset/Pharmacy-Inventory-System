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
import StaffWaitingMessage from "./components/StaffWaitingMessage";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Basic Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }
  if ( !user ) return <Navigate to="/login" />;
  // elo i added this check to prevent staff from accessing the dashboard, and if you find this implementation unnecessary, you can remove it(just comment it out)  and let staff access the dashboard, but they won't see any data until they are promoted to pharmacist, manager, or admin by the admin.
  if(user.role=== "staff") return <StaffWaitingMessage user={user} />;
  return children;
};

function App () {
//  const { user } = useAuth();
//   console.log( user)
  // const isStaff = user.role === "staff";
  // console.log(isStaff)
  return (
    
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
            <Route index element={ <Dashboard />} />
            <Route path="medicine" element={<Medicine />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="sales" element={<Sales />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="expiration" element={<Expiration />} />
            <Route path="reports" element={<Reports />} />
            <Route path="staff" element={<Staff />} />
            <Route path="settings" element={<Settings />} />
            <Route path="invoices" element={<Navigate to="/sales" />} />
          </Route>
        </Routes>
      </Router>
    
  );
}

export default App;
