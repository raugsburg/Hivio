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
      return 'bg-blue-50 dark:bg-blue-500/10 text-[#2C6E91] border border-blue-100 dark:border-blue-500/20';
    case 'Interview':
      return 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-500/20';
    case 'Offer':
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20';
    case 'Rejected':
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700';
  }
}

function formatPct(n) {
  if (!Number.isFinite(n)) return '0%';
  return `${Math.round(n * 100)}%`;
}

function formatDayLabel(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function ActivityLineChart({ days, values }) {
  const width = 360;
  const height = 140;
  const padX = 14;
  const padY = 14;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const max = Math.max(1, ...values);

  const points = values.map((v, i) => {
    const x = padX + (i / Math.max(1, values.length - 1)) * innerW;
    const y = padY + innerH - (v / max) * innerH;
    return { x, y, v, day: formatDayLabel(days[i]) };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `M ${padX},${height - padY} L ${line} L ${width - padX},${height - padY} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(44,110,145,0.36)" />
            <stop offset="100%" stopColor="rgba(44,110,145,0.03)" />
          </linearGradient>
        </defs>

        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="rgba(148,163,184,0.35)" strokeWidth="1" />

        <path d={area} fill="url(#activityFill)" />
        <polyline fill="none" stroke="rgba(44,110,145,0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={line} />

        {points.map((p) => (
          <g key={`${p.day}-${p.x}`}>
            <circle cx={p.x} cy={p.y} r="3.7" fill="rgba(44,110,145,1)" />
            <circle cx={p.x} cy={p.y} r="2" fill="white" />
          </g>
        ))}
      </svg>

      <div className="grid grid-cols-7 gap-1 mt-1">
        {points.map((p) => (
          <div key={`${p.day}-label`} className="text-center">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">{p.day}</p>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-200">{p.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusDistribution({ total, items, onSelect }) {
  return (
    <div>
      <div className="h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        {items.map((item) => {
          const pct = total ? (item.value / total) * 100 : 0;
          return (
            <div
              key={item.id}
              className="h-full float-left"
              style={{ width: `${pct}%`, backgroundColor: item.color }}
              title={`${item.label}: ${item.value}`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="inline-flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-200 truncate">{item.label}</span>
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PipelineFunnel({ applied, interview, offer, onSelect }) {
  const max = Math.max(1, applied, interview, offer);
  const rows = [
    { id: 'Applied', label: 'Applied', value: applied, color: '#2C6E91' },
    { id: 'Interview', label: 'Interview', value: interview, color: '#0F766E' },
    { id: 'Offer', label: 'Offer', value: offer, color: '#D97706' },
  ];

  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const w = Math.max(18, Math.round((r.value / max) * 100));
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r.id)}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide">{r.label}</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.value}</p>
            </div>
            <div className="h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div
                className="h-full rounded-xl"
                style={{
                  width: `${w}%`,
                  background: `linear-gradient(90deg, ${r.color}CC 0%, ${r.color}99 100%)`,
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ResumeOutcomeDonut({ data }) {
  const size = 98;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;

  const segments = [
    { key: 'Interview', value: data.interviews, color: '#0F766E' },
    { key: 'Offer', value: data.offers, color: '#D97706' },
    { key: 'Rejected', value: data.rejected, color: '#7f1d1d' },
    { key: 'Applied', value: data.applied, color: '#2C6E91' },
  ];

  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.25)"
          strokeWidth={stroke}
        />

        {segments.map((seg) => {
          const dash = (seg.value / Math.max(1, data.applications)) * circ;
          const el = (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
      </g>

      <text
        x="50%"
        y="48%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-slate-900 dark:fill-slate-100"
        style={{ fontSize: 16, fontWeight: 800 }}
      >
        {data.applications}
      </text>
      <text
        x="50%"
        y="62%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-slate-400"
        style={{ fontSize: 10, fontWeight: 700 }}
      >
        Apps
      </text>
    </svg>
  );
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
  const interviewRate = counts.total ? Math.round((interviewsLanded / counts.total) * 100) : 0;
  const offerRate = counts.total ? Math.round((offerCount / counts.total) * 100) : 0;

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

  const resumeStats = Object.values(
    activeApps.reduce((acc, app) => {
      if (!app.resumeId) return acc;

      if (!acc[app.resumeId]) {
        acc[app.resumeId] = {
          resumeId: app.resumeId,
          label: resumeLabelById(app.resumeId),
          applications: 0,
          applied: 0,
          interviews: 0,
          offers: 0,
          rejected: 0,
        };
      }

      acc[app.resumeId].applications += 1;
      if (app.status === 'Applied') acc[app.resumeId].applied += 1;
      if (app.status === 'Interview') acc[app.resumeId].interviews += 1;
      if (app.status === 'Offer') acc[app.resumeId].offers += 1;
      if (app.status === 'Rejected') acc[app.resumeId].rejected += 1;
      return acc;
    }, {})
  )
    .map((r) => ({
      ...r,
      interviewRate: r.applications ? r.interviews / r.applications : 0,
      offerRate: r.applications ? r.offers / r.applications : 0,
    }))
    .sort((a, b) => {
      if (b.interviewRate !== a.interviewRate) return b.interviewRate - a.interviewRate;
      return b.applications - a.applications;
    });

  const resumeFeedback = resumeStats
    .filter((r) => r.applications >= 2)
    .map((r) => {
      if (r.interviewRate >= 0.35) {
        return `${r.label} is performing strongly with ${formatPct(r.interviewRate)} interview rate.`;
      }
      if (r.rejected >= Math.max(2, r.interviews + r.offers)) {
        return `${r.label} has high rejection volume. Consider revising summary, keywords, and bullets.`;
      }
      return `${r.label} has mixed signal. Keep testing and tailor this version to specific job posts.`;
    })
    .slice(0, 3);

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
    <div className="flex flex-col px-5 py-6 pb-3 bg-[#F7F9FC] dark:bg-slate-950">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-950 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#2C6E91] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {(user.name || 'U')?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-[22px] leading-tight font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Hi, {firstName}
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">
              Your search control center.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl p-5 mb-4 border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-[#e8f4fb] via-[#f6fbff] to-[#fff7ef] dark:from-[#0f2430] dark:via-[#0f1a24] dark:to-[#2a1a10] shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Pipeline Snapshot</p>
            <p className="text-3xl leading-none font-black text-slate-900 dark:text-slate-100 mt-2">{counts.total}</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">Active applications</p>
          </div>
          <button
            type="button"
            onClick={() => navigateToApplicationsWithStatus('All')}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300/70 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 transition-colors"
          >
            Open Pipeline
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-3">
            <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">Applied</p>
            <p className="text-lg font-black text-[#2C6E91] mt-1">{appliedCount}</p>
          </div>
          <div className="rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-3">
            <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">Interview Rate</p>
            <p className="text-lg font-black text-teal-700 dark:text-teal-300 mt-1">{interviewRate}%</p>
          </div>
          <div className="rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-3">
            <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">Offer Rate</p>
            <p className="text-lg font-black text-amber-700 dark:text-amber-300 mt-1">{offerRate}%</p>
          </div>
        </div>
      </div>

      {widgets.statusBreakdown && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-extrabold tracking-wide text-slate-700 dark:text-slate-200 uppercase">
                Status Distribution
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click a segment to filter your applications list.
              </p>
            </div>
          </div>

          <StatusDistribution
            total={counts.total}
            onSelect={navigateToApplicationsWithStatus}
            items={[
              { id: 'Applied', label: 'Applied', value: appliedCount, color: '#2C6E91' },
              { id: 'Interview', label: 'Interview', value: interviewCount, color: '#0F766E' },
              { id: 'Offer', label: 'Offer', value: offerCount, color: '#D97706' },
              { id: 'Rejected', label: 'Rejected', value: rejectedCount, color: '#64748B' },
            ]}
          />
        </div>
      )}

      {widgets.interviewsLanded && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-sm font-extrabold tracking-wide text-slate-700 dark:text-slate-200 uppercase">
                Pipeline Funnel
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ratio from applied to interview to offer.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800/60">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Interviews Landed</p>
              <p className="text-lg font-black text-teal-700 dark:text-teal-300 leading-none mt-1">{interviewsLanded}</p>
            </div>
          </div>

          <PipelineFunnel
            applied={Math.max(1, appliedCount)}
            interview={interviewCount}
            offer={offerCount}
            onSelect={navigateToApplicationsWithStatus}
          />
        </div>
      )}

      {widgets.weeklyActivity && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-extrabold tracking-wide text-slate-700 dark:text-slate-200 uppercase">
                Weekly Activity
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                New applications in the last 7 days.
              </p>
            </div>
          </div>

          <ActivityLineChart days={last7} values={activityValues} />

          {activityValues.reduce((a, b) => a + b, 0) === 0 && (
            <p className="text-xs text-slate-400 mt-3 text-center">
              No activity yet — start applying!
            </p>
          )}
        </div>
      )}

      {widgets.interviewsLanded && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 mb-4">
          <div className="mb-3">
            <h2 className="text-sm font-extrabold tracking-wide text-slate-700 dark:text-slate-200 uppercase">
              Resume Performance Insights
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare resume outcomes across interviews, offers, and rejections.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Outcome Graph</p>
              {resumeStats.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-300">No resume-linked apps yet.</p>
              ) : (
                <div className="space-y-3">
                  {resumeStats.slice(0, 3).map((r) => (
                    <div key={r.resumeId} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                      <div className="flex items-center gap-3">
                        <ResumeOutcomeDonut data={r} />

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{r.label}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">
                            {r.applications} apps • {formatPct(r.interviewRate)} interview rate
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300">Int {r.interviews}</span>
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300">Off {r.offers}</span>
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300">Rej {r.rejected}</span>
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#2C6E91]">App {r.applied}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {resumeFeedback.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Feedback</p>
                <div className="space-y-2">
                  {resumeFeedback.map((text) => (
                    <div key={text} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                        Resume guidance
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {widgets.upcomingTasks && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Upcoming Follow-ups
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Next actions you’ve scheduled
              </p>
            </div>

            <button
              type="button"
              onClick={navigateToApplicationsFollowUps}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              View all
            </button>
          </div>

          {upcomingFollowups.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-500 mb-2 border border-slate-200 dark:border-slate-700">
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
                  className="flex items-start justify-between gap-3 border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {a.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-300 font-medium truncate mt-0.5">
                      {a.company}
                      {a.resumeId ? ` • ${resumeLabelById(a.resumeId)}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">
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
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Open
            </button>
          </div>

          {recentApps.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-500 mb-2 border border-slate-200 dark:border-slate-700">
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
                  className="flex items-start justify-between gap-3 border border-slate-100 dark:border-slate-800 rounded-xl p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {a.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-300 font-medium truncate mt-0.5">
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