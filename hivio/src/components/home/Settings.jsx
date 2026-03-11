import React from 'react';

function Settings({ user, onLogout }) {
  return (
    <div className="flex flex-col px-5 py-6 bg-[#F7F9FC]">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Settings</h1>

      {/* User card */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center gap-4 mb-6">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#2C6E91] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-900">{user.name}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>
          {user.profile && (
            <p className="text-xs text-slate-400 mt-0.5">{user.profile.school} · {user.profile.gradYear}</p>
          )}
        </div>
      </div>

      {/* Menu items */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 divide-y divide-slate-50 mb-6">
        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-t-2xl min-h-[44px]">
          <span className="font-semibold text-slate-700">Account Details</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors min-h-[44px]">
          <span className="font-semibold text-slate-700">Notifications</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-b-2xl min-h-[44px]">
          <span className="font-semibold text-slate-700">Appearance</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Light</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3.5 rounded-xl transition-colors min-h-[44px]"
      >
        Sign Out
      </button>
    </div>
  );
}

export default Settings;