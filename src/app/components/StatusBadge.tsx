import React from "react";
import { ApplicationStatus } from "../context/AppContext";

const statusConfig: Record<ApplicationStatus, { bg: string; text: string; dot: string }> = {
  Applied: { bg: "bg-blue-50", text: "text-[#2C6E91]", dot: "bg-[#2C6E91]" },
  Interview: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-600" },
  Rejected: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  Offer: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};

export function StatusBadge({ status, className = "" }: { status: ApplicationStatus; className?: string }) {
  const config = statusConfig[status];
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${config.bg} ${config.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </div>
  );
}
