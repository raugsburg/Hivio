import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) setSubmitError('');
  }

  function validate(): FormErrors {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      await register(formData.name.trim(), formData.email.trim(), formData.password);
      navigate('/setup');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass = "w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex flex-col justify-center px-6 py-12"
    >
      <div className="mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-14 h-14 bg-[#2C6E91] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#2C6E91]/20"
        >
          <span className="text-white text-2xl font-bold">H</span>
        </motion.div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Create account</h1>
        <p className="text-slate-500">Track your job search, all in one place</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
          <div className="relative">
            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className={`${inputClass} ${errors.name ? 'border-red-300' : 'border-slate-200'}`}
            />
          </div>
          {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name}</p>}
        </div>

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
              className={`${inputClass} ${errors.email ? 'border-red-300' : 'border-slate-200'}`}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email}</p>}
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
              placeholder="At least 8 characters"
              className={`${inputClass} ${errors.password ? 'border-red-300' : 'border-slate-200'}`}
            />
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className={`${inputClass} ${errors.confirmPassword ? 'border-red-300' : 'border-slate-200'}`}
            />
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 ml-1">{errors.confirmPassword}</p>}
        </div>

        {/* Submit error */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl"
          >
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{submitError}</p>
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={isLoading}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 bg-[#2C6E91] text-white font-semibold rounded-xl shadow-lg shadow-[#2C6E91]/25 hover:bg-[#245d7d] active:bg-[#1e506c] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </motion.button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-6">
        Already have an account?{' '}
        <Link to="/" className="text-[#2C6E91] font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
