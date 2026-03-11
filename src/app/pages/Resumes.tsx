import React, { useState } from "react";
import { Link } from "react-router";
import { Plus, FileText, Search, MoreVertical, UploadCloud, Tag } from "lucide-react";
import { motion } from "motion/react";
import { useAppContext } from "../context/AppContext";

export function Resumes() {
  const { resumes } = useAppContext();
  const [filter, setFilter] = useState("");

  const filteredResumes = resumes.filter(r => r.name.toLowerCase().includes(filter.toLowerCase()) || r.labels.some(l => l.toLowerCase().includes(filter.toLowerCase())));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen px-6 py-12 pt-16 bg-[#F7F9FC]"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Resumes</h1>
        <button className="w-10 h-10 bg-[#2C6E91] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#1a4a66] transition-colors">
          <UploadCloud size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search resumes or labels..." 
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] shadow-sm transition-all text-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredResumes.map(resume => (
          <motion.div 
            key={resume.id}
            whileHover={{ y: -2 }}
            className="flex flex-col p-4 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-all relative group cursor-pointer"
          >
            <div className="absolute top-3 right-2 p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg">
              <MoreVertical size={16} />
            </div>
            
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm mb-3">
              <FileText size={20} />
            </div>
            
            <h3 className="text-sm font-bold text-slate-900 mb-1 truncate pr-6">{resume.name}</h3>
            
            <div className="flex flex-wrap gap-1.5 mb-3 mt-1">
              {resume.labels.map(label => (
                <span key={label} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                  <Tag size={10} className="text-slate-400" />
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-auto pt-3 border-t border-slate-50">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Added {new Date(resume.dateAdded).toLocaleDateString()}</p>
            </div>
          </motion.div>
        ))}

        <motion.div 
          whileHover={{ scale: 0.98 }}
          className="flex flex-col p-4 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#2C6E91] hover:bg-blue-50/30 transition-all cursor-pointer items-center justify-center text-center gap-2 h-full min-h-[160px]"
        >
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#2C6E91] shadow-sm">
            <UploadCloud size={20} />
          </div>
          <span className="text-sm font-bold text-slate-600">Upload New</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
