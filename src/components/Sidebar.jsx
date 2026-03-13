import React from 'react';
import { NavLink } from 'react-router-dom';
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
  UserCog
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roles } from '../data/mockData';

const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard />, path: '/', roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER] },
    { name: 'Medicine Group', icon: <Pill />, path: '/medicine', roles: [roles.ADMIN, roles.PHARMACIST] }, // Product List
    { name: 'Inventory / Stock', icon: <Box />, path: '/inventory', roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER] }, // Stock/Batches
    { name: 'POS / Sales', icon: <FileText />, path: '/sales', roles: [roles.ADMIN, roles.PHARMACIST] },
    { name: 'Suppliers', icon: <Truck />, path: '/suppliers', roles: [roles.ADMIN, roles.MANAGER] },
    { name: 'Expiration', icon: <ClockAlert />, path: '/expiration', roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER] },
    { name: 'Reports', icon: <BarChart3 />, path: '/reports', roles: [roles.ADMIN, roles.MANAGER] },
    { name: 'Staff Management', icon: <UserCog />, path: '/staff', roles: [roles.ADMIN] },
    { name: 'Settings', icon: <Settings />, path: '/settings', roles: [roles.ADMIN] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <ShieldPlus size={24} />
        </div>
        <span>Pharmacy</span>
      </div>
      
      <nav className="sidebar-nav">
        {filteredNav.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
