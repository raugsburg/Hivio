import React from "react";
import { Link } from "react-router";
import { Plus, Bell, ChevronRight, Briefcase, FileCheck, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useAppContext } from "../context/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Dashboard() {
  const { user, applications } = useAppContext();
  
  const recentApps = applications.slice(0, 3);
  
  const stats = {
    total: applications.length,
    interviews: applications.filter(a => a.status === "Interview").length,
    due: applications.filter(a => a.followUpDate).length,
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen px-6 py-12 pt-16 bg-[#F7F9FC] relative"
    >
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <ImageWithFallback 
            src={user?.avatarUrl || ""} 
            alt="Profile" 
            className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Hi, {user?.name.split(" ")[0]}</h1>
            <p className="text-sm font-medium text-slate-500">Let's track your next big role.</p>
          </div>
        </div>
        <button className="relative p-2 text-slate-500 bg-white rounded-full shadow-sm border border-slate-100 hover:text-slate-800 transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
        </button>
      </header>

      {/* Quick Summary Cards */}
      {user?.dashboardPreferences?.showStats !== false && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-slate-900 mb-0.5">{stats.total}</div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Apps</div>
          </div>
          <div className="bg-[#2C6E91]/10 p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#2C6E91]/20 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-[#2C6E91] mb-0.5">{stats.interviews}</div>
            <div className="text-[10px] font-semibold text-[#2C6E91] uppercase tracking-wider">Interviews</div>
          </div>
          <div className="bg-rose-50 p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-rose-100 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-rose-600 mb-0.5">{stats.due}</div>
            <div className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">Follow-ups</div>
          </div>
        </div>
      )}

      {/* Quick Add Button */}
      <Link 
        to="/add-application" 
        className="flex items-center justify-center gap-2 w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mb-8"
      >
        <Plus size={20} />
        <span className="text-sm">Add New Application</span>
      </Link>

      {/* Recent Applications */}
      {user?.dashboardPreferences?.showRecent !== false && (
        <>
          <div className="mb-6 flex justify-between items-end">
            <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
            <Link to="/applications" className="text-sm font-semibold text-[#2C6E91] flex items-center gap-0.5">
              See All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="space-y-3 mb-8">
            {recentApps.map((app, i) => (
              <Link 
                to={`/application/${app.id}`} 
                key={app.id}
                className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#2C6E91] font-bold text-lg">
                    {app.company.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-0.5">{app.company}</h3>
                    <p className="text-xs font-medium text-slate-500">{app.role}</p>
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Upcoming Reminders */}
      {user?.dashboardPreferences?.showUpcoming !== false && (
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Upcoming Tasks</h2>
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex gap-4 items-start shadow-sm">
            <div className="bg-white p-2 rounded-xl shadow-sm text-emerald-600 mt-0.5">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Send follow-up email</h4>
              <p className="text-xs font-medium text-slate-600 mb-2">TechFlow - Junior Frontend Developer</p>
              <div className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-emerald-100 text-[10px] font-bold text-emerald-700">
                Due Tomorrow
              </div>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}
