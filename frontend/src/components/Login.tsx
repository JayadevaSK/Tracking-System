import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('Username is required'); return; }
    if (!password) { setError('Password is required'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await authService.login(username, password);
      if (result.success) {
        login(result.token!, result.userId!, result.role as UserRole);
        navigate(result.role === UserRole.MANAGER ? '/manager' : '/employee');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'transparent' }}>
      <div className="animate-in" style={{ width: '100%', maxWidth: '440px', background: 'linear-gradient(145deg, rgba(18,22,50,0.92) 0%, rgba(10,12,30,0.96) 100%)', border: '1px solid rgba(124,111,255,0.25)', borderRadius: '24px', padding: '44px 40px', backdropFilter: 'blur(32px)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(124,111,255,0.6), rgba(0,229,184,0.4), transparent)' }} />
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #7c6fff 0%, #00e5b8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '28px', animation: 'float 3.5s ease-in-out infinite' }}>
            {'📊'}
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#eef2ff', letterSpacing: '-0.5px' }}>Work Tracker</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>Sign in to your workspace</p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="username">Username</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} placeholder="Enter your username" autoComplete="username" />
          </div>
          <div style={{ marginBottom: '28px' }}>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} placeholder="Enter your password" autoComplete="current-password" />
          </div>
          {error && <div className="alert-error" role="alert">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', borderRadius: '14px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>Secured workspace</p>
      </div>
    </div>
  );
};

export default Login;
