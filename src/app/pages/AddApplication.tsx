import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Save, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useAppContext, JobApplication, ApplicationStatus } from "../context/AppContext";

export function AddApplication() {
  const navigate = useNavigate();
  const { addApplication, resumes } = useAppContext();
  
  const [data, setData] = useState<Partial<JobApplication>>({
    company: "",
    role: "",
    status: "Applied",
    dateApplied: new Date().toISOString().split("T")[0],
    followUpDate: "",
    notes: "",
    resumeId: resumes[0]?.id || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.company || !data.role) return;

    const newApp: JobApplication = {
      id: "a" + Date.now(),
      company: data.company,
      role: data.role,
      status: data.status as ApplicationStatus,
      dateApplied: data.dateApplied || "",
      followUpDate: data.followUpDate,
      notes: data.notes,
      resumeId: data.resumeId
    };

    addApplication(newApp);
    navigate("/applications");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col min-h-screen px-6 py-10 bg-white relative"
    >
      <header className="flex items-center justify-between mb-10 mt-12">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Application</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Company Name</label>
            <input 
              type="text" required placeholder="e.g. Acme Corp"
              value={data.company} onChange={e => setData({...data, company: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Position / Role</label>
            <input 
              type="text" required placeholder="e.g. Junior Product Manager"
              value={data.role} onChange={e => setData({...data, role: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Date Applied</label>
              <input 
                type="date" required 
                value={data.dateApplied} onChange={e => setData({...data, dateApplied: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Follow-up By</label>
              <input 
                type="date"
                value={data.followUpDate} onChange={e => setData({...data, followUpDate: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Current Status</label>
            <div className="relative">
              <select 
                value={data.status} onChange={e => setData({...data, status: e.target.value as ApplicationStatus})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all appearance-none pr-10"
              >
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Rejected">Rejected</option>
                <option value="Offer">Offer</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Linked Resume</label>
            <div className="relative">
              <select 
                value={data.resumeId} onChange={e => setData({...data, resumeId: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all appearance-none pr-10"
              >
                <option value="">None</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Notes</label>
            <textarea 
              rows={4} placeholder="E.g. Spoke with recruiter Jane, waiting for technical assessment..."
              value={data.notes} onChange={e => setData({...data, notes: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all resize-none"
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-8 mb-6"
        >
          <Save size={20} /> Save Application
        </button>
      </form>
    </motion.div>
  );
}
