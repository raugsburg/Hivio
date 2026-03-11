import React, { useState } from "react";
import { Link } from "react-router";
import { Plus, Search, Filter } from "lucide-react";
import { motion } from "motion/react";
import { useAppContext } from "../context/AppContext";
import { StatusBadge } from "../components/StatusBadge";

export function Applications() {
  const { applications } = useAppContext();
  const [filter, setFilter] = useState<string>("All");

  const statuses = ["All", "Applied", "Interview", "Offer", "Rejected"];
  
  const filteredApps = applications.filter(app => filter === "All" || app.status === filter);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen px-6 py-12 pt-16 bg-[#F7F9FC]"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Applications</h1>
        <Link to="/add-application" className="w-10 h-10 bg-[#2C6E91] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#1a4a66] transition-colors">
          <Plus size={20} strokeWidth={2.5} />
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search company or role..." 
          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] shadow-sm transition-all text-sm font-medium"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
        {statuses.map(s => (
          <button 
            key={s}
            onClick={() => setFilter(s)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm border ${
              filter === s 
                ? "bg-[#2C6E91] text-white border-[#2C6E91]" 
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredApps.map(app => (
          <Link 
            to={`/application/${app.id}`} 
            key={app.id}
            className="flex flex-col p-5 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#2C6E91] font-bold text-xl shadow-sm">
                  {app.company.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-0.5">{app.company}</h3>
                  <p className="text-xs font-medium text-slate-500">{app.role}</p>
                </div>
              </div>
              <StatusBadge status={app.status} />
            </div>
            
            <div className="flex justify-between items-center text-xs font-medium text-slate-400 mt-2 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Applied:</span>
                {new Date(app.dateApplied).toLocaleDateString()}
              </div>
              {app.followUpDate && (
                <div className="flex items-center gap-1.5 text-rose-500 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 font-semibold">
                  Follow-up: {new Date(app.followUpDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </Link>
        ))}
        {filteredApps.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Filter size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No applications found</h3>
            <p className="text-sm font-medium text-slate-500">Try changing your filters or add a new one.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
