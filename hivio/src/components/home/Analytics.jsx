import React, { useEffect, useMemo, useState } from 'react';

function getApplicationsStorageKey(user) {
  const email = user?.email || 'anonymous';
  return `hivio_applications_${email.toLowerCase()}`;
}

function getResumesStorageKey(user) {
  const email = user?.email || 'anonymous';
  return `hivio_resumes_${email.toLowerCase()}`;
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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatPct(n) {
  if (!Number.isFinite(n)) return '0%';
  return `${Math.round(n * 100)}%`;
}

/* Simple donut chart using SVG stroke-dasharray.
   - clean look
   - consistent palette
   - no chart library dependency
*/
function DonutChart({
  size = 140,
  thickness = 14,
  segments = [],
  centerLabel = '',
  centerSubLabel = '',
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0);
  const safeTotal = total > 0 ? total : 1;

  let offset = 0;

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#EEF2F7"
            strokeWidth={thickness}
          />

          {segments.map((seg) => {
            const value = seg.value || 0;
            const dash = (value / safeTotal) * circumference;
            const gap = circumference - dash;

            const el = (
              <circle
                key={seg.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
              />
            );

            offset += dash;
            return el;
          })}
        </g>

        <text
          x="50%"
          y="49%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-slate-900"
          style={{ fontSize: 18, fontWeight: 800 }}
        >
          {centerLabel}
        </text>

        <text
          x="50%"
          y="62%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-slate-400"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          {centerSubLabel}
        </text>
      </svg>
    </div>
  );
}

function Analytics({ user }) {
  const appsKey = useMemo(() => getApplicationsStorageKey(user), [user]);
  const resumesKey = useMemo(() => getResumesStorageKey(user), [user]);

  const [apps, setApps] = useState([]);
  const [resumes, setResumes] = useState([]);

  useEffect(() => {
    setApps(safeReadJSON(appsKey, []));
    setResumes(safeReadJSON(resumesKey, []));
  }, [appsKey, resumesKey]);

  /* Exclude archived from analytics by default */
  const activeApps = apps.filter((a) => !a.archived);

  const totals = activeApps.reduce(
    (acc, a) => {
      const s = a.status || 'Applied';
      acc.total += 1;
      acc.byStatus[s] = (acc.byStatus[s] || 0) + 1;
      return acc;
    },
    { total: 0, byStatus: {} }
  );

  const appliedCount = totals.byStatus.Applied || 0;
  const interviewCount = totals.byStatus.Interview || 0;
  const offerCount = totals.byStatus.Offer || 0;
  const rejectedCount = totals.byStatus.Rejected || 0;

  const total = totals.total || 0;
  const interviewRate = total ? interviewCount / total : 0;
  const offerRate = total ? offerCount / total : 0;

  const todayKey = startOfDayISO(new Date());
  const todayStart = new Date(`${todayKey}T00:00:00`);

  const followUpsDue7 = activeApps
    .filter((a) => isValidDateStringYYYYMMDD(a.followUpDate))
    .map((a) => ({ ...a, f: new Date(`${a.followUpDate}T00:00:00`) }))
    .filter((a) => a.f >= todayStart)
    .filter((a) => {
      const d = a.f;
      const limit = new Date(todayStart);
      limit.setDate(limit.getDate() + 7);
      return d <= limit;
    }).length;

  const donutSegments = [
    { id: 'Applied', label: 'Applied', value: appliedCount, color: '#2C6E91' },
    { id: 'Interview', label: 'Interview', value: interviewCount, color: '#7C3AED' },
    { id: 'Offer', label: 'Offer', value: offerCount, color: '#059669' },
    { id: 'Rejected', label: 'Rejected', value: rejectedCount, color: '#64748B' },
  ];

  /* Weekly activity (last 7 days) */
  const now = new Date();
  const last7 = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - idx));
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

  const weeklyValues = last7Keys.map((k) => activityByDay[k] || 0);
  const weeklyTotal = weeklyValues.reduce((x, y) => x + y, 0);
  const maxWeekly = Math.max(1, ...weeklyValues);

  /* Resume performance */
  const resumeById = Object.fromEntries(resumes.map((r) => [r.id, r]));
  const appsWithResume = activeApps.filter((a) => a.resumeId);

  const resumeStats = Object.values(
    appsWithResume.reduce((acc, a) => {
      const rid = a.resumeId;
      if (!rid) return acc;
      if (!acc[rid]) {
        acc[rid] = {
          resumeId: rid,
          label: resumeById[rid]?.label || resumeById[rid]?.fileName || 'Resume',
          applications: 0,
          interviews: 0,
          offers: 0,
        };
      }
      acc[rid].applications += 1;
      if (a.status === 'Interview') acc[rid].interviews += 1;
      if (a.status === 'Offer') acc[rid].offers += 1;
      return acc;
    }, {})
  )
    .map((s) => ({
      ...s,
      interviewRate: s.applications ? s.interviews / s.applications : 0,
    }))
    .sort((a, b) => {
      if (b.interviewRate !== a.interviewRate) return b.interviewRate - a.interviewRate;
      return b.applications - a.applications;
    });

  const bestResume =
    resumeStats.find((r) => r.applications >= 5) || resumeStats[0] || null;

  const insights = [];
  if (total >= 15 && interviewCount === 0) {
    insights.push({
      title: 'Low interview signal',
      body:
        'You have 15+ applications but no interviews yet. Consider iterating your resume and targeting roles that closely match your projects and skills.',
    });
  }
  if (bestResume && bestResume.applications >= 5 && bestResume.interviewRate > 0) {
    insights.push({
      title: 'Top performing resume',
      body: `${bestResume.label} has the strongest interview rate (${formatPct(
        bestResume.interviewRate
      )}) across ${bestResume.applications} applications.`,
    });
  }
  if (followUpsDue7 > 0) {
    insights.push({
      title: 'Follow-ups due soon',
      body: `You have ${followUpsDue7} follow-up${followUpsDue7 === 1 ? '' : 's'} due in the next 7 days.`,
    });
  }

  return (
    <div className="flex flex-col px-5 py-6 bg-[#F7F9FC]">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
        Analytics
      </h1>
      <p className="text-sm text-slate-500 font-medium mb-6">
        Insights on your job search progress.
      </p>

      {activeApps.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-500">
            Start adding applications to see your analytics.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <p className="text-xs font-semibold text-slate-500">Applications</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {total}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Active only
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <p className="text-xs font-semibold text-slate-500">Interview Rate</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatPct(interviewRate)}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Interview / Total
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <p className="text-xs font-semibold text-slate-500">Offer Rate</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatPct(offerRate)}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Offer / Total
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <p className="text-xs font-semibold text-slate-500">Follow-ups</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {followUpsDue7}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Due in 7 days
              </p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-700">Status Breakdown</h2>
                <p className="text-xs text-slate-400 mt-0.5">Active applications</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <DonutChart
                segments={donutSegments}
                centerLabel={`${total}`}
                centerSubLabel="Total"
              />

              <div className="flex-1 space-y-2">
                {donutSegments.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: s.color }}
                      />
                      <span className="text-xs font-semibold text-slate-600 truncate">
                        {s.label}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 tabular-nums">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-700">Weekly Activity</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {weeklyTotal} added in the last 7 days
                </p>
              </div>
            </div>

            <div className="flex items-end gap-2 h-28">
              {last7.map((d) => {
                const key = startOfDayISO(d);
                const value = activityByDay[key] || 0;
                const height = clamp(Math.round((value / maxWeekly) * 92), 8, 92);
                const label = d.toLocaleDateString(undefined, { weekday: 'short' });

                return (
                  <div key={key} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-lg"
                      style={{
                        height: `${height}px`,
                        background: value ? 'rgba(44,110,145,0.18)' : '#EEF2F7',
                        border: value ? '1px solid rgba(44,110,145,0.18)' : '1px solid #EEF2F7',
                      }}
                      title={`${label}: ${value}`}
                    />
                    <span className="text-[10px] font-medium text-slate-400">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resume Performance */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-700">Resume Performance</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Interviews by resume version
                </p>
              </div>
            </div>

            {resumeStats.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-semibold text-slate-700">
                  No resume-linked applications yet.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Link a resume in an application to see resume performance.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {resumeStats.slice(0, 5).map((r) => (
                  <div
                    key={r.resumeId}
                    className="border border-slate-100 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {r.label}
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {r.applications} apps • {r.interviews} interviews • {r.offers} offers
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-semibold">Interview rate</p>
                        <p className="text-lg font-extrabold text-slate-900 tabular-nums">
                          {formatPct(r.interviewRate)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {resumeStats.length > 5 ? (
                  <p className="text-xs text-slate-400 font-medium text-center pt-1">
                    Showing top 5 resumes by interview rate.
                  </p>
                ) : null}
              </div>
            )}
          </div>

          {/* Insights */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-slate-700">Insights</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Suggestions based on your data
              </p>
            </div>

            {insights.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm font-medium text-slate-500">
                  No insights yet.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Keep tracking applications and follow-ups to unlock recommendations.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {insights.slice(0, 3).map((i) => (
                  <div
                    key={i.title}
                    className="border border-slate-100 bg-slate-50 rounded-xl p-3"
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {i.title}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {i.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-4" />
        </div>
      )}
    </div>
  );
}

export default Analytics;