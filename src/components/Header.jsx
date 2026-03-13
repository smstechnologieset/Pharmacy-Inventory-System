import React, { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roles, notifications } from '../data/mockData';

const Header = () => {
  const { user, setRole } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="header">
      <div className="search-bar">
        <Search size={18} className="text-muted" />
        <input type="text" placeholder="Search products..." />
      </div>
      
      <div className="header-right">
        {/* Role Switcher for Demo Purposes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>ROLE:</span>
          <select 
            onChange={(e) => setRole(e.target.value)} 
            value={user?.role}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '13px', background: 'white' }}
          >
            <option value={roles.ADMIN}>Admin</option>
            <option value={roles.PHARMACIST}>Pharmacist</option>
            <option value={roles.MANAGER}>Manager</option>
          </select>
        </div>

        <div className="icon-button" onClick={() => setShowNotifs(!showNotifs)}>
          <Bell size={20} />
          <div className="badge"></div>
          
          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifications</span>
                <span style={{ color: '#4A6CF7', fontSize: '0.75rem', cursor: 'pointer' }}>Mark all read</span>
              </div>
              {notifications.map(n => (
                <div key={n.id} className="notif-item">
                  <div className="notif-title" style={{ color: n.type === 'error' ? '#EF4444' : n.type === 'warning' ? '#F59E0B' : '#10B981' }}>
                    {n.title}
                  </div>
                  <div className="notif-msg">{n.message}</div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '4px' }}>{n.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="user-profile">
          <img src={user?.avatar} alt={user?.name} />
          <div className="info">
            <span className="name">{user?.name}</span>
          </div>
          <ChevronDown size={14} className="text-muted" />
        </div>
      </div>
    </header>
  );
};

export default Header;
