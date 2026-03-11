import React from "react";
import { Link, useParams, useNavigate } from "react-router";
import { ArrowLeft, Edit3, Trash2, ExternalLink, Calendar, MapPin, Building, FileText, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useAppContext } from "../context/AppContext";
import { StatusBadge } from "../components/StatusBadge";

export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { applications, deleteApplication, resumes } = useAppContext();
  
  const app = applications.find(a => a.id === id);

  if (!app) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-[#F7F9FC]">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Application not found</h2>
        <button onClick={() => navigate("/applications")} className="text-[#2C6E91] font-semibold">Back to Applications</button>
      </div>
    );
  }

  const linkedResume = resumes.find(r => r.id === app.resumeId);

  const handleDelete = () => {
    deleteApplication(app.id);
    navigate("/applications");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col min-h-screen pb-10 bg-[#F7F9FC] relative"
    >
      <header className="flex items-center justify-between px-6 pt-12 pb-6 bg-white border-b border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="flex gap-2 text-slate-400">
          <button className="p-2 hover:text-[#2C6E91] hover:bg-blue-50 rounded-full transition-all">
            <Edit3 size={20} />
          </button>
          <button onClick={handleDelete} className="p-2 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div className="px-6 py-8 flex flex-col items-center bg-white border-b border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] mb-6">
        <div className="w-20 h-20 rounded-2xl bg-[#F7F9FC] border-2 border-slate-100 flex items-center justify-center text-[#2C6E91] font-bold text-3xl shadow-sm mb-4">
          {app.company.charAt(0)}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">{app.company}</h1>
        <p className="text-base font-medium text-slate-500 mb-4">{app.role}</p>
        <StatusBadge status={app.status} className="px-4 py-1.5 text-xs" />
      </div>

      <div className="px-6 space-y-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-slate-400" /> Timeline
          </h3>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Date Applied</span>
            <span className="text-slate-900 font-semibold">{new Date(app.dateApplied).toLocaleDateString()}</span>
          </div>
          {app.followUpDate && (
            <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-50">
              <span className="text-slate-500 font-medium">Follow-up Due</span>
              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 font-semibold text-xs">
                {new Date(app.followUpDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {linkedResume && (
          <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <FileText size={16} className="text-slate-400" /> Linked Resume
            </h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                  <FileText size={16} />
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-900 truncate">{linkedResume.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{linkedResume.labels.join(", ")}</p>
                </div>
              </div>
              <button className="text-[#2C6E91] bg-blue-50 p-1.5 rounded-lg border border-blue-100 hover:bg-blue-100">
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Notes & Reminders</h3>
          {app.notes ? (
            <p className="text-sm text-slate-600 leading-relaxed font-medium">{app.notes}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No notes added.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
