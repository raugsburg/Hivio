import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { JobApplication } from '../context/AppContext';

export default function AddApplication() {
  const navigate = useNavigate();
  const { addApplication } = useAppContext();
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    status: 'Applied' as JobApplication['status'],
    dateApplied: new Date().toISOString().split('T')[0],
    location: '',
    notes: '',
    url: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.company.trim() || !formData.role.trim()) return;
    addApplication(formData);
    navigate('/applications');
  }

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all text-sm";

  return (
    <div className="px-5 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center">
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Add Application</h1>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Company *</label>
          <input name="company" value={formData.company} onChange={handleChange} placeholder="Company name" className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
          <input name="role" value={formData.role} onChange={handleChange} placeholder="Job title" className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
            {(['Applied', 'Interview', 'Offer', 'Rejected', 'Saved'] as const).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Date Applied</label>
          <input type="date" name="dateApplied" value={formData.dateApplied} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
          <input name="location" value={formData.location} onChange={handleChange} placeholder="City, State (optional)" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Job URL</label>
          <input name="url" value={formData.url} onChange={handleChange} placeholder="https://..." className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Any notes..." rows={3} className={`${inputClass} resize-none`} />
        </div>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 bg-[#2C6E91] text-white font-semibold rounded-xl shadow-lg shadow-[#2C6E91]/25 hover:bg-[#245d7d] transition-colors mt-2"
        >
          Save Application
        </motion.button>
      </form>
    </div>
  );
}
