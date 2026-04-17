import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { saveUserProfile } from '../../utils/db';

function Register({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required.';
    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    if (!formData.password) newErrors.password = 'Password is required.';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
      // Save basic profile to Firestore — no profile data yet, ProfileSetup handles that
      await saveUserProfile(cred.user.uid, {
        uid: cred.user.uid,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      });
      // onAuthStateChanged in App.jsx detects no profile and routes to ProfileSetup
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setErrors({ email: 'An account with this email already exists.' });
          break;
        case 'auth/invalid-email':
          setErrors({ email: 'Enter a valid email address.' });
          break;
        case 'auth/weak-password':
          setErrors({ password: 'Password must be at least 8 characters.' });
          break;
        default:
          setErrors({ email: 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all';

  return (
    <div className="h-full flex flex-col px-6 pt-8 pb-8 bg-[#F7F9FC] dark:bg-slate-950 relative">
      <div className="flex flex-col items-center text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">Create Account</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300 font-medium">
          Join Hivio and get your job search organized.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Full Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Alex Carter" className={inputBase} />
          {errors.name && <span className="text-red-500 dark:text-red-300 text-xs mt-1 ml-1">{errors.name}</span>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="student@university.edu" className={inputBase} />
          {errors.email && <span className="text-red-500 dark:text-red-300 text-xs mt-1 ml-1">{errors.email}</span>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="At least 8 characters" className={inputBase} />
          {errors.password && <span className="text-red-500 dark:text-red-300 text-xs mt-1 ml-1">{errors.password}</span>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Confirm Password</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter your password" className={inputBase} />
          {errors.confirmPassword && <span className="text-red-500 dark:text-red-300 text-xs mt-1 ml-1">{errors.confirmPassword}</span>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-4"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <p className="text-center text-slate-500 dark:text-slate-300 text-sm pt-1 font-medium">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="text-[#2C6E91] font-semibold hover:underline">
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
}

export default Register;
