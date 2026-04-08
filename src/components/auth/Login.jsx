import React, { useState } from 'react';
import bcrypt from 'bcryptjs';
import { getUser, saveUser } from '../../utils/storage';

function Login({ onLogin, onSwitchToRegister, onSwitchToForgotPassword }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const isDev =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.app.github.dev');

  const DEV_EMAIL = 'test@hivio.local';
  const DEV_PASSWORD = '1';

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    if (
      isDev &&
      formData.email.trim().toLowerCase() === DEV_EMAIL.toLowerCase() &&
      formData.password === DEV_PASSWORD
    ) {
      let devUser = getUser(DEV_EMAIL);
      if (!devUser) {
        devUser = {
          name: 'Test User',
          email: DEV_EMAIL,
          password: 'DEV_LOCALHOST_BYPASS',
          createdAt: new Date().toISOString(),
        };
        saveUser(devUser);
      }
      onLogin(devUser);
      return;
    }

    const user = getUser(formData.email.trim());
    if (!user) {
      setError('No account found. Please register first.');
      return;
    }

    if (typeof user.password !== 'string') {
      setError('Account data is corrupted. Please re-register or contact support.');
      return;
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(formData.password, user.password);
    } catch {
      setError('Invalid email or password');
      return;
    }

    if (!isMatch) {
      setError('Invalid email or password');
      return;
    }

    onLogin(user);
  }

  const inputBase =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all';

  return (
    <div className="flex flex-col min-h-screen px-8 pt-16 pb-8 justify-start bg-[#F7F9FC] dark:bg-slate-950">
      {/* Logo + branding */}
      <div className="flex flex-col items-center mb-8">
        <img src="/hivio-logo.svg" alt="Hivio" className="w-28 h-28 mb-3" />

        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">Hivio</h1>
        <p className="text-slate-500 dark:text-slate-300 text-center font-medium text-sm">
          Turning applications into interviews
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="student@university.edu"
            className={inputBase}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={inputBase}
          />
        </div>
        <div className="text-left">
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-[#2C6E91] font-semibold hover:underline text-sm"
          >
            Forgot Password?
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-2"
        >
          Sign In
        </button>
      </form>

      <p className="text-center text-slate-500 dark:text-slate-300 text-sm mt-6 font-medium">
        New to Hivio?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-[#2C6E91] font-semibold hover:underline"
        >
          Create an account
        </button>
      </p>
    </div>
  );
}

export default Login;