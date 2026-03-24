import React, { useEffect, useMemo, useState } from 'react';

function getApplicationsStorageKey(user) {
  const email = user?.email || 'anonymous';
  return `hivio_applications_${email.toLowerCase()}`;
}

function getResumesStorageKey(user) {
  const email = user?.email || 'anonymous';
  return `hivio_resumes_${email.toLowerCase()}`;
}

function getApplicationsIntentKey(user) {
  const email = user?.email || 'anonymous';
  return `hivio_applications_intent_${email.toLowerCase()}`;
}

function safeReadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function startOfDayISO(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function isValidDateStringYYYYMMDD(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function statusBadgeClasses(status) {
  switch (status) {
    case 'Applied':
      return 'bg-blue-50 text-[#2C6E91] border border-blue-100';
    case 'Interview':
      return 'bg-purple-50 text-purple-700 border border-purple-100';
    case 'Offer':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    case 'Rejected':
      return 'bg-slate-100 text-slate-700 border border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

function Dashboard({ user, onTabChange }) {
  const widgets = user.dashboardWidgets || {
    statusBreakdown: true,
    weeklyActivity: true,
    interviewsLanded: true,
    upcomingTasks: true,
    recentApps: true,
    rejectionRate: false,
  };

  const appsKey = useMemo(() => getApplicationsStorageKey(user), [user]);
  const resumesKey = useMemo(() => getResumesStorageKey(user), [user]);
  const intentKey = useMemo(() => getApplicationsIntentKey(user), [user]);

  const [apps, setApps] = useState([]);
  const [resumes, setResumes] = useState([]);

  useEffect(() => {
    setApps(safeReadJSON(appsKey, []));
    setResumes(safeReadJSON(resumesKey, []));
  }, [appsKey, resumesKey]);

  const activeApps = apps.filter((a) => !a.archived);

  const counts = activeApps.reduce(
    (acc, a) => {
      const s = a.status || 'Applied';
      acc.total += 1;
      acc.byStatus[s] = (acc.byStatus[s] || 0) + 1;
      return acc;
    },
    { total: 0, byStatus: {} }
  );

  const appliedCount = counts.byStatus.Applied || 0;
  const interviewCount = counts.byStatus.Interview || 0;
  const offerCount = counts.byStatus.Offer || 0;
  const rejectedCount = counts.byStatus.Rejected || 0;

  const interviewsLanded = interviewCount + offerCount;

  const today = new Date();
  const last7 = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - idx));
    return d;
  });

  const last7Keys = last7.map((d) => startOfDayISO(d));
  const activityByDay = Object.fromEntries(last7Keys.map((k) => [k, 0]));

  activeApps.forEach((a) => {
    const raw = a.createdAt || a.date;
    if (!raw) return;
    const key = startOfDayISO(raw);
    if (activityByDay[key] !== undefined) activityByDay[key] += 1;
  });

  const activityValues = last7Keys.map((k) => activityByDay[k] || 0);
  const maxActivity = Math.max(1, ...activityValues);

  const upcomingFollowups = activeApps
    .filter((a) => isValidDateStringYYYYMMDD(a.followUpDate))
    .map((a) => ({
      ...a,
      followUpDateObj: new Date(`${a.followUpDate}T00:00:00`),
    }))
    .filter(
      (a) =>
        a.followUpDateObj >=
        new Date(startOfDayISO(new Date()) + 'T00:00:00')
    )
    .sort((a, b) => a.followUpDateObj - b.followUpDateObj)
    .slice(0, 3);

  function resumeLabelById(resumeId) {
    if (!resumeId) return '';
    const r = resumes.find((x) => x.id === resumeId);
    return r ? r.label || r.fileName : 'Linked resume';
  }

  const recentApps = [...activeApps]
    .sort((a, b) => {
      const da = new Date(a.createdAt || a.date || 0).getTime();
      const db = new Date(b.createdAt || b.date || 0).getTime();
      return db - da;
    })
    .slice(0, 4);

  const firstName = user?.name?.split(' ')?.[0] || 'there';

  function navigateToApplicationsWithStatus(status) {
    try {
      localStorage.setItem(intentKey, JSON.stringify({ status }));
    } catch {
      // ignore
    }
    if (typeof onTabChange === 'function') onTabChange('applications');
  }

  function navigateToApplicationsFollowUps() {
    try {
      localStorage.setItem(intentKey, JSON.stringify({ filter: 'followups' }));
    } catch {
      // ignore
    }
    if (typeof onTabChange === 'function') onTabChange('applications');
  }

  return (
    <div className="flex flex-col px-5 py-6 pb-2 bg-[#F7F9FC]">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#2C6E91] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {(user.name || 'U')?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Hi, {firstName}
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Here’s your job search snapshot.
            </p>
          </div>
        </div>
      </div>

      {widgets.statusBreakdown && (
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-700">
                Application Status
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Active applications: {counts.total}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigateToApplicationsWithStatus('Applied')}
              className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100 active:scale-[0.99] transition-transform"
            >
              <div className="text-2xl font-bold text-[#2C6E91]">
                {appliedCount}
              </div>
              <div className="text-[11px] font-semibold text-[#2C6E91]/70 uppercase tracking-wide mt-0.5">
                Applied
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigateToApplicationsWithStatus('Interview')}
              className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100 active:scale-[0.99] transition-transform"
            >
              <div className="text-2xl font-bold text-purple-700">
                {interviewCount}
              </div>
              <div className="text-[11px] font-semibold text-purple-600/70 uppercase tracking-wide mt-0.5">
                Interview
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigateToApplicationsWithStatus('Offer')}
              className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100 active:scale-[0.99] transition-transform"
            >
              <div className="text-2xl font-bold text-emerald-700">
                {offerCount}
              </div>
              <div className="text-[11px] font-semibold text-emerald-600/70 uppercase tracking-wide mt-0.5">
                Offer
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigateToApplicationsWithStatus('Rejected')}
              className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200 active:scale-[0.99] transition-transform"
            >
              <div className="text-2xl font-bold text-slate-600">
                {rejectedCount}
              </div>
              <div className="text-[11px] font-semibold text-slate-500/70 uppercase tracking-wide mt-0.5">
                Rejected
              </div>
            </button>
          </div>
        </div>
      )}

      {widgets.interviewsLanded && (
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-700">
                Interviews Landed
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Interview + Offer statuses
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100">
              <span className="text-2xl font-bold text-purple-700">
                {interviewsLanded}
              </span>
            </div>
          </div>
        </div>
      )}

      {widgets.weeklyActivity && (
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-700">
                Weekly Activity
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Applications added (last 7 days)
              </p>
            </div>
          </div>

          <div className="flex items-end gap-2 h-24">
            {last7.map((d) => {
              const key = startOfDayISO(d);
              const value = activityByDay[key] || 0;
              const height = Math.max(8, Math.round((value / maxActivity) * 80));
              const label = d.toLocaleDateString(undefined, { weekday: 'short' });

              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md"
                    style={{
                      height: `${height}px`,
                      background: value ? 'rgba(44,110,145,0.18)' : '#EEF2F7',
                      border: value
                        ? '1px solid rgba(44,110,145,0.18)'
                        : '1px solid #EEF2F7',
                    }}
                    title={`${label}: ${value}`}
                  />
                  <span className="text-[9px] font-medium text-slate-400">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {activityValues.reduce((a, b) => a + b, 0) === 0 && (
            <p className="text-xs text-slate-400 mt-3 text-center">
              No activity yet — start applying!
            </p>
          )}
        </div>
      )}

      {widgets.upcomingTasks && (
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-700">
                Upcoming Follow-ups
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Next actions you’ve scheduled
              </p>
            </div>

            <button
              type="button"
              onClick={navigateToApplicationsFollowUps}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              View all
            </button>
          </div>

          {upcomingFollowups.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2 border border-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                No upcoming follow-ups yet.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Add a follow-up date in an application to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingFollowups.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 border border-slate-100 rounded-xl p-3 bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {a.title}
                    </p>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {a.company}
                      {a.resumeId ? ` • ${resumeLabelById(a.resumeId)}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-700">
                      {a.followUpDate}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold mt-1 ${statusBadgeClasses(a.status)}`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {widgets.recentApps && (
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-700">
                Recent Applications
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest updates from your active list
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem(intentKey, JSON.stringify({ status: 'All' }));
                } catch {
                  // ignore
                }
                if (typeof onTabChange === 'function') onTabChange('applications');
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Open
            </button>
          </div>

          {recentApps.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2 border border-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                No applications yet. Add one to start tracking!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentApps.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 border border-slate-100 rounded-xl p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {a.title}
                    </p>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {a.company}
                      {a.location ? ` • ${a.location}` : ''}
                      {a.resumeId ? ` • ${resumeLabelById(a.resumeId)}` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold ${statusBadgeClasses(a.status)}`}
                    >
                      {a.status}
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      {a.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}

export default Dashboard;