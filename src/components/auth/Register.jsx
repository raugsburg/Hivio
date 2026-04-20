import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { saveUserProfile } from '../../utils/db';
import { EMAIL_REGEX } from '../../utils/validate';

function Register({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    else if (!EMAIL_REGEX.test(formData.email.trim())) newErrors.email = 'Please enter a valid email address (e.g. name@example.com).';
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
    let cred = null;
    try {
      cred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
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
      setLoading(false);
      return;
    }

    try {
      await saveUserProfile(cred.user.uid, {
        uid: cred.user.uid,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        email: formData.email.trim().toLowerCase(),
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      });
      // onAuthStateChanged in App.jsx detects no profile and routes to ProfileSetup
    } catch {
      setErrors({ email: 'Account created but profile save failed. Please sign in to continue.' });
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    'w-full text-sm font-normal text-hivio-text-primary dark:text-hivio-text-primary-dark bg-hivio-surface dark:bg-hivio-surface-dark border border-hivio-border dark:border-hivio-border-dark rounded-sm px-3 py-2 shadow-hivio-sm placeholder:text-hivio-text-muted dark:placeholder:text-hivio-text-muted-dark focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 ease-in-out';

  return (
    <div className="h-full flex flex-col px-6 pt-8 pb-8 bg-hivio-bg dark:bg-hivio-bg-dark relative">
      <div className="flex flex-col items-center text-center mb-6">
        <h1 className="text-2xl font-bold text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1">Create Account</h1>
        <p className="text-sm text-hivio-text-secondary dark:text-hivio-text-secondary-dark">
          Join Hivio and get your job search organized.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">First Name <span className="text-hivio-text-muted dark:text-hivio-text-muted-dark">*</span></label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Alex" className={inputBase} />
            {errors.firstName && <span className="text-xs font-medium text-hivio-status-rejected mt-1 block">{errors.firstName}</span>}
          </div>
          <div>
            <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Carter" className={inputBase} />
            {errors.lastName && <span className="text-xs font-medium text-hivio-status-rejected mt-1 block">{errors.lastName}</span>}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Email <span className="text-hivio-text-muted dark:text-hivio-text-muted-dark">*</span></label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="student@university.edu" className={inputBase} />
          {errors.email && <span className="text-xs font-medium text-hivio-status-rejected mt-1 block">{errors.email}</span>}
        </div>

        <div>
          <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Password <span className="text-hivio-text-muted dark:text-hivio-text-muted-dark">*</span></label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="At least 8 characters" className={inputBase} />
          {errors.password && <span className="text-xs font-medium text-hivio-status-rejected mt-1 block">{errors.password}</span>}
        </div>

        <div>
          <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Confirm Password <span className="text-hivio-text-muted dark:text-hivio-text-muted-dark">*</span></label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter your password" className={inputBase} />
          {errors.confirmPassword && <span className="text-xs font-medium text-hivio-status-rejected mt-1 block">{errors.confirmPassword}</span>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-hivio-primary text-hivio-text-inverse text-sm font-medium px-4 py-3 rounded-md shadow-hivio-sm hover:bg-hivio-primary-hover transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-hivio-text-secondary dark:text-hivio-text-secondary-dark pt-1">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="text-hivio-primary text-sm font-medium hover:text-hivio-primary-hover transition-colors duration-150 ease-in-out">
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
}

export default Register;
