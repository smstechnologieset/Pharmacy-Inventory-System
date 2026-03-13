import React, { useState } from 'react';
import { ShieldPlus, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('admin@pharmacy.com');
  const [password, setPassword] = useState('password');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
    navigate('/');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      background: '#F8FAFC',
      fontFamily: "'Lexend', sans-serif"
    }}>
      {/* Left Side - Branding */}
      <div style={{ 
        flex: 1.2, 
        background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '100px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract Bubbly Shapes for background flair */}
        <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px', position: 'relative' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '18px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <ShieldPlus size={40} />
          </div>
          <span style={{ fontSize: '2.4rem', fontWeight: '800', letterSpacing: '-0.025em' }}>PharmaCare</span>
        </div>
        
        <h1 style={{ color: 'white', fontSize: '4.2rem', marginBottom: '32px', lineHeight: '1.05', fontWeight: '800', letterSpacing: '-0.04em', position: 'relative' }}>
          Modern <br /> Pharmacy <br /> Solutions.
        </h1>
        
        <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '500px', lineHeight: '1.6', fontWeight: '400', position: 'relative' }}>
          Simplified inventory management with real-time tracking, glowing analytics, and a vibrant user experience.
        </p>

        <div style={{ marginTop: '64px', display: 'flex', gap: '24px', position: 'relative' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '24px', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontWeight: '700', fontSize: '1.5rem' }}>99.9%</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Accuracy Rate</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '24px', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontWeight: '700', fontSize: '1.5rem' }}>24/7</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Real-time Sync</div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '12px', color: '#0F172A', letterSpacing: '-0.025em' }}>Welcome Back</h2>
            <p style={{ color: '#64748B', fontSize: '1.05rem' }}>Please enter your credentials to access the dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1E293B', marginLeft: '4px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '18px 20px 18px 56px', 
                    borderRadius: '20px', 
                    border: '2px solid #F1F5F9',
                    background: '#F8FAFC',
                    outline: 'none',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(13, 148, 136, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#F1F5F9';
                    e.target.style.background = '#F8FAFC';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1E293B', marginLeft: '4px' }}>Password</label>
                <a href="#" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Forgot?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '18px 20px 18px 56px', 
                    borderRadius: '20px', 
                    border: '2px solid #F1F5F9',
                    background: '#F8FAFC',
                    outline: 'none',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(13, 148, 136, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#F1F5F9';
                    e.target.style.background = '#F8FAFC';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                height: '64px', 
                fontSize: '1.1rem', 
                borderRadius: '20px',
                marginTop: '16px'
              }}
              disabled={loading}
            >
              Sign into Account <ArrowRight size={22} style={{ marginLeft: '12px' }} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '48px', color: '#64748B', fontSize: '0.95rem' }}>
            New organization? <a href="#" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Request Instance</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
