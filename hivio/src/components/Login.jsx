import React, { useState } from 'react';
import bcrypt from 'bcryptjs';
import './Login.css';

function Login({ onLogin, onSwitchToRegister }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

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

    // Retrieve the stored user from localStorage
    const stored = localStorage.getItem('hivio_user');

    if (!stored) {
      setError('No account found. Please register first.');
      return;
    }

    const user = JSON.parse(stored);

    // Check if the email matches
    if (user.email !== formData.email.trim()) {
      setError('Invalid email or password');
      return;
    }

    // Compare the entered password against the stored hash
    const isMatch = await bcrypt.compare(formData.password, user.password);

    if (!isMatch) {
      setError('Invalid email or password');
      return;
    }

    // Authentication successful - pass user data up to App
    onLogin(user);
  }

  return (
    <div className="login-container">
      <div className="login-header">
        <h1>Hivio</h1>
        <p>Sign in to continue your job search.</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
        </div>

        {error && <span className="error">{error}</span>}

        <button type="submit" className="login-button">
          Sign In
        </button>
      </form>

      <p className="register-link">
        Don't have an account?{' '}
        <button type="button" className="link-button" onClick={onSwitchToRegister}>
          Create one
        </button>
      </p>
    </div>
  );
}

export default Login;
