import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// ─── Reusable Input ───────────────────────────────────────────────────────────
function Input({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        style={{
          width: '100%', padding: '11px 14px', borderRadius: '8px',
          border: '1.5px solid #e0e0e0', outline: 'none', fontSize: '0.95rem',
          fontFamily: 'Jost, sans-serif', color: '#1a1a1a', boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = '#1a1a1a'}
        onBlur={e  => e.target.style.borderColor = '#e0e0e0'}
      />
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { login, register } = useAuth();

  const [mode,     setMode]     = useState('login');   // 'login' | 'register'
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const reset = () => { setName(''); setEmail(''); setPassword(''); setError(''); setLoading(false); };

  const switchMode = (m) => { setMode(m); reset(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error('Please enter your full name.');
        await register(name, email, password);
      }
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000, backdropFilter: 'blur(2px)' }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff', borderRadius: '16px', zIndex: 10001,
        width: '90%', maxWidth: '420px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        fontFamily: 'Jost, sans-serif', overflow: 'hidden',
      }}>

        {/* Top accent bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #1a1a1a, #555)' }} />

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}
          >✕</button>

          {/* Logo / Title */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img src="/assets/images/logo.svg" alt="Casmart" style={{ height: '28px', marginBottom: '12px' }} />
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#1a1a1a' }}>
              {mode === 'login' ? 'Welcome Back! 👋' : 'Create Your Account'}
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#aaa' }}>
              {mode === 'login' ? 'Login to continue shopping' : 'Join Casmart and start shopping'}
            </p>
          </div>

          {/* Tab Switch */}
          <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: '9px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '0.9rem',
                  background: mode === m ? '#fff' : 'transparent',
                  color: mode === m ? '#1a1a1a' : '#aaa',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <Input label="Full Name" value={name} onChange={e=>setName(e.target.value)} placeholder="John Doe" autoComplete="name" />
            )}
            <Input label="Email Address" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            <Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />

            {/* Error */}
            {error && (
              <div style={{ background: '#fff3f3', border: '1px solid #ffcdd2', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.85rem', color: '#c62828', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: '1.05rem',
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: loading ? 'none' : '0 8px 20px rgba(0,0,0,0.15)',
              }}
              onMouseEnter={e => { if(!loading) e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { if(!loading) e.target.style.transform = 'translateY(0)'; }}
            >
              {loading
                ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Processing...</>
                : mode === 'login' ? 'Sign In Securely' : 'Create Account'
              }
            </button>
          </form>

        </div>
      </div>
    </>
  );
}
