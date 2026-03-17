import React from 'react';

function Resumes({ user }) {
  return (
    <div className="flex flex-col min-h-full px-5 py-6 bg-[#F7F9FC]">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Resumes</h1>
      <p className="text-sm text-slate-500 font-medium mb-6">Manage your resume versions.</p>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 mb-4 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-500 mb-4">No resumes uploaded yet.</p>
        <button className="bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-colors min-h-[44px]">
          Upload Resume
        </button>
      </div>
    </div>
  );
}

export default Resumes;