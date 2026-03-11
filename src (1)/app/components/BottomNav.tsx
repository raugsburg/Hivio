import React from "react";
import { NavLink } from "react-router";
import { Home, Briefcase, FileText, PieChart, Settings } from "lucide-react";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe pb-4 pt-3 px-6 rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.04)] z-50">
      <div className="flex justify-between items-center max-w-md mx-auto relative">
        <NavItem to="/dashboard" icon={<Home size={22} />} label="Home" />
        <NavItem to="/applications" icon={<Briefcase size={22} />} label="Applications" />
        <NavItem to="/resumes" icon={<FileText size={22} />} label="Resumes" />
        <NavItem to="/analytics" icon={<PieChart size={22} />} label="Analytics" />
        <NavItem to="/settings" icon={<Settings size={22} />} label="Settings" />
      </div>
    </nav>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 transition-all duration-200 ${
          isActive ? "text-[#2C6E91] font-medium" : "text-slate-400 hover:text-slate-600"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`${isActive ? "bg-blue-50 text-[#2C6E91] rounded-full p-2.5 -mt-2" : "p-1"}`}>
            {icon}
          </div>
          <span className={`text-[10px] ${isActive ? "font-semibold" : ""}`}>{label}</span>
        </>
      )}
    </NavLink>
  );
}
