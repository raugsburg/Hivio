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

    const isMatch = await bcrypt.compare(formData.password, user.password);
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