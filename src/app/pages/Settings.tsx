import React from "react";
import { Link, useNavigate } from "react-router";
import { User, Moon, Bell, Shield, LogOut, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useAppContext } from "../context/AppContext";

export function Settings() {
  const navigate = useNavigate();
  const { user, setUser } = useAppContext();

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen px-6 py-12 pt-16 bg-[#F7F9FC]"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shadow-inner">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={32} />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900 mb-0.5">{user?.name}</h2>
          <p className="text-sm font-medium text-slate-500">{user?.email}</p>
        </div>
        <button className="p-2 text-slate-400 hover:text-[#2C6E91] hover:bg-blue-50 rounded-full transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="space-y-6 mb-8">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">Preferences</h3>
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 divide-y divide-slate-50">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-t-2xl group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-[#2C6E91] group-hover:bg-blue-50 transition-colors">
                  <User size={18} />
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-slate-900">Account Details</span>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-[#2C6E91]" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-[#2C6E91] group-hover:bg-blue-50 transition-colors">
                  <Bell size={18} />
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-slate-900">Notifications</span>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-[#2C6E91]" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-b-2xl group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-[#2C6E91] group-hover:bg-blue-50 transition-colors">
                  <Moon size={18} />
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-slate-900">Appearance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Light</span>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-[#2C6E91]" />
              </div>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">Support & Legal</h3>
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 divide-y divide-slate-50">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-t-2xl group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                  <Shield size={18} />
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-slate-900">Privacy Policy</span>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-600" />
            </button>
          </div>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold py-4 rounded-xl transition-colors border border-rose-100 shadow-sm mt-auto mb-6"
      >
        <LogOut size={18} /> Sign Out
      </button>

      <div className="text-center pb-8">
        <p className="text-xs font-semibold text-slate-400">Hivio Version 1.0.0</p>
      </div>
    </motion.div>
  );
}
