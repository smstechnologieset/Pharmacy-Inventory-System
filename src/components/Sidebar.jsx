import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Pill,
  FileText,
  Truck,
  Box,
  BarChart3,
  Settings,
  ShieldPlus,
  ClockAlert,
  UserCog,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { roles } from "../constants/roles"; // ← CHANGED IMPORT

const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard />,
      path: "/",
      roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER],
    },
    {
      name: "Medicines",
      icon: <Pill />,
      path: "/medicine",
      roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER],
    },
    {
      name: "Inventory",
      icon: <Box />,
      path: "/inventory",
      roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER],
    },
    {
      name: "Point of Sale",
      icon: <FileText />,
      path: "/sales",
      roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER],
    },
    {
      name: "Suppliers",
      icon: <Truck />,
      path: "/suppliers",
      roles: [roles.ADMIN, roles.MANAGER],
    },
    {
      name: "Expiration",
      icon: <ClockAlert />,
      path: "/expiration",
      roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER],
    },
    {
      name: "Reports",
      icon: <BarChart3 />,
      path: "/reports",
      roles: [roles.ADMIN, roles.MANAGER],
    },
    {
      name: "Staff Management",
      icon: <UserCog />,
      path: "/staff",
      roles: [roles.ADMIN, roles.MANAGER],
    },
    {
      name: "Settings",
      icon: <Settings />,
      path: "/settings",
      roles: [roles.ADMIN],
    },
  ];

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user?.role),
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <ShieldPlus size={24} />
        </div>
        <span>PharmaCare</span>
      </div>
      <nav className="sidebar-nav">
        {filteredNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }>
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
