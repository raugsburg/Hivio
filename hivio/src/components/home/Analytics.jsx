import React from 'react';

function Analytics({ user }) {
  return (
    <div className="flex flex-col px-5 py-6 bg-[#F7F9FC]">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Analytics</h1>
      <p className="text-sm text-slate-500 font-medium mb-6">Insights on your job search progress.</p>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 mb-4 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-500">Start adding applications to see your analytics.</p>
      </div>
    </div>
  );
}

export default Analytics;