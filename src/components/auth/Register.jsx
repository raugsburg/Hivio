import React, { useState } from 'react';
import bcrypt from 'bcryptjs';
import { saveUser } from '../../utils/storage';
import { EMAIL_REGEX } from '../../utils/validate';

function Register({ onRegistrationComplete, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(formData.password, salt);

    const userData = {
      name: formData.name,
      email: formData.email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    saveUser(userData);
    onRegistrationComplete(userData);
  }

  const inputBase =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all';

  return (
    <div className="flex flex-col min-h-screen px-8 py-10 bg-[#F7F9FC] dark:bg-slate-950 relative">
      <div className="flex flex-col items-center text-center mb-10 mt-16">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">Create Account</h1>
        <p className="text-slate-500 dark:text-slate-300 font-medium leading-relaxed">
          Join Hivio and get your job search organized today.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Alex Carter"
            className={inputBase}
          />
          {errors.name && <span className="text-red-500 dark:text-red-300 text-xs mt-1 ml-1">{errors.name}</span>}
        </div>

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
          {errors.email && <span className="text-red-500 dark:text-red-300 text-xs mt-1 ml-1">{errors.email}</span>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            className={inputBase}
          />
          {errors.password && <span className="text-red-500 dark:text-red-300 text-xs mt-1 ml-1">{errors.password}</span>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            className={inputBase}
          />
          {errors.confirmPassword && <span className="text-red-500 dark:text-red-300 text-xs mt-1 ml-1">{errors.confirmPassword}</span>}
        </div>

        <button
          type="submit"
          className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-6"
        >
          Create Account
        </button>
      </form>

      <p className="text-center text-slate-500 dark:text-slate-300 text-sm mt-10 font-medium">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-[#2C6E91] font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </div>
  );
}

export default Register;