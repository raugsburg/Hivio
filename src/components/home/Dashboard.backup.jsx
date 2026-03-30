import React, { useEffect, useMemo, useState } from 'react';
import { getApplicationsStorageKey, getApplicationsIntentKey, getResumesStorageKey, safeReadJSON } from '../../utils/storage';
import { DEFAULT_DASHBOARD_ORDER } from '../../data/constants';

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
  const width = 340;
  const height = 120;
  const padX = 8;
  const padY = 16;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const max = Math.max(1, ...values);

  const points = values.map((v, i) => ({
    x: padX + (i / Math.max(1, values.length - 1)) * innerW,
    y: padY + innerH - (v / max) * innerH,
    v,
    day: formatDayLabel(days[i]),
  }));

  // Smooth Catmull-Rom cubic bezier
  function smoothPath(pts) {
    if (pts.length < 2) return `M ${pts[0].x},${pts[0].y}`;
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const prev = pts[i - 1] || pts[i];
      const curr = pts[i];
      const next = pts[i + 1];
      const after = pts[i + 2] || pts[i + 1];
      const cp1x = curr.x + (next.x - prev.x) / 6;
      const cp1y = curr.y + (next.y - prev.y) / 6;
      const cp2x = next.x - (after.x - curr.x) / 6;
      const cp2y = next.y - (after.y - curr.y) / 6;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
    }
    return d;
  }

  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x},${height - padY} L ${points[0].x},${height - padY} Z`;
  const peakIdx = values.indexOf(Math.max(...values));

  // Subtle horizontal grid lines at 33% and 66%
  const gridYs = [0.33, 0.66].map((pct) => padY + innerH - pct * innerH);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 120 }}>
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(44,110,145,0.22)" />
            <stop offset="85%" stopColor="rgba(44,110,145,0.0)" />
          </linearGradient>
        </defs>

        {gridYs.map((y) => (
          <line key={y} x1={padX} y1={y} x2={width - padX} y2={y}
            stroke="rgba(148,163,184,0.15)" strokeWidth="1" strokeDasharray="3 4" />
        ))}
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY}
          stroke="rgba(148,163,184,0.25)" strokeWidth="1" />

        <path d={areaPath} fill="url(#activityFill)" />
        <path d={linePath} fill="none" stroke="#2C6E91" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={`pt-${i}`}>
            {i === peakIdx && p.v > 0 && (
              <circle cx={p.x} cy={p.y} r="8" fill="rgba(44,110,145,0.1)" />
            )}
            <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#2C6E91" strokeWidth="2" />
          </g>
        ))}
      </svg>

      <div className="grid grid-cols-7 mt-2">
        {points.map((p, i) => (
          <div key={`lbl-${i}`} className="flex flex-col items-center gap-0.5">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{p.day}</p>
            <p className={`text-[11px] font-bold ${p.v > 0 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}`}>
              {p.v > 0 ? p.v : '-'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusDistribution({ total, items, onSelect }) {
  const activeItems = items.filter((item) => item.value > 0);
  return (
    <div>
      {/* Segmented bar — flex, no float */}
      <div className="flex h-4 w-full rounded-full overflow-hidden gap-px bg-slate-100 dark:bg-slate-800">
        {activeItems.map((item) => {
          const pct = total ? (item.value / total) * 100 : 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="h-full transition-opacity hover:opacity-75 focus:outline-none"
              style={{ width: `${pct}%`, backgroundColor: item.color, minWidth: 4 }}
              title={`${item.label}: ${item.value} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {items.map((item) => {
          const pct = total ? Math.round((item.value / total) * 100) : 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-200 truncate">{item.label}</span>
              </span>
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.value}</span>
                <span className="text-[10px] font-semibold text-slate-400">{pct}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ApplicationFunnel({ applied, interview, offer, onSelect }) {
  const rows = [
    { id: 'Applied', label: 'Applied', value: applied, color: '#2C6E91' },
    { id: 'Interview', label: 'Interview', value: interview, color: '#0F766E' },
    { id: 'Offer', label: 'Offer', value: offer, color: '#D97706' },
  ];
  const max = Math.max(1, applied);

  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const widthPct = Math.max(10, Math.round((r.value / max) * 100));
        const prev = rows[i - 1];
        const convRate = prev && prev.value > 0 ? Math.round((r.value / prev.value) * 100) : null;
        const marginPct = (100 - widthPct) / 2;

        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r.id)}
            className="w-full text-left group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-16 flex-shrink-0">{r.label}</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.value}</span>
              {convRate !== null && (
                <span className="text-[10px] font-semibold text-slate-400 ml-auto">
                  {convRate}% conv.
                </span>
              )}
            </div>
            {/* Centered bar — no track, negative space creates the funnel shape */}
            <div className="h-7 flex items-center justify-center">
              <div
                className="h-full rounded-xl"
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(90deg, ${r.color}F0, ${r.color}B0)`,
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
  const size = 84;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const gapPx = 2.5;

  const segments = [
    { key: 'interviews', value: data.interviews, color: '#0F766E' },
    { key: 'offers', value: data.offers, color: '#D97706' },
    { key: 'rejected', value: data.rejected, color: '#ef4444' },
    { key: 'applied', value: data.applied, color: '#2C6E91' },
  ].filter((s) => s.value > 0);

  let currentOffset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={stroke} />
        {segments.map((seg) => {
          const segLen = (seg.value / Math.max(1, data.applications)) * circ;
          const dashLen = Math.max(0, segLen - gapPx);
          const el = (
            <circle key={seg.key}
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={seg.color} strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${dashLen} ${circ - dashLen}`}
              strokeDashoffset={-currentOffset}
            />
          );
          currentOffset += segLen;
          return el;
        })}
      </g>
      <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle"
        className="fill-slate-900 dark:fill-slate-100"
        style={{ fontSize: 15, fontWeight: 800 }}>
        {data.applications}
      </text>
      <text x="50%" y="63%" dominantBaseline="middle" textAnchor="middle"
        className="fill-slate-400"
        style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em' }}>
        APPS
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

  const dashboardOrder = user.dashboardOrder || DEFAULT_DASHBOARD_ORDER;

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

  function exportCSV() {
    if (activeApps.length === 0) return;

    function resumeLabel(resumeId) {
      if (!resumeId) return '';
      const r = resumes.find((x) => x.id === resumeId);
      return r ? r.label || r.fileName : '';
    }

    const headers = ['Company', 'Job Title', 'Status', 'Date Applied', 'Follow-up Date', 'Location', 'Resume', 'Notes'];
    const rows = activeApps.map((a) => [
      a.company || '', a.title || '', a.status || '', a.date || '',
      a.followUpDate || '', a.location || '', resumeLabel(a.resumeId), a.notes || '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hivio_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  }

  function exportPDF() {
    const isDark = document.documentElement.classList.contains('dark');
    const c = isDark ? {
      bg: '#0f172a', surface: '#1e293b', border: '#334155',
      text: '#f1f5f9', muted: '#94a3b8', subtle: '#475569',
      tableHead: '#1e293b', tableRow: '#0f172a',
    } : {
      bg: '#ffffff', surface: '#f8fafc', border: '#e2e8f0',
      text: '#1e293b', muted: '#64748b', subtle: '#94a3b8',
      tableHead: '#f1f5f9', tableRow: '#f8fafc',
    };
    const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const statusRows = [
      { label: 'Applied', value: appliedCount, color: '#2C6E91' },
      { label: 'Interview', value: interviewCount, color: '#0F766E' },
      { label: 'Offer', value: offerCount, color: '#D97706' },
      { label: 'Rejected', value: rejectedCount, color: '#64748B' },
    ];

    const td = `padding:8px 12px;border-bottom:1px solid ${c.border};font-size:13px;color:${c.text}`;

    const resumeRows = resumeStats.slice(0, 5).map((r) =>
      `<tr>
        <td style="${td}">${r.label}</td>
        <td style="${td};text-align:center">${r.applications}</td>
        <td style="${td};text-align:center;color:#0F766E">${r.interviews}</td>
        <td style="${td};text-align:center;color:#D97706">${r.offers}</td>
        <td style="${td};text-align:center">${formatPct(r.interviewRate)}</td>
      </tr>`
    ).join('');

    const recentRows = recentApps.map((a) =>
      `<tr>
        <td style="${td}">${a.company}</td>
        <td style="${td}">${a.title}</td>
        <td style="${td};color:#2C6E91;font-weight:600">${a.status}</td>
        <td style="${td};color:${c.muted}">${a.date || ''}</td>
      </tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Hivio Job Search Report — ${user.name || ''}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${c.text}; background: ${c.bg}; padding: 40px; }
    @media print { body { padding: 20px; } }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2C6E91; padding-bottom: 16px; margin-bottom: 28px; }
    .logo { font-size: 22px; font-weight: 900; color: #2C6E91; letter-spacing: -0.5px; }
    .meta { text-align: right; font-size: 12px; color: ${c.muted}; line-height: 1.8; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: ${c.subtle}; margin-bottom: 12px; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .stat-box { background: ${c.surface}; border: 1px solid ${c.border}; border-radius: 12px; padding: 14px 16px; }
    .stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${c.subtle}; letter-spacing: 0.08em; }
    .stat-value { font-size: 26px; font-weight: 900; margin-top: 4px; color: ${c.text}; }
    .status-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .status-box { border-radius: 10px; padding: 12px; text-align: center; background: ${c.surface}; border: 1px solid ${c.border}; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-bottom: 6px; }
    .status-count { font-size: 20px; font-weight: 900; }
    .status-name { font-size: 11px; color: ${c.muted}; font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; background: ${c.surface}; border: 1px solid ${c.border}; border-radius: 10px; overflow: hidden; }
    th { padding: 10px 12px; background: ${c.tableHead}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${c.muted}; text-align: left; border-bottom: 1px solid ${c.border}; }
    .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid ${c.border}; font-size: 11px; color: ${c.subtle}; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Hivio</div>
    <div class="meta">
      <strong style="color:${c.text}">${user.name || 'Job Seeker'}</strong><br/>
      ${user.email || ''}<br/>
      Generated ${date}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Application Snapshot</div>
    <div class="stat-grid">
      <div class="stat-box"><div class="stat-label">Total Active</div><div class="stat-value" style="color:#2C6E91">${counts.total}</div></div>
      <div class="stat-box"><div class="stat-label">Interview Rate</div><div class="stat-value" style="color:#0F766E">${interviewRate}%</div></div>
      <div class="stat-box"><div class="stat-label">Offer Rate</div><div class="stat-value" style="color:#D97706">${offerRate}%</div></div>
      <div class="stat-box"><div class="stat-label">Interviews Landed</div><div class="stat-value">${interviewsLanded}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Status Breakdown</div>
    <div class="status-grid">
      ${statusRows.map((s) => `
        <div class="status-box">
          <div><span class="status-dot" style="background:${s.color}"></span></div>
          <div class="status-count" style="color:${s.color}">${s.value}</div>
          <div class="status-name">${s.label}</div>
        </div>`).join('')}
    </div>
  </div>

  ${resumeStats.length > 0 ? `
  <div class="section">
    <div class="section-title">Resume Performance</div>
    <table>
      <thead><tr>
        <th>Resume</th><th style="text-align:center">Apps</th><th style="text-align:center">Interviews</th><th style="text-align:center">Offers</th><th style="text-align:center">Int. Rate</th>
      </tr></thead>
      <tbody>${resumeRows}</tbody>
    </table>
  </div>` : ''}

  ${recentApps.length > 0 ? `
  <div class="section">
    <div class="section-title">Recent Applications</div>
    <table>
      <thead><tr><th>Company</th><th>Role</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>${recentRows}</tbody>
    </table>
  </div>` : ''}

  <div class="footer">Generated by Hivio &middot; Job Application Tracker</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
  }

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
    <div className="flex flex-col px-5 pt-6 pb-6 bg-[#F7F9FC] dark:bg-slate-950">
      <div className="mb-5">
        <div className="flex items-center justify-between gap-3">
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

          {counts.total > 0 && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={exportCSV}
                title="Export data as CSV"
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-[#2C6E91] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={exportPDF}
                title="Save report as PDF"
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-[#2C6E91] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl p-5 mb-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Application Snapshot</p>
            <p className="text-3xl leading-none font-black text-slate-900 dark:text-slate-100 mt-2">{counts.total}</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">Active applications</p>
          </div>
          <button
            type="button"
            onClick={() => navigateToApplicationsWithStatus('All')}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300/70 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 transition-colors"
          >
            Open Applications
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
            <p className="h-7 text-[10px] uppercase tracking-wide font-bold text-slate-400 leading-tight">Applied</p>
            <p className="text-lg font-black text-[#2C6E91]">{appliedCount}</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
            <p className="h-7 text-[10px] uppercase tracking-wide font-bold text-slate-400 leading-tight">Interview Rate</p>
            <p className="text-lg font-black text-teal-700 dark:text-teal-300">{interviewRate}%</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
            <p className="h-7 text-[10px] uppercase tracking-wide font-bold text-slate-400 leading-tight">Offer Rate</p>
            <p className="text-lg font-black text-amber-700 dark:text-amber-300">{offerRate}%</p>
          </div>
        </div>
      </div>

      {dashboardOrder.map((widgetId) => {
        if (widgetId === 'statusBreakdown' && widgets.statusBreakdown) {
          return (
            <div key="statusBreakdown" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-slate-300 dark:border-slate-800 mb-4">
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
          );
        }

        if (widgetId === 'applicationFunnel' && widgets.interviewsLanded) {
          return (
            <div key="applicationFunnel" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-slate-300 dark:border-slate-800 mb-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-sm font-extrabold tracking-wide text-slate-700 dark:text-slate-200 uppercase">
                    Application Funnel
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
              <ApplicationFunnel
                applied={Math.max(1, appliedCount)}
                interview={interviewCount}
                offer={offerCount}
                onSelect={navigateToApplicationsWithStatus}
              />
            </div>
          );
        }

        if (widgetId === 'weeklyActivity' && widgets.weeklyActivity) {
          return (
            <div key="weeklyActivity" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-slate-300 dark:border-slate-800 mb-4">
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
          );
        }

        if (widgetId === 'resumePerformance' && widgets.interviewsLanded) {
          return (
            <div key="resumePerformance" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-slate-300 dark:border-slate-800 mb-4">
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
                        <div key={r.resumeId} className="rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
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
                        <div key={text} className="rounded-xl border border-slate-300 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Resume guidance</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }

        if (widgetId === 'upcomingTasks' && widgets.upcomingTasks) {
          return (
            <div key="upcomingTasks" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-slate-300 dark:border-slate-800 mb-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Upcoming Follow-ups
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Next actions you've scheduled
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
                  <p className="text-xs text-slate-400 font-medium">No upcoming follow-ups yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Add a follow-up date in an application to see it here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingFollowups.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start justify-between gap-3 border border-slate-300 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{a.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300 font-medium truncate mt-0.5">
                          {a.company}{a.resumeId ? ` • ${resumeLabelById(a.resumeId)}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{a.followUpDate}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold mt-1 ${statusBadgeClasses(a.status)}`}>
                          {a.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (widgetId === 'recentApps' && widgets.recentApps) {
          return (
            <div key="recentApps" className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-slate-300 dark:border-slate-800 mb-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Recent Applications</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Latest updates from your active list</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    try { localStorage.setItem(intentKey, JSON.stringify({ status: 'All' })); } catch {}
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
                  <p className="text-xs text-slate-400 font-medium">No applications yet. Add one to start tracking!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentApps.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start justify-between gap-3 border border-slate-300 dark:border-slate-800 rounded-xl p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{a.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300 font-medium truncate mt-0.5">
                          {a.company}{a.location ? ` • ${a.location}` : ''}{a.resumeId ? ` • ${resumeLabelById(a.resumeId)}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold ${statusBadgeClasses(a.status)}`}>
                          {a.status}
                        </span>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">{a.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return null;
      })}

    </div>
  );
}

export default Dashboard;