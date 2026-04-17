import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

function Login({ onSwitchToRegister, onSwitchToForgotPassword }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
      // onAuthStateChanged in App.jsx handles navigation automatically
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.');
          break;
        default:
          setError('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-card)',
    border: '1.5px solid var(--border)',
    color: 'var(--text-1)',
    borderRadius: 14,
    padding: '13px 16px',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
    color: 'var(--text-2)',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    marginBottom: 6,
  };

  function focusInput(e) {
    e.target.style.borderColor = 'var(--brand)';
    e.target.style.boxShadow = '0 0 0 3px var(--brand-glow)';
  }
  function blurInput(e) {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.boxShadow = 'none';
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      background: 'var(--bg-app)',
      padding: '0 24px',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 52,
      }}>
        <img src="/hivio-logo.svg" alt="Hivio" style={{ width: 96, height: 96, marginBottom: 20 }} />
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 36,
          fontWeight: 700,
          color: 'var(--text-1)',
          letterSpacing: '0.14em',
          lineHeight: 1.1,
          margin: '0 0 8px',
        }}>
          HIVIO
        </h1>
        <p style={{
          color: 'var(--text-3)',
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: '0.01em',
          margin: 0,
        }}>
          Turning applications into interviews
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="student@university.edu"
            style={inputStyle}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            style={inputStyle}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </div>

        <div style={{ textAlign: 'right', marginTop: -4 }}>
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            style={{
              color: 'var(--brand)', fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif", background: 'none',
              border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
            color: '#DC2626', fontSize: 13, fontWeight: 500,
            padding: '11px 14px', borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', background: 'var(--brand)', color: '#FFFFFF',
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15,
            letterSpacing: '0.05em', padding: '14px', borderRadius: 14,
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 4, boxShadow: 'var(--shadow-btn)', transition: 'transform 0.1s',
            opacity: loading ? 0.7 : 1,
          }}
          onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p style={{
        textAlign: 'center', color: 'var(--text-2)',
        fontSize: 13, marginTop: 28, fontFamily: "'DM Sans', sans-serif",
      }}>
        New to Hivio?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{
            color: 'var(--brand)', fontWeight: 700, background: 'none',
            border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          }}
        >
          Create an account
        </button>
      </p>
    </div>
  );
}

export default Login;
