import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Briefcase } from "lucide-react";
import { motion } from "motion/react";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col min-h-screen px-8 py-12 justify-center bg-white"
    >
      <div className="flex flex-col items-center mb-12">
        <div className="w-16 h-16 bg-[#2C6E91] text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-100/50">
          <Briefcase size={32} strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Hivio</h1>
        <p className="text-slate-500 text-center font-medium">Your calm companion for the job search.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
            placeholder="student@university.edu"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
            placeholder="••••••••"
          />
          <div className="flex justify-end mt-2">
            <a href="#" className="text-sm font-medium text-[#2C6E91] hover:text-[#1a4a66]">Forgot password?</a>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-4"
        >
          Sign In
        </button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-10 font-medium">
        New to Hivio? <Link to="/register" className="text-[#2C6E91] font-semibold hover:underline">Create an account</Link>
      </p>
    </motion.div>
  );
}
