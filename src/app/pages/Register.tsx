import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Briefcase, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirm: "" });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/setup");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col min-h-screen px-8 py-10 bg-white relative"
    >
      <Link to="/" className="absolute top-8 left-6 p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
        <ArrowLeft size={24} />
      </Link>
      
      <div className="flex flex-col mb-10 mt-16">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Create Account</h1>
        <p className="text-slate-500 font-medium leading-relaxed">Join Hivio and get your job search organized today.</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Full Name</label>
          <input 
            type="text" required placeholder="Alex Carter"
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email</label>
          <input 
            type="email" required placeholder="student@university.edu"
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
          <input 
            type="password" required placeholder="••••••••"
            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Confirm Password</label>
          <input 
            type="password" required placeholder="••••••••"
            value={formData.confirm} onChange={e => setFormData({...formData, confirm: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-6"
        >
          Create Account
        </button>
      </form>
    </motion.div>
  );
}
