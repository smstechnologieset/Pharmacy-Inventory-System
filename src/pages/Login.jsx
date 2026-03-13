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
      background: '#F8F9FD',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Left Side - Branding */}
      <div style={{ 
        flex: 1, 
        background: 'linear-gradient(135deg, #4A6CF7 0%, #3b5bdb 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
            <ShieldPlus size={32} />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: '800' }}>Pharmacy</span>
        </div>
        <h1 style={{ color: 'white', fontSize: '3.5rem', marginBottom: '24px', lineHeight: '1.1' }}>
          Intelligent <br /> Inventory <br /> Management.
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.8, maxWidth: '450px', lineHeight: '1.6' }}>
          Efficiency, accuracy, and real-time visibility for your modern pharmacy business.
        </p>
      </div>

      {/* Right Side - Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '8px' }}>Welcome back</h2>
          <p style={{ color: '#6B7280', marginBottom: '32px' }}>Please enter your details to sign in.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 12px 12px 48px', 
                    borderRadius: '10px', 
                    border: '1px solid #E5E7EB',
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                  placeholder="pharmacy@business.com"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 12px 12px 48px', 
                    borderRadius: '10px', 
                    border: '1px solid #E5E7EB',
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div style={{ textAlign: 'right', marginTop: '12px' }}>
                <a href="#" style={{ fontSize: '0.85rem', color: '#4A6CF7', fontWeight: '600', textDecoration: 'none' }}>Forgot password?</a>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={loading}
            >
              Sign In <ArrowRight size={18} />
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '32px', color: '#6B7280', fontSize: '0.9rem' }}>
            Don't have an account? <a href="#" style={{ color: '#4A6CF7', fontWeight: '600', textDecoration: 'none' }}>Contact Admin</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
