import React from 'react';

function Dashboard({ user }) {
  const widgets = user.dashboardWidgets || {
    statusBreakdown: true,
    weeklyActivity: true,
    interviewsLanded: true,
    upcomingTasks: true,
    recentApps: true,
    rejectionRate: false
  };

  return (
    <div className="flex flex-col px-5 py-6 pb-2 bg-[#F7F9FC]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#2C6E91] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Hi, {user.name?.split(' ')[0]}</h1>
            <p className="text-xs font-medium text-slate-500">Let's track your next big role.</p>
          </div>
        </div>
      </div>

      {/* Status Breakdown Widget */}
      {widgets.statusBreakdown && (
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Application Status</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-[#2C6E91]">0</div>
              <div className="text-[11px] font-semibold text-[#2C6E91]/70 uppercase tracking-wide mt-0.5">Applied</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-purple-700">0</div>
              <div className="text-[11px] font-semibold text-purple-600/70 uppercase tracking-wide mt-0.5">Interview</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-700">0</div>
              <div className="text-[11px] font-semibold text-emerald-600/70 uppercase tracking-wide mt-0.5">Offer</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-slate-600">0</div>
              <div className="text-[11px] font-semibold text-slate-500/70 uppercase tracking-wide mt-0.5">Rejected</div>
            </div>
          </div>
        </div>
      )}

      {/* Interviews Landed Widget */}
      {widgets.interviewsLanded && (
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-700">Interviews Landed</h2>
              <p className="text-xs text-slate-400 mt-0.5">Keep going, you've got this!</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
              <span className="text-2xl font-bold text-purple-700">0</span>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Activity Widget */}
      {widgets.weeklyActivity && (
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Weekly Activity</h2>
          <div className="flex items-end gap-2 h-24">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-slate-100 rounded-md min-h-[8px]" style={{ height: '8px' }} />
                <span className="text-[9px] font-medium text-slate-400">{day}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">No activity yet — start applying!</p>
        </div>
      )}

      {/* Upcoming Follow-ups Widget */}
      {widgets.upcomingTasks && (
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Upcoming Follow-ups</h2>
          <div className="flex flex-col items-center py-4 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p className="text-xs text-slate-400 font-medium">No upcoming tasks yet.</p>
          </div>
        </div>
      )}

      {/* Recent Applications Widget */}
      {widgets.recentApps && (
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Recent Applications</h2>
          <div className="flex flex-col items-center py-4 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <p className="text-xs text-slate-400 font-medium">No applications yet. Tap + to add one!</p>
          </div>
        </div>
      )}

      {/* Response Rate Widget */}
      {widgets.rejectionRate && (
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-700">Response Rate</h2>
              <p className="text-xs text-slate-400 mt-0.5">% of apps that got a reply</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <span className="text-lg font-bold text-emerald-700">—</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom padding for nav bar */}
      <div className="h-4" />
    </div>
  );
}

export default Dashboard;