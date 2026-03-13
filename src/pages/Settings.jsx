import React from 'react';
import { User, Shield, Bell, Lock, Smartphone, Globe, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      
      <div className="dashboard-grid" style={{ marginTop: '30px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><User size={20} /> My Profile</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: '#F9FAFB', borderRadius: '12px' }}>
              <img src={user?.avatar} style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
              <div>
                <div style={{ fontWeight: '700' }}>{user?.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{user?.email}</div>
                <span className="status-badge" style={{ marginTop: '8px', display: 'inline-block', background: '#EEF2FF', color: '#4338CA' }}>{user?.role.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Shield size={20} /> Security</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button className="btn" style={{ textAlign: 'left', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={16} /> Change Password
              </button>
              <button className="btn" style={{ textAlign: 'left', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={16} /> Two-Factor Authentication
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Globe size={20} /> System Preferences</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Currency Display</label>
                <select className="btn" style={{ width: '100%', border: '1px solid #E5E7EB', appearance: 'auto', background: 'white' }}>
                  <option>Ethiopian Birr (ETB)</option>
                  <option>US Dollar (USD)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Language</label>
                <select className="btn" style={{ width: '100%', border: '1px solid #E5E7EB', appearance: 'auto', background: 'white' }}>
                  <option>English</option>
                  <option>Amharic (Amharigna)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Low Stock threshold</label>
                <input type="number" defaultValue="50" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E5E7EB' }} />
              </div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Save size={18} /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
