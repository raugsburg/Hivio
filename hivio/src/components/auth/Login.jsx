import React, { useState } from 'react';
import bcrypt from 'bcryptjs';

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

    // Localhost-only fallback account for easy testing
    if (
      isDev &&
      formData.email.trim().toLowerCase() === DEV_EMAIL.toLowerCase() &&
      formData.password === DEV_PASSWORD
    ) {
      const devUser = {
        email: DEV_EMAIL,
        password: 'DEV_LOCALHOST_BYPASS', 
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
      };

      
      localStorage.setItem('hivio_user', JSON.stringify(devUser));

      onLogin(devUser);
      return;
    }

    const stored = localStorage.getItem('hivio_user');
    if (!stored) {
      setError('No account found. Please register first.');
      return;
    }

    const user = JSON.parse(stored);
    if (user.email.toLowerCase() !== formData.email.trim().toLowerCase()) {
      setError('Invalid email or password');
      return;
    }

    const isMatch = await bcrypt.compare(formData.password, user.password);
    if (!isMatch) {
      setError('Invalid email or password');
      return;
    }

    onLogin(user);
  }

  return (
    <div className="flex flex-col min-h-screen px-8 py-12 justify-center bg-white">
      <div className="flex flex-col items-center mb-12">
        <div className="w-16 h-16 bg-[#2C6E91] text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Hivio</h1>
        <p className="text-slate-500 text-center font-medium">Your calm companion for the job search.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="student@university.edu"
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
          />
        </div>
        <div className="text-left">
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-[#2C6E91] font-semibold hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-4"
        >
          Sign In
        </button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-10 font-medium">
        New to Hivio?{' '}
        <button type="button" onClick={onSwitchToRegister} className="text-[#2C6E91] font-semibold hover:underline">
          Create an account
        </button>
      </p>
    </div>
  );
}

export default Login;