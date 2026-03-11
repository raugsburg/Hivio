import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAppContext();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.email.trim(), formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex flex-col justify-center px-6 py-12"
    >
      {/* Logo/Header */}
      <div className="mb-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-14 h-14 bg-[#2C6E91] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#2C6E91]/20"
        >
          <span className="text-white text-2xl font-bold">H</span>
        </motion.div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome back</h1>
        <p className="text-slate-500">Sign in to continue your job search</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@university.edu"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl"
          >
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 bg-[#2C6E91] text-white font-semibold rounded-xl shadow-lg shadow-[#2C6E91]/25 hover:bg-[#245d7d] active:bg-[#1e506c] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </motion.button>
      </form>

      {/* Register link */}
      <p className="text-center text-slate-500 text-sm mt-8">
        Don't have an account?{' '}
        <Link to="/register" className="text-[#2C6E91] font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </motion.div>
  );
}
