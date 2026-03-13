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
        <Search size={20} style={{ color: '#94A3B8' }} />
        <input type="text" placeholder="Search medicines by name or batch..." />
      </div>
      
      <div className="header-right">
        {/* Role Switcher for Demo Purposes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '400', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mode:</span>
          <select 
            onChange={(e) => setRole(e.target.value)} 
            value={user?.role}
            style={{ 
              padding: '8px 14px', 
              borderRadius: '12px', 
              border: '1px solid #F1F5F9', 
              outline: 'none', 
              fontSize: '13px', 
              background: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <option value={roles.ADMIN}>Administrator</option>
            <option value={roles.PHARMACIST}>Pharmacist</option>
            <option value={roles.MANAGER}>Manager</option>
          </select>
        </div>

        <div className="icon-button" onClick={() => setShowNotifs(!showNotifs)}>
          <Bell size={22} />
          <div className="badge"></div>
          
          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifications</span>
                <span style={{ color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer' }}>Mark all read</span>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} className="notif-item">
                    <div className="notif-title" style={{ 
                      color: n.type === 'error' ? '#EF4444' : n.type === 'warning' ? '#F59E0B' : '#10B981',
                      fontSize: '0.85rem'
                    }}>
                      {n.title}
                    </div>
                    <div className="notif-msg">{n.message}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px' }}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="user-profile">
          <img src={user?.avatar} alt={user?.name} />
          <div className="info">
            <span className="name" style={{ color: '#0F172A' }}>{user?.name}</span>
          </div>
          <ChevronDown size={14} style={{ color: '#94A3B8' }} />
        </div>
      </div>
    </header>
  );
};

export default Header;
