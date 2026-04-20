import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { EMAIL_REGEX } from '../../utils/validate';

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
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid email address (e.g. name@example.com).');
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

  return (
    <div className="flex flex-col min-h-full px-6 bg-hivio-bg dark:bg-hivio-bg-dark">
      <div className="flex flex-col items-center pt-[72px] pb-10">
        <div className="w-16 h-16 rounded-full bg-hivio-primary-light dark:bg-hivio-primary/15 flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-hivio-text-primary dark:text-hivio-text-primary-dark mb-2 text-center">
          Reset Password
        </h1>
        <p className="text-sm text-hivio-text-secondary dark:text-hivio-text-secondary-dark text-center">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleReset} noValidate className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); setSuccess(''); }}
            placeholder="student@university.edu"
            className="w-full text-sm font-normal text-hivio-text-primary dark:text-hivio-text-primary-dark bg-hivio-surface dark:bg-hivio-surface-dark border border-hivio-border dark:border-hivio-border-dark rounded-sm px-3 py-2 shadow-hivio-sm placeholder:text-hivio-text-muted dark:placeholder:text-hivio-text-muted-dark focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 ease-in-out"
          />
        </div>

        {error && (
          <div className="bg-hivio-status-rejected-bg dark:bg-hivio-status-rejected-bg-dark border border-hivio-status-rejected/20 dark:border-hivio-status-rejected-dark/20 text-hivio-status-rejected dark:text-hivio-status-rejected-dark text-sm font-medium px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-hivio-status-offer-bg dark:bg-hivio-status-offer-bg-dark border border-hivio-status-offer/20 dark:border-hivio-status-offer-dark/20 text-hivio-status-offer dark:text-hivio-status-offer-dark text-sm font-medium px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !!success}
          className="w-full bg-hivio-primary text-hivio-text-inverse text-sm font-medium px-4 py-3 rounded-md shadow-hivio-sm hover:bg-hivio-primary-hover transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed mt-1"
        >
          {loading ? 'Sending…' : 'Send Reset Email'}
        </button>
      </form>

      <p className="text-center text-sm text-hivio-text-secondary dark:text-hivio-text-secondary-dark mt-7">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-hivio-primary bg-transparent text-sm font-medium hover:text-hivio-primary-hover transition-colors duration-150 ease-in-out"
        >
          ← Back to Sign In
        </button>
      </p>
    </div>
  );
}

export default ForgotPassword;
