import React, { createContext, useContext, useState, useEffect } from 'react';
import { users, roles } from '../data/mockData';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(users[0]); // Default to first user (Admin) for prototype
  const [loading, setLoading] = useState(false);

  // In a real app, this would check localStorage or a session
  const login = (email, password) => {
    setLoading(true);
    // Mock login logic
    const foundUser = users.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
    }
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  const setRole = (role) => {
    const newUser = users.find(u => u.role === role);
    if (newUser) setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Role wrapper component
export const RoleGuard = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }
  
  return children;
};
