import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Medicine from './pages/Medicine';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Expiration from './pages/Expiration';
import Reports from './pages/Reports';
import Staff from './pages/Staff';
import Suppliers from './pages/Suppliers';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

// Basic Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
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
    </AuthProvider>
  );
}

export default App;
