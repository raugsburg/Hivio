import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';

function ForgotPassword({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess('Password reset email sent. Check your inbox.');
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No account found with that email.');
          break;
        case 'auth/invalid-email':
          setError('Enter a valid email address.');
          break;
        default:
          setError('Failed to send reset email. Please try again.');
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

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100%',
      background: 'var(--bg-app)', padding: '0 24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 72, paddingBottom: 40 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--brand-light)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 20,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700,
          color: 'var(--text-1)', margin: '0 0 8px', textAlign: 'center',
        }}>
          Reset Password
        </h1>
        <p style={{
          color: 'var(--text-3)', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
          textAlign: 'center', margin: 0, lineHeight: 1.5,
        }}>
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 700,
            fontFamily: "'Syne', sans-serif", color: 'var(--text-2)',
            letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6,
          }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); setSuccess(''); }}
            placeholder="student@university.edu"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-glow)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
            color: '#DC2626', fontSize: 13, fontWeight: 500,
            padding: '11px 14px', borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
          }}>{error}</div>
        )}

        {success && (
          <div style={{
            background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)',
            color: '#059669', fontSize: 13, fontWeight: 500,
            padding: '11px 14px', borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
          }}>{success}</div>
        )}

        <button
          type="submit"
          disabled={loading || !!success}
          style={{
            width: '100%', background: 'var(--brand)', color: '#FFFFFF',
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15,
            letterSpacing: '0.05em', padding: '14px', borderRadius: 14,
            border: 'none', cursor: (loading || success) ? 'not-allowed' : 'pointer',
            marginTop: 4, boxShadow: 'var(--shadow-btn)', opacity: (loading || success) ? 0.7 : 1,
          }}
        >
          {loading ? 'Sending…' : 'Send Reset Email'}
        </button>
      </form>

      <p style={{
        textAlign: 'center', color: 'var(--text-2)',
        fontSize: 13, marginTop: 28, fontFamily: "'DM Sans', sans-serif",
      }}>
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            color: 'var(--brand)', fontWeight: 700, background: 'none',
            border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          }}
        >
          ← Back to Sign In
        </button>
      </p>
    </div>
  );
}

export default ForgotPassword;
