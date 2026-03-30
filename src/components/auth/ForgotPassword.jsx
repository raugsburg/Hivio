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
    const updatedUser = { ...user, password: hashed };
    saveUser(updatedUser);

    setSuccess('Password reset successfully. You can now sign in.');
    setNewPassword('');
    setConfirmNewPassword('');
  }

  return (
    <div className="flex flex-col min-h-screen px-8 pt-16 pb-8 justify-start bg-[#F7F9FC] dark:bg-slate-950">
      <div className="flex flex-col items-center mb-8">
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-28 h-28 mb-3"
        >
          <polygon
            points="32,10 46,18 46,34 32,42 18,34 18,18"
            fill="none"
            stroke="#2C6E91"
            strokeWidth="2"
          />
          <circle cx="32" cy="26" r="4" fill="#2C6E91" />
          <circle cx="32" cy="10" r="3" fill="#2C6E91" opacity="0.7" />
          <circle cx="46" cy="18" r="3" fill="#2C6E91" opacity="0.7" />
          <circle cx="46" cy="34" r="3" fill="#2C6E91" opacity="0.7" />
          <circle cx="32" cy="42" r="3" fill="#2C6E91" opacity="0.7" />
          <circle cx="18" cy="34" r="3" fill="#2C6E91" opacity="0.7" />
          <circle cx="18" cy="18" r="3" fill="#2C6E91" opacity="0.7" />
          <line x1="32" y1="26" x2="32" y2="10" stroke="#2C6E91" strokeWidth="1.2" opacity="0.5" />
          <line x1="32" y1="26" x2="46" y2="18" stroke="#2C6E91" strokeWidth="1.2" opacity="0.5" />
          <line x1="32" y1="26" x2="46" y2="34" stroke="#2C6E91" strokeWidth="1.2" opacity="0.5" />
          <line x1="32" y1="26" x2="32" y2="42" stroke="#2C6E91" strokeWidth="1.2" opacity="0.5" />
          <line x1="32" y1="26" x2="18" y2="34" stroke="#2C6E91" strokeWidth="1.2" opacity="0.5" />
          <line x1="32" y1="26" x2="18" y2="18" stroke="#2C6E91" strokeWidth="1.2" opacity="0.5" />
          <circle cx="32" cy="52" r="2.5" fill="#2C6E91" opacity="0.4" />
          <circle cx="54" cy="44" r="2.5" fill="#2C6E91" opacity="0.4" />
          <circle cx="10" cy="44" r="2.5" fill="#2C6E91" opacity="0.4" />
          <line x1="32" y1="42" x2="32" y2="52" stroke="#2C6E91" strokeWidth="1" opacity="0.3" />
          <line x1="46" y1="34" x2="54" y2="44" stroke="#2C6E91" strokeWidth="1" opacity="0.3" />
          <line x1="18" y1="34" x2="10" y2="44" stroke="#2C6E91" strokeWidth="1" opacity="0.3" />
        </svg>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
          Reset Password
        </h1>
        <p className="text-slate-500 dark:text-slate-300 text-center font-medium">
          Enter your email and choose a new password.
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
              if (success) setSuccess('');
            }}
            placeholder="student@university.edu"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (error) setError('');
              if (success) setSuccess('');
            }}
            placeholder="At least 8 characters"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => {
              setConfirmNewPassword(e.target.value);
              if (error) setError('');
              if (success) setSuccess('');
            }}
            placeholder="••••••••"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-medium px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-4"
        >
          Reset Password
        </button>
      </form>

      <p className="text-center text-slate-500 dark:text-slate-300 text-sm mt-8 font-medium">
        Remembered it?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[#2C6E91] font-semibold hover:underline"
        >
          Back to Sign In
        </button>
      </p>
    </div>
  );
}

export default ForgotPassword;