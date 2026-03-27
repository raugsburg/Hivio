import React, { useState } from 'react';
import bcrypt from 'bcryptjs';

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

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    const stored = localStorage.getItem('hivio_user');
    if (!stored) {
      setError('No account found. Please register first.');
      return;
    }

    const user = JSON.parse(stored);
    if (user.email.toLowerCase() !== email.trim().toLowerCase()) {
      setError('Email not found. Please try again.');
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const updatedUser = { ...user, password: hashed };
    localStorage.setItem('hivio_user', JSON.stringify(updatedUser));

    setSuccess('Password reset successfully. You can now sign in.');
    setNewPassword('');
    setConfirmNewPassword('');
  }

  return (
    <div className="flex flex-col min-h-screen px-8 py-12 justify-center bg-white">
      <div className="flex flex-col items-center mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          Reset Password
        </h1>
        <p className="text-slate-500 text-center font-medium">
          Enter your email and choose a new password.
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
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
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
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
            placeholder="••••••••"
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
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
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl">
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

      <p className="text-center text-slate-500 text-sm mt-8 font-medium">
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