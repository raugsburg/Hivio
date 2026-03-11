import React from "react";
import { Link } from "react-router";
import { TrendingUp, Award, BarChart2 } from "lucide-react";
import { motion } from "motion/react";
import { useAppContext } from "../context/AppContext";

export function Analytics() {
  const { applications } = useAppContext();

  const total = applications.length;
  const statuses = applications.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen px-6 py-12 pt-16 bg-[#F7F9FC]"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytics</h1>
        <button className="w-10 h-10 bg-[#2C6E91]/10 text-[#2C6E91] rounded-full flex items-center justify-center shadow-sm hover:bg-[#2C6E91]/20 transition-colors">
          <TrendingUp size={20} />
        </button>
      </div>

      <div className="bg-[#2C6E91] rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <h3 className="text-sm font-semibold text-blue-100 uppercase tracking-wider mb-1">Total Applications</h3>
        <div className="text-5xl font-bold mb-4">{total}</div>
        <div className="flex items-center gap-2 text-sm font-medium bg-white/20 w-fit px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
          <TrendingUp size={16} /> +2 this week
        </div>
      </div>

      <h2 className="text-lg font-bold text-slate-900 mb-4">Status Breakdown</h2>
      
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { label: "Applied", value: statuses["Applied"] || 0, color: "bg-blue-50 text-[#2C6E91] border-blue-100", bar: "bg-[#2C6E91]" },
          { label: "Interview", value: statuses["Interview"] || 0, color: "bg-purple-50 text-purple-700 border-purple-100", bar: "bg-purple-500" },
          { label: "Offer", value: statuses["Offer"] || 0, color: "bg-emerald-50 text-emerald-700 border-emerald-100", bar: "bg-emerald-500" },
          { label: "Rejected", value: statuses["Rejected"] || 0, color: "bg-slate-50 text-slate-600 border-slate-200", bar: "bg-slate-400" },
        ].map(stat => (
          <div key={stat.label} className={`p-4 rounded-2xl border ${stat.color} flex flex-col shadow-sm relative overflow-hidden group`}>
            <span className="text-2xl font-bold mb-1 z-10">{stat.value}</span>
            <span className="text-xs font-semibold uppercase tracking-wider z-10">{stat.label}</span>
            <div className={`absolute bottom-0 left-0 h-1 w-full opacity-20 ${stat.bar}`} />
            <div 
              className={`absolute bottom-0 left-0 h-1 ${stat.bar} transition-all duration-1000 ease-out`} 
              style={{ width: `${total ? (stat.value / total) * 100 : 0}%` }} 
            />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-6 flex flex-col items-center justify-center min-h-[160px] text-center">
        <div className="w-12 h-12 bg-[#2C6E91]/10 rounded-full flex items-center justify-center text-[#2C6E91] mb-3">
          <Award size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Keep it up!</h3>
        <p className="text-sm font-medium text-slate-500 max-w-[200px]">You're applying consistently. Consistency is key.</p>
      </div>

    </motion.div>
  );
}
