import React from 'react';

function Applications({ user }) {
  return (
    <div className="flex flex-col px-5 py-6 bg-[#F7F9FC]">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Applications</h1>
      <p className="text-sm text-slate-500 font-medium mb-6">Track every job you've applied to.</p>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 mb-4 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-500 mb-4">No applications yet.</p>
        <button className="bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-colors min-h-[44px]">
          + Add Application
        </button>
      </div>
    </div>
  );
}

export default Applications;