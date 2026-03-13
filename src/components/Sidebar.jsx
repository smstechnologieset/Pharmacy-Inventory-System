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
    { name: 'Medicines', icon: <Pill />, path: '/medicine', roles: [roles.ADMIN, roles.PHARMACIST] }, 
    { name: 'Inventory', icon: <Box />, path: '/inventory', roles: [roles.ADMIN, roles.PHARMACIST, roles.MANAGER] }, 
    { name: 'Point of Sale', icon: <FileText />, path: '/sales', roles: [roles.ADMIN, roles.PHARMACIST] },
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
        <span>PharmaCare</span>
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

      {/* User Info Capsule as seen in screenshot */}
      <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
        <div style={{ 
          background: '#F8FAFC', 
          padding: '16px', 
          borderRadius: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: 'var(--primary-light)', 
            color: 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '12px'
          }}>AD</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Admin User</div>
            <div style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '500' }}>Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
