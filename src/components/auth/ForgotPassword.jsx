import React, { useState } from 'react';
import bcrypt from 'bcryptjs';
import { getUser, saveUser } from '../../utils/storage';

function ForgotPassword({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!newPassword || !confirmNewPassword) {
      setError('Please enter and confirm your new password');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    const user = getUser(email.trim());
    if (!user) {
      setError('No account found. Please register first.');
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    saveUser({ ...user, password: hashed });
    setSuccess('Password reset successfully. You can now sign in.');
    setNewPassword('');
    setConfirmNewPassword('');
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--bg-app)', padding: '0 24px' }}>

      {/* Header */}
      <div style={{ paddingTop: 44, paddingBottom: 28 }}>
        {/* Back button */}
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--text-3)', background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 500, padding: 0, marginBottom: 24,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--brand)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Sign In
        </button>

        {/* Lock icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'var(--brand-light)', border: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 24, fontWeight: 700,
          color: 'var(--text-1)',
          letterSpacing: '0.06em', lineHeight: 1.2,
          margin: '0 0 6px',
        }}>
          Reset Password
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: 13, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
          Enter your email and choose a new password.
        </p>
      </div>

      {/* Form */}
      <div style={{ flex: 1, paddingBottom: 24 }}>
        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(''); if (success) setSuccess(''); }}
              placeholder="student@university.edu"
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          <div>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); if (error) setError(''); if (success) setSuccess(''); }}
              placeholder="At least 8 characters"
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => { setConfirmNewPassword(e.target.value); if (error) setError(''); if (success) setSuccess(''); }}
              placeholder="••••••••"
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.2)',
              color: '#DC2626',
              fontSize: 13,
              fontWeight: 500,
              padding: '11px 14px',
              borderRadius: 12,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: 'rgba(4,120,87,0.08)',
              border: '1px solid rgba(4,120,87,0.2)',
              color: '#047857',
              fontSize: 13,
              fontWeight: 600,
              padding: '11px 14px',
              borderRadius: 12,
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {success}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              background: 'var(--brand)',
              color: '#FFFFFF',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '0.02em',
              padding: '14px',
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              marginTop: 4,
              boxShadow: 'var(--shadow-btn)',
              transition: 'opacity 0.15s, transform 0.1s',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Reset Password
          </button>
        </form>

        {success && (
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 12,
              padding: '13px',
              borderRadius: 14,
              border: '1.5px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-1)',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              letterSpacing: '0.02em',
              transition: 'border-color 0.15s',
              textAlign: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            Sign In Now
          </button>
        )}

        <p style={{
          textAlign: 'center',
          color: 'var(--text-2)',
          fontSize: 13,
          marginTop: 28,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Remembered it?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              color: 'var(--brand)',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
            }}
          >
            Back to Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
