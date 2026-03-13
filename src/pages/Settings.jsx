import React from 'react';
import { User, Shield, Bell, Lock, Smartphone, Globe, Save, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="settings-page">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.025em' }}>Settings & Preferences</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>Configure your account and system environment.</p>
      </div>
      
      <div className="dashboard-grid">
        {/* Left Column: Profile & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User size={20} color="var(--primary)" /> Profile Information
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '24px', background: 'var(--primary-light)', borderRadius: '24px', border: '1px solid rgba(13, 148, 136, 0.1)' }}>
              <img src={user?.avatar} style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid white', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }} alt="Avatar" />
              <div>
                <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0F172A' }}>{user?.name}</div>
                <div style={{ fontSize: '0.95rem', color: '#64748B', marginBottom: '8px' }}>{user?.email}</div>
                <span className="status-badge" style={{ background: 'white', color: 'var(--primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>{user?.role.toUpperCase()}</span>
              </div>
            </div>
            <div style={{ marginTop: '24px' }}>
              <button className="btn" style={{ width: '100%', background: 'white', border: '1px solid #F1F5F9', color: '#1E293B', height: '52px' }}>
                Update Profile Photo
              </button>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={20} color="var(--primary)" /> Account Security
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button className="btn" style={{ justifyContent: 'flex-start', background: '#F8FAFC', color: '#1E293B', padding: '16px 24px', borderRadius: '16px' }}>
                <Lock size={18} style={{ marginRight: '12px', opacity: 0.6 }} /> Change Password
              </button>
              <button className="btn" style={{ justifyContent: 'flex-start', background: '#F8FAFC', color: '#1E293B', padding: '16px 24px', borderRadius: '16px' }}>
                <Shield size={18} style={{ marginRight: '12px', opacity: 0.6 }} /> Two-Factor Authentication (2FA)
              </button>
              <button className="btn" style={{ justifyContent: 'flex-start', background: '#F8FAFC', color: '#1E293B', padding: '16px 24px', borderRadius: '16px' }}>
                <Smartphone size={18} style={{ marginRight: '12px', opacity: 0.6 }} /> Session Management
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: System Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card" style={{ height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Globe size={20} color="var(--primary)" /> Localization
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '10px', color: '#475569' }}>Preferred Currency</label>
                <select className="search-bar" style={{ width: '100%', appearance: 'auto', background: '#F8FAFC', border: 'none', padding: '14px 20px' }}>
                  <option>Ethiopian Birr (ETB)</option>
                  <option>US Dollar (USD)</option>
                  <option>Euro (EUR)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '10px', color: '#475569' }}>System Language</label>
                <select className="search-bar" style={{ width: '100%', appearance: 'auto', background: '#F8FAFC', border: 'none', padding: '14px 20px' }}>
                  <option>English (Universal)</option>
                  <option>Amharic (Amharigna)</option>
                  <option>Oromo (Afaan Oromoo)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '10px', color: '#475569' }}>Low Stock Notification Threshold</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <input type="number" defaultValue="50" className="search-bar" style={{ flex: 1, background: '#F8FAFC', border: 'none', padding: '14px 20px' }} />
                  <span style={{ fontWeight: '600', color: '#94A3B8' }}>units</span>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '40px' }}>
              <button className="btn btn-primary" style={{ width: '100%', height: '56px', fontSize: '1.05rem' }}>
                <Save size={20} /> Save All Changes
              </button>
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: 'white', border: 'none' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <HelpCircle size={20} color="var(--primary)" /> Need Help?
            </h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: '1.6', marginBottom: '24px' }}>
              Check our documentation or contact the system administrator for technical support.
            </p>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', width: '100%' }}>
              Open Support Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
