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
import { useSettings } from "../context/SettingsContext";
import { roles } from "../constants/roles";

const Sidebar = () => {
  const { user } = useAuth();
  const { t } = useSettings();

  const navItems = [
    {
      name: t("sidebar.dashboard"),
      icon: <LayoutDashboard />,
      path: "/",
      roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER , roles.SUPERADMIN],
    },
    {
      name: t("sidebar.medicines"),
      icon: <Pill />,
      path: "/medicine",
      roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER, roles.SUPERADMIN],
    },
    {
      name: t("sidebar.inventory"),
      icon: <Box />,
      path: "/inventory",
      roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER, roles.SUPERADMIN],
    },
    {
      name: t("sidebar.sales"),
      icon: <FileText />,
      path: "/sales",
      roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER, roles.SUPERADMIN],
    },
    {
      name: t("sidebar.suppliers"),
      icon: <Truck />,
      path: "/suppliers",
      roles: [roles.ADMIN, roles.MANAGER, roles.SUPERADMIN],
    },
    {
      name: t("sidebar.expiration"),
      icon: <ClockAlert />,
      path: "/expiration",
      roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER, roles.SUPERADMIN],
    },
    {
      name: t("sidebar.reports"),
      icon: <BarChart3 />,
      path: "/reports",
      roles: [roles.ADMIN, roles.MANAGER, roles.SUPERADMIN],
    },
    {
      name: t("sidebar.staff"),
      icon: <UserCog />,
      path: "/staff",
      roles: [roles.ADMIN, roles.MANAGER, roles.SUPERADMIN],
    },
    {
      name: t("sidebar.settings"),
      icon: <Settings />,
      path: "/settings",
      roles: [roles.ADMIN, roles.SUPERADMIN],
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
            key={item.path}
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
