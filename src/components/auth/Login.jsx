import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { EMAIL_REGEX } from '../../utils/validate';

function Login({ onSwitchToRegister, onSwitchToForgotPassword }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }
    if (!EMAIL_REGEX.test(formData.email.trim())) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
      // onAuthStateChanged in App.jsx handles navigation automatically
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.');
          break;
        default:
          setError('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full px-6 bg-hivio-bg dark:bg-hivio-bg-dark">
      <div className="flex flex-col items-center pt-20 pb-12">
        <img src="/hivio-logo.svg" alt="Hivio" className="w-24 h-24 mb-5" />
        <h1 className="text-2xl font-bold text-hivio-text-primary dark:text-hivio-text-primary-dark mb-2 tracking-wide">
          HIVIO
        </h1>
        <p className="text-sm text-hivio-text-muted dark:text-hivio-text-muted-dark">
          Turning applications into interviews
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="student@university.edu"
            className="w-full text-sm font-normal text-hivio-text-primary dark:text-hivio-text-primary-dark bg-hivio-surface dark:bg-hivio-surface-dark border border-hivio-border dark:border-hivio-border-dark rounded-sm px-3 py-2 shadow-hivio-sm placeholder:text-hivio-text-muted dark:placeholder:text-hivio-text-muted-dark focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 ease-in-out"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full text-sm font-normal text-hivio-text-primary dark:text-hivio-text-primary-dark bg-hivio-surface dark:bg-hivio-surface-dark border border-hivio-border dark:border-hivio-border-dark rounded-sm px-3 py-2 shadow-hivio-sm placeholder:text-hivio-text-muted dark:placeholder:text-hivio-text-muted-dark focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 ease-in-out"
          />
        </div>

        <div className="text-right -mt-1">
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-hivio-primary bg-transparent text-sm font-medium hover:text-hivio-primary-hover transition-colors duration-150 ease-in-out"
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <div className="bg-hivio-status-rejected-bg dark:bg-hivio-status-rejected-bg-dark border border-hivio-status-rejected/20 dark:border-hivio-status-rejected-dark/20 text-hivio-status-rejected dark:text-hivio-status-rejected-dark text-sm font-medium px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-hivio-primary text-hivio-text-inverse text-sm font-medium px-4 py-3 rounded-md shadow-hivio-sm hover:bg-hivio-primary-hover transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed mt-1"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-hivio-text-secondary dark:text-hivio-text-secondary-dark mt-8">
        New to Hivio?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-hivio-primary bg-transparent text-sm font-medium hover:text-hivio-primary-hover transition-colors duration-150 ease-in-out"
        >
          Create an account
        </button>
      </p>
    </div>
  );
}

export default Login;
