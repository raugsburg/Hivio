import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getApplicationsIntentKey, getDismissedStaleKey, safeReadJSON, safeWriteJSON } from '../../utils/storage';
import { subscribeApplications, subscribeResumes } from '../../utils/db';
import { DEFAULT_DASHBOARD_ORDER } from '../../data/constants';
import { startOfDayISO, isValidDateStringYYYYMMDD } from '../../utils/dateUtils';

const WEEKLY_GOAL = 5;

function statusBadgeClasses(status) {
  switch (status) {
    case 'Applied':
      return 'bg-hivio-status-applied-bg text-hivio-status-applied border border-hivio-status-applied/20 dark:bg-hivio-status-applied-bg-dark dark:text-white dark:border-hivio-status-applied-dark/20';
    case 'Interview':
      return 'bg-hivio-status-interview-bg text-hivio-status-interview border border-hivio-status-interview/20 dark:bg-hivio-status-interview-bg-dark dark:text-white dark:border-hivio-status-interview-dark/20';
    case 'Offer':
      return 'bg-hivio-status-offer-bg text-hivio-status-offer border border-hivio-status-offer/20 dark:bg-hivio-status-offer-bg-dark dark:text-white dark:border-hivio-status-offer-dark/20';
    case 'Rejected':
      return 'bg-hivio-status-rejected-bg text-hivio-status-rejected border border-hivio-status-rejected/20 dark:bg-hivio-status-rejected-bg-dark dark:text-white dark:border-hivio-status-rejected-dark/20';
    default:
      return 'bg-hivio-status-ghosted-bg text-hivio-status-ghosted border border-hivio-status-ghosted/20';
  }
}

function formatPct(n) {
  if (!Number.isFinite(n)) return '0%';
  return `${Math.round(n * 100)}%`;
}

function formatDayLabel(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function formatRelativeDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function ActivityBarChart({ days, values }) {
  const max = Math.max(1, ...values);

  return (
    <div className="flex items-flex-end gap-1.5" style={{ height: 110 }}>
      {values.map((v, i) => {
        const barH = v === 0 ? 6 : Math.round((v / max) * 72) + 10;
        const day = formatDayLabel(days[i]);
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
            <p className={`text-[10px] font-semibold ${v > 0 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}`}>
              {v > 0 ? v : '—'}
            </p>
            <div
              className="w-full rounded-md"
              style={{
                height: barH,
                background: v === 0 ? 'rgba(148,163,184,0.15)' : 'rgba(99,102,241,0.35)',
              }}
            />
            <p className="text-[9px] font-medium text-slate-400 uppercase">{day}</p>
          </div>
        );
      })}
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
              className="flex items-center justify-between gap-2 rounded-md border border-hivio-border dark:border-hivio-border-dark px-3 py-2.5 bg-hivio-surface dark:bg-hivio-surface-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 text-left"
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

function ApplicationFunnel({ total, interviewed, offer, rejected, onSelect }) {
  const rows = [
    { id: 'All', label: 'Total Applied', value: total, color: '#6366F1' },
    { id: 'Interview', label: 'Got Interview', value: interviewed, color: '#0F766E' },
    { id: 'Offer', label: 'Got Offer', value: offer, color: '#D97706' },
    { id: 'Rejected', label: 'Rejected', value: rejected, color: '#ef4444' },
  ];
  // Scale all bars relative to total so proportions are honest
  const max = Math.max(1, total);

  return (
    <div>
      {rows.map((r, i) => {
        const pct = Math.round((r.value / max) * 100);
        const prev = rows[i - 1];
        const convRate = r.id === 'Rejected'
          ? (total > 0 ? Math.round((r.value / total) * 100) : null)
          : (prev && prev.value > 0 ? Math.round((r.value / prev.value) * 100) : null);
        const connectorLabels = {
          Interview: `${convRate}% got interviews`,
          Offer: `${convRate}% got offers`,
          Rejected: `${convRate}% of total rejected`,
        };
        const connectorLabel = connectorLabels[r.id] || `${convRate}%`;

        return (
          <div key={r.id}>
            {convRate !== null && (
              <div className="flex items-center gap-1.5 px-1 py-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600 flex-shrink-0">
                  <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
                </svg>
                <span className="text-[10px] font-semibold text-slate-400">{connectorLabel}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => onSelect(r.id)}
              className="w-full text-left rounded-md px-3 py-2.5 hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{r.label}</span>
                </div>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100">{r.value}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${r.value > 0 ? Math.max(pct, 3) : 0}%`, backgroundColor: r.color }}
                />
              </div>
            </button>
          </div>
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

function HealthBar({ label, score, max, color, detail }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300">{detail}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

const ROLE_PATTERNS = [
  { key: 'data', terms: ['data', 'analyst', 'analytics', 'scientist', 'science', 'business intelligence', 'bi '] },
  { key: 'engineering', terms: ['engineer', 'developer', 'software', 'backend', 'frontend', 'fullstack', 'full-stack', 'swe', 'programmer', 'devops', 'platform'] },
  { key: 'product', terms: ['product manager', 'product owner', ' pm', 'program manager', 'project manager'] },
  { key: 'design', terms: ['design', ' ux', ' ui ', 'user experience', 'user interface', 'visual'] },
  { key: 'marketing', terms: ['marketing', 'growth', 'seo', 'content', 'brand', 'social media'] },
  { key: 'finance', terms: ['finance', 'financial', 'accounting', 'accountant', 'actuar', 'investment'] },
];

function detectRoleCategories(apps) {
  const found = new Set();
  apps.forEach((a) => {
    const title = (' ' + (a.title || '') + ' ').toLowerCase();
    ROLE_PATTERNS.forEach(({ key, terms }) => {
      if (terms.some((t) => title.includes(t))) found.add(key);
    });
  });
  return found;
}

function getResumeDetail(r, linkedApps = []) {
  const rating = r.interviewRate >= 0.35 ? 'strong'
    : r.interviewRate >= 0.10 ? 'mixed'
    : 'low';

  const tips = [];

  // 1. Performance diagnosis
  if (rating === 'strong') {
    tips.push({
      label: 'Strong resume',
      detail: `${formatPct(r.interviewRate)} interview rate — this version is resonating. Keep using it for similar roles.`,
    });
  } else if (rating === 'mixed') {
    tips.push({
      label: 'Average performance',
      detail: 'Your interview rate is in the average range. Consider tailoring this resume more closely to each job description to push it higher.',
    });
  } else {
    tips.push({
      label: 'Low response rate',
      detail: `Only ${formatPct(r.interviewRate)} interview rate — this resume may not be passing initial screening. ATS keyword gaps or lack of tailoring are the most common causes.`,
    });
  }

  // Offer gap: interviews exist but no offers
  if (r.offers === 0 && r.interviews >= 2) {
    tips.push({
      label: 'Getting interviews but no offers yet',
      detail: 'Your resume is opening doors but conversion isn\'t there yet. Shift focus to interview prep — research companies, practice behaviorals, and prepare strong closing questions.',
    });
  }

  // High rejections with few interviews
  if (r.rejected >= 3 && r.interviews <= 1 && rating !== 'strong') {
    tips.push({
      label: 'High rejections with few interviews',
      detail: 'This pattern suggests the resume may not be passing initial screening. Review whether your experience level matches the roles and check for keyword mismatches.',
    });
  }

  // 2. Structural tips
  // Role diversity
  if (linkedApps.length >= 3) {
    const categories = detectRoleCategories(linkedApps);
    if (categories.size >= 2) {
      tips.push({
        label: 'Consider separate versions per role type',
        detail: 'This resume is being used across different role types. Tailored resumes get 7x more interviews than generic ones — create a dedicated version for each target role.',
      });
    }
  }

  // ATS tip for any sub-35% resume (if room)
  if (r.interviewRate < 0.35 && tips.length < 4) {
    tips.push({
      label: 'Mirror keywords from each job posting',
      detail: '75% of resumes are filtered out by ATS before a human reads them. Copy the exact skill and title keywords from job descriptions into your resume where they genuinely apply.',
    });
  }

  // 3. Sample size warning — always last
  if (r.applications < 5) {
    tips.push({
      label: 'Small sample size',
      detail: `Only ${r.applications} application${r.applications !== 1 ? 's' : ''} linked — feedback will sharpen as you add more. Results can swing significantly this early.`,
    });
  } else if (r.applications >= 10) {
    tips[0] = { ...tips[0], detail: tips[0].detail + ' (Based on 10+ applications — this feedback is reliable.)' };
  }

  return { rating, tips: tips.slice(0, 4) };
}

function Dashboard({ user, onTabChange, onOpenApp }) {
  const widgets = {
    pipelineHealth: true,
    weeklyActivity: true,
    applicationFunnel: true,
    resumePerformance: true,
    upcomingTasks: true,
    recentApps: true,
    rejectionRate: false,
    ...(user.dashboardWidgets || {}),
    // These widgets have been removed — always off regardless of saved prefs
    weeklyGoal: false,
    statusBreakdown: false,
  };

  const REMOVED_WIDGETS = ['weeklyGoal', 'statusBreakdown'];
  const dashboardOrder = (user.dashboardOrder || DEFAULT_DASHBOARD_ORDER).filter(
    (id) => !REMOVED_WIDGETS.includes(id)
  );

  const intentKey = useMemo(() => getApplicationsIntentKey(user?.uid), [user]);
  const dismissedStaleKey = useMemo(() => getDismissedStaleKey(user?.uid), [user]);

  const [apps, setApps] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [dismissedStaleIds, setDismissedStaleIds] = useState(() => safeReadJSON(dismissedStaleKey, []));
  const [resumeDetailId, setResumeDetailId] = useState(null);
  const [showHealthInfo, setShowHealthInfo] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubApps = subscribeApplications(user.uid, setApps);
    const unsubResumes = subscribeResumes(user.uid, setResumes);
    return () => { unsubApps(); unsubResumes(); };
  }, [user?.uid]);

  const weeklyGoalTarget = user?.weeklyGoalTarget ? Math.max(1, Number(user.weeklyGoalTarget)) : WEEKLY_GOAL;

  const today = new Date();
  const daysLeftInWeek = 7 - today.getDay();

  const {
    activeApps,
    counts,
    appliedCount,
    interviewCount,
    offerCount,
    rejectedCount,
    interviewsLanded,
    interviewRate,
    offerRate,
    last7,
    last7Keys,
    activityValues,
    overdueFollowups,
    upcomingFollowups,
    recentApps,
    resumeStats,
    thisWeekCount,
    lastWeekCount,
    velocityDelta,
    staleApps,
    followUpCoverage,
    healthScore,
    healthLabel,
    healthColor,
    healthActivity,
    healthConversion,
    healthCoverage,
    rollingWeeklyAvg,
  } = useMemo(() => {
    const now = new Date();
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

    const last7 = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(now);
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

    const activityValues = last7Keys.map((k) => activityByDay[k] || 0);

    const todayStart = new Date(startOfDayISO(now) + 'T00:00:00');
    const appsWithDates = activeApps
      .filter((a) => isValidDateStringYYYYMMDD(a.followUpDate))
      .map((a) => ({ ...a, followUpDateObj: new Date(`${a.followUpDate}T00:00:00`) }));

    const overdueFollowups = appsWithDates
      .filter((a) => a.followUpDateObj < todayStart)
      .sort((a, b) => a.followUpDateObj - b.followUpDateObj)
      .slice(0, 3);

    const upcomingFollowups = appsWithDates
      .filter((a) => a.followUpDateObj >= todayStart)
      .sort((a, b) => a.followUpDateObj - b.followUpDateObj)
      .slice(0, 3);

    function getResumeLabel(resumeId) {
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
            label: getResumeLabel(app.resumeId),
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

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(weekStart.getDate() - 7);

    const thisWeekCount = activeApps.filter(
      (a) => new Date(a.createdAt || a.date || 0) >= weekStart
    ).length;

    const lastWeekCount = activeApps.filter((a) => {
      const d = new Date(a.createdAt || a.date || 0);
      return d >= lastWeekStart && d < weekStart;
    }).length;

    const velocityDelta = thisWeekCount - lastWeekCount;

    // 4-week rolling average for activity score
    const fourWeeksAgo = new Date(weekStart);
    fourWeeksAgo.setDate(weekStart.getDate() - 28);
    const rollingCount = activeApps.filter(
      (a) => new Date(a.createdAt || a.date || 0) >= fourWeeksAgo
    ).length;
    const rollingWeeklyAvg = rollingCount / 4;

    const staleApps = activeApps.filter((a) => {
      if (a.status !== 'Applied' || a.followUpDate) return false;
      const ageDays = (Date.now() - new Date(a.createdAt || a.date || 0).getTime()) / 86400000;
      return ageDays > 14;
    });

    const appsNeedingCoverage = activeApps.filter(
      (a) => a.status === 'Applied' || a.status === 'Interview'
    );
    const followUpCoverage =
      appsNeedingCoverage.length > 0
        ? appsNeedingCoverage.filter((a) => a.followUpDate).length / appsNeedingCoverage.length
        : 0;

    // Health score (0–100): activity 35 + conversion 35 + follow-up coverage 30
    // Activity: based on 4-week rolling average vs user's weekly goal
    const healthActivity = Math.min(35, Math.round((rollingWeeklyAvg / weeklyGoalTarget) * 35));
    // Conversion: 8% interview rate = full score (new-grad benchmark: typical is 3–5%, strong is 8%+)
    const healthConversion =
      counts.total >= 3 ? Math.min(35, Math.round((interviewRate / 8) * 35)) : 0;
    const healthCoverage = Math.round(followUpCoverage * 30);
    const healthScore = healthActivity + healthConversion + healthCoverage;
    const healthLabel =
      healthScore >= 80 ? 'Strong' : healthScore >= 60 ? 'Active' : healthScore >= 40 ? 'Slow' : 'Stalled';
    const healthColor =
      healthScore >= 80 ? '#10B981' : healthScore >= 60 ? '#6366F1' : healthScore >= 40 ? '#F59E0B' : '#EF4444';

    return {
      activeApps,
      counts,
      appliedCount,
      interviewCount,
      offerCount,
      rejectedCount,
      interviewsLanded,
      interviewRate,
      offerRate,
      last7,
      last7Keys,
      activityValues,
      overdueFollowups,
      upcomingFollowups,
      recentApps,
      resumeStats,
      thisWeekCount,
      lastWeekCount,
      velocityDelta,
      staleApps,
      followUpCoverage,
      healthScore,
      healthLabel,
      healthColor,
      healthActivity,
      healthConversion,
      healthCoverage,
      rollingWeeklyAvg,
    };
  }, [apps, resumes, weeklyGoalTarget]);

  const resumeDetail = resumeDetailId ? resumeStats.find((r) => r.resumeId === resumeDetailId) ?? null : null;

  function resumeLabelById(resumeId) {
    if (!resumeId) return '';
    const r = resumes.find((x) => x.id === resumeId);
    return r ? r.label || r.fileName : 'Linked resume';
  }

  const firstName = user?.name?.split(' ')?.[0] || 'there';

  // ─────────────────────────────────────────────────────────────────────────

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
      { label: 'Applied', value: appliedCount, color: '#6366F1' },
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
        <td style="${td};color:#6366F1;font-weight:600">${a.status}</td>
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
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6366F1; padding-bottom: 16px; margin-bottom: 28px; }
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
      <div class="stat-box"><div class="stat-label">Total Active</div><div class="stat-value" style="color:#6366F1">${counts.total}</div></div>
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

  function navigateToApp(id) {
    if (typeof onOpenApp === 'function') onOpenApp(id);
  }

  return (
    <>
    <div className="flex flex-col px-5 pt-6 pb-6 bg-hivio-bg dark:bg-hivio-bg-dark">
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
              <div className="w-10 h-10 rounded-full bg-hivio-primary flex items-center justify-center text-hivio-text-inverse font-bold text-sm shadow-sm">
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
      </div>

      <div className="rounded-xl p-5 mb-4 border border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-surface dark:bg-hivio-surface-dark shadow-hivio-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Application Snapshot</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl leading-none font-black text-slate-900 dark:text-slate-100">{counts.total}</p>
              {velocityDelta !== 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-lg ${
                  velocityDelta > 0
                    ? 'bg-[#ecfdf5] text-[#166534] dark:bg-[#1e3a2f] dark:text-white'
                    : 'bg-[#eef1f8] text-[#5a6a8a] dark:bg-[#1a2535] dark:text-white'
                }`}>
                  {velocityDelta > 0 ? '+' : ''}{velocityDelta} this week
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">Total applications</p>
          </div>
          <button
            type="button"
            onClick={() => navigateToApplicationsWithStatus('All')}
            className="px-3 py-2 rounded-md text-xs font-medium border border-hivio-border dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150"
          >
            Open →
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-md bg-hivio-bg dark:bg-hivio-bg-dark border border-hivio-border dark:border-hivio-border-dark p-3">
            <p className="h-7 text-[10px] uppercase tracking-wide font-bold text-slate-400 leading-tight">Interview</p>
            <p className="text-lg font-black text-teal-700 dark:text-teal-300">{interviewRate}%</p>
          </div>
          <div className="rounded-md bg-hivio-bg dark:bg-hivio-bg-dark border border-hivio-border dark:border-hivio-border-dark p-3">
            <p className="h-7 text-[10px] uppercase tracking-wide font-bold text-slate-400 leading-tight">Offers</p>
            <p className="text-lg font-black text-amber-700 dark:text-amber-300">{offerCount}</p>
          </div>
          <div className="rounded-md bg-hivio-bg dark:bg-hivio-bg-dark border border-hivio-border dark:border-hivio-border-dark p-3">
            <p className="h-7 text-[10px] uppercase tracking-wide font-bold text-slate-400 leading-tight">This Week</p>
            <p className="text-lg font-black text-hivio-primary">
              {thisWeekCount}
              <span className="text-[11px] font-semibold text-slate-400"> / {weeklyGoalTarget}</span>
            </p>
          </div>
        </div>
      </div>

      {dashboardOrder.map((widgetId) => {
        if (widgetId === 'statusBreakdown' && widgets.statusBreakdown) {
          return (
            <div key="statusBreakdown" className="bg-hivio-surface dark:bg-hivio-surface-dark rounded-lg p-5 shadow-hivio border border-[#C4CDD6] dark:border-hivio-border-dark mb-4">
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
                  { id: 'Applied', label: 'Applied', value: appliedCount, color: '#6366F1' },
                  { id: 'Interview', label: 'Interview', value: interviewCount, color: '#0F766E' },
                  { id: 'Offer', label: 'Offer', value: offerCount, color: '#D97706' },
                  { id: 'Rejected', label: 'Rejected', value: rejectedCount, color: '#64748B' },
                ]}
              />
              {staleApps.length > 0 && staleApps.some((a) => !dismissedStaleIds.includes(a.id)) && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-md bg-hivio-status-interview-bg border border-hivio-status-interview/20">
                  <button
                    type="button"
                    onClick={() => navigateToApplicationsWithStatus('Applied')}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {staleApps.length} app{staleApps.length !== 1 ? 's' : ''} sitting in Applied for 14+ days — consider following up
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ids = staleApps.map((a) => a.id);
                      const next = [...new Set([...dismissedStaleIds, ...ids])];
                      setDismissedStaleIds(next);
                      safeWriteJSON(dismissedStaleKey, next);
                    }}
                    className="flex-shrink-0 text-amber-400 hover:text-amber-600 dark:hover:text-amber-200 transition-colors"
                    aria-label="Dismiss"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        }

        if (widgetId === 'applicationFunnel' && widgets.applicationFunnel) {
          return (
            <div key="applicationFunnel" className="bg-hivio-surface dark:bg-hivio-surface-dark rounded-lg p-5 shadow-hivio border border-[#C4CDD6] dark:border-hivio-border-dark mb-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-sm font-extrabold tracking-wide text-slate-700 dark:text-slate-200 uppercase">
                    Application Funnel
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ratio from applied to interview to offer.
                  </p>
                </div>
                <div className="rounded-md border border-hivio-border dark:border-hivio-border-dark px-3 py-2 bg-hivio-bg dark:bg-hivio-bg-dark">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Interviews Landed</p>
                  <p className="text-lg font-black text-teal-700 dark:text-teal-300 leading-none mt-1">{interviewsLanded}</p>
                </div>
              </div>
              <ApplicationFunnel
                total={counts.total}
                interviewed={interviewsLanded}
                offer={offerCount}
                rejected={rejectedCount}
                onSelect={navigateToApplicationsWithStatus}
              />
              {counts.total >= 5 && (
                <div className="mt-3 px-3 py-2 rounded-md bg-hivio-bg dark:bg-hivio-bg-dark border border-hivio-border dark:border-hivio-border-dark">
                  <span className={`text-xs font-bold block ${interviewRate >= 8 ? 'text-teal-600 dark:text-teal-300' : interviewRate >= 4 ? 'text-amber-600 dark:text-amber-300' : 'text-slate-500 dark:text-slate-300'}`}>
                    {interviewRate >= 8 ? 'Above average interview rate' : interviewRate >= 4 ? 'Near average interview rate' : 'Below average interview rate'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {interviewRate >= 8 ? 'You\'re outperforming the typical 3–5% new-grad rate.' : interviewRate >= 4 ? 'Typical new-grad rate is 3–5% — you\'re close.' : 'Typical new-grad rate is 3–5% — focus on tailoring.'}
                  </span>
                </div>
              )}
            </div>
          );
        }

        if (widgetId === 'weeklyActivity' && widgets.weeklyActivity) {
          return (
            <div key="weeklyActivity" className="bg-hivio-surface dark:bg-hivio-surface-dark rounded-lg p-5 shadow-hivio border border-[#C4CDD6] dark:border-hivio-border-dark mb-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-sm font-extrabold tracking-wide text-slate-700 dark:text-slate-200 uppercase">
                    Weekly Activity
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400">{thisWeekCount} applications this week</p>
                    {lastWeekCount > 0 && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        velocityDelta > 0 ? 'bg-[#ecfdf5] text-[#166534] dark:bg-[#1e3a2f] dark:text-white'
                        : velocityDelta < 0 ? 'bg-[#eef1f8] text-[#5a6a8a] dark:bg-[#1a2535] dark:text-white'
                        : 'text-slate-400'
                      }`}>
                        {velocityDelta > 0 ? '+' : ''}{velocityDelta} vs last week
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ActivityBarChart days={last7} values={activityValues} />
              {activityValues.reduce((a, b) => a + b, 0) === 0 && (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  No activity yet — start applying!
                </p>
              )}
            </div>
          );
        }

        if (widgetId === 'resumePerformance' && widgets.resumePerformance) {
          const ratingColor = {
            strong: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10',
            mixed: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
            low: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10',
          };
          const ratingLabel = { strong: 'Strong', mixed: 'Mixed', low: 'Needs work' };

          return (
            <div key="resumePerformance" className="bg-hivio-surface dark:bg-hivio-surface-dark rounded-lg p-5 shadow-hivio border border-[#C4CDD6] dark:border-hivio-border-dark mb-4">
              <div className="mb-3">
                <h2 className="text-sm font-extrabold tracking-wide text-slate-700 dark:text-slate-200 uppercase">
                  Resume Performance
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Tap a resume to see feedback and guidance.</p>
              </div>

              {resumeStats.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-300">No resume-linked apps yet.</p>
              ) : (
                <div className="space-y-2">
                  {resumeStats.map((r) => {
                    const { rating } = getResumeDetail(r, activeApps.filter((a) => a.resumeId === r.resumeId));
                    return (
                      <button
                        key={r.resumeId}
                        type="button"
                        onClick={() => setResumeDetailId(r.resumeId)}
                        className="w-full text-left rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 hover:border-hivio-border-focus transition-colors duration-150"
                      >
                        <div className="flex items-center gap-2.5">
                          <ResumeOutcomeDonut data={r} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight mb-0.5">{r.label}</p>
                            <p className="text-[11px] font-medium">
                              <span className={ratingColor[rating]}>{ratingLabel[rating]}</span>
                              <span className="text-slate-400"> • {formatPct(r.interviewRate)} int. rate</span>
                            </p>
                            <div className="grid grid-cols-3 mt-2">
                              {[
                                { label: 'Interviews', val: r.interviews, numCls: 'text-teal-600 dark:text-teal-400' },
                                { label: 'Offers', val: r.offers, numCls: 'text-amber-500 dark:text-amber-400' },
                                { label: 'Rejected', val: r.rejected, numCls: 'text-rose-500 dark:text-rose-400' },
                              ].map(({ label, val, numCls }) => (
                                <div key={label} className="flex flex-col items-center">
                                  <p className={`text-sm font-bold leading-tight ${numCls}`}>{val}</p>
                                  <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-slate-400">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        if (widgetId === 'upcomingTasks' && widgets.upcomingTasks) {
          const hasAny = overdueFollowups.length > 0 || upcomingFollowups.length > 0;
          return (
            <div key="upcomingTasks" className="bg-hivio-surface dark:bg-hivio-surface-dark rounded-lg p-5 shadow-hivio border border-[#C4CDD6] dark:border-hivio-border-dark mb-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Follow-ups</h2>
                    {overdueFollowups.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#3d2020] text-[#e87c7c]">
                        {overdueFollowups.length} overdue
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Scheduled actions across your applications</p>
                </div>
                <button
                  type="button"
                  onClick={navigateToApplicationsFollowUps}
                  className="px-3 py-2 rounded-md border border-hivio-border dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark text-xs font-medium hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 whitespace-nowrap flex-shrink-0"
                >
                  View all
                </button>
              </div>

              {!hasAny ? (
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-hivio-bg dark:bg-hivio-bg-dark flex items-center justify-center text-hivio-text-muted dark:text-hivio-text-muted-dark mb-2 border border-hivio-border dark:border-hivio-border-dark">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">No follow-ups scheduled yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Add a follow-up date in an application to see it here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {overdueFollowups.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#e87c7c] mb-1.5">Overdue</p>
                      <div className="space-y-2">
                        {overdueFollowups.map((a) => (
                          <button key={a.id} type="button" onClick={() => navigateToApp(a.id)} className="w-full text-left flex items-start justify-between gap-3 border border-[#5a2a2a] rounded-md p-3 bg-[#2a1515] dark:bg-[#2a1515] hover:opacity-80 transition-opacity duration-150">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-100 truncate">{a.title}</p>
                              <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{a.company}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-semibold text-[#e87c7c]">{formatRelativeDate(a.followUpDate)}</p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold mt-1 ${statusBadgeClasses(a.status)}`}>
                                {a.status}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {upcomingFollowups.length > 0 && (
                    <div>
                      {overdueFollowups.length > 0 && (
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Upcoming</p>
                      )}
                      <div className="space-y-2">
                        {upcomingFollowups.map((a) => (
                          <button key={a.id} type="button" onClick={() => navigateToApp(a.id)} className="w-full text-left flex items-start justify-between gap-3 border border-hivio-border dark:border-hivio-border-dark rounded-md p-3 bg-hivio-bg dark:bg-hivio-bg-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{a.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-300 font-medium truncate mt-0.5">
                                {a.company}{a.resumeId ? ` • ${resumeLabelById(a.resumeId)}` : ''}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{formatRelativeDate(a.followUpDate)}</p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-semibold mt-1 ${statusBadgeClasses(a.status)}`}>
                                {a.status}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        if (widgetId === 'recentApps' && widgets.recentApps) {
          return (
            <div key="recentApps" className="bg-hivio-surface dark:bg-hivio-surface-dark rounded-lg p-5 shadow-hivio border border-[#C4CDD6] dark:border-hivio-border-dark mb-4">
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
                  className="px-3 py-2 rounded-md border border-hivio-border dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark text-xs font-medium hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150"
                >
                  Open
                </button>
              </div>
              {recentApps.length === 0 ? (
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-hivio-bg dark:bg-hivio-bg-dark flex items-center justify-center text-hivio-text-muted dark:text-hivio-text-muted-dark mb-2 border border-hivio-border dark:border-hivio-border-dark">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">No applications yet. Add one to start tracking!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentApps.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => navigateToApp(a.id)}
                      className="w-full text-left flex items-start justify-between gap-3 border border-hivio-border dark:border-hivio-border-dark rounded-md p-3 hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150"
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
                        <p className="text-[11px] text-slate-400 font-medium mt-1">{formatRelativeDate(a.date)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (widgetId === 'pipelineHealth' && widgets.pipelineHealth) {
          const isEmpty = counts.total < 3;
          return (
            <div key="pipelineHealth" className="bg-hivio-surface dark:bg-hivio-surface-dark rounded-lg p-5 shadow-hivio border border-[#C4CDD6] dark:border-hivio-border-dark mb-4">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-extrabold tracking-wide text-slate-700 dark:text-slate-200 uppercase">Pipeline Health</h2>
                <button
                  type="button"
                  onClick={() => setShowHealthInfo((p) => !p)}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-black transition-colors duration-150 ${showHealthInfo ? 'border-hivio-primary text-hivio-primary' : 'border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-hivio-primary hover:text-hivio-primary'}`}
                >?</button>
              </div>
              {showHealthInfo && (
                <div className="mb-3 rounded-lg border border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-bg dark:bg-hivio-bg-dark p-3">
                  <p className="text-[11px] font-semibold text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1">How is this calculated?</p>
                  <p className="text-[11px] text-hivio-text-secondary dark:text-hivio-text-secondary-dark leading-relaxed">Score is based on 3 factors: <strong>Activity</strong> (apps this week), <strong>Conversion</strong> (interview rate), and <strong>Active Tracking</strong> (% of active apps with a scheduled follow-up).</p>
                </div>
              )}
              {isEmpty ? (
                <p className="text-xs text-slate-400">Add at least 3 applications to see your health score.</p>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl font-black leading-none" style={{ color: healthColor }}>{healthScore}</div>
                    <div>
                      <p className="text-base font-black" style={{ color: healthColor }}>{healthLabel}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">out of 100</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <HealthBar label="Activity" score={healthActivity} max={35} color="#6366F1"
                      detail={`${thisWeekCount} of ${weeklyGoalTarget} apps this week`} />
                    <HealthBar label="Conversion" score={healthConversion} max={35} color="#0F766E"
                      detail={`${interviewRate}% interview rate`} />
                    <HealthBar label="Active Tracking" score={healthCoverage} max={30} color="#D97706"
                      detail={`${Math.round(followUpCoverage * 100)}% of active apps covered`} />
                  </div>
                </>
              )}
            </div>
          );
        }

        if (widgetId === 'weeklyGoal' && widgets.weeklyGoal) {
          const overGoal = Math.max(0, thisWeekCount - weeklyGoalTarget);
          const dots = weeklyGoalTarget;
          const filled = Math.min(thisWeekCount, weeklyGoalTarget);
          const pct = Math.min(100, Math.round((thisWeekCount / weeklyGoalTarget) * 100));
          return (
            <div key="weeklyGoal" className="bg-hivio-surface dark:bg-hivio-surface-dark rounded-lg p-5 shadow-hivio border border-[#C4CDD6] dark:border-hivio-border-dark mb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-sm font-extrabold tracking-wide text-slate-700 dark:text-slate-200 uppercase">Weekly Goal</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {daysLeftInWeek === 7 ? 'Full week ahead' : `${daysLeftInWeek} day${daysLeftInWeek !== 1 ? 's' : ''} left this week`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{thisWeekCount}</span>
                  <span className="text-sm font-semibold text-slate-400"> / {weeklyGoalTarget}</span>
                  {overGoal > 0 && (
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300">+{overGoal} over goal!</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 mb-2">
                {Array.from({ length: dots }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2.5 rounded-full transition-all ${i < filled ? '' : 'bg-slate-100 dark:bg-slate-800'}`}
                    style={i < filled ? { backgroundColor: '#6366F1' } : undefined}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-slate-400">{pct}% complete</p>
                {velocityDelta !== 0 && lastWeekCount > 0 && (
                  <p className={`text-[10px] font-semibold ${velocityDelta > 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>
                    {velocityDelta > 0 ? '+' : ''}{velocityDelta} vs last week
                  </p>
                )}
              </div>
            </div>
          );
        }

        return null;
      })}

    </div>

    {resumeDetail && (() => {
      const frameEl = document.getElementById('phone-frame');
      if (!frameEl) return null;
      const { rating, tips } = getResumeDetail(resumeDetail, activeApps.filter((a) => a.resumeId === resumeDetail.resumeId));
      const sheetRatingColor = {
        strong: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10',
        mixed: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
        low: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10',
      };
      const sheetRatingLabel = { strong: 'Strong', mixed: 'Mixed', low: 'Needs work' };
      return createPortal(
        <div
          className="absolute inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setResumeDetailId(null)}
        >
          <div
            className="bg-hivio-bg dark:bg-hivio-bg-dark rounded-t-2xl overflow-y-auto scrollbar-hide"
            style={{ maxHeight: '82%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>

            <div className="px-5 pb-8 pt-2">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-hivio-text-primary dark:text-hivio-text-primary-dark leading-snug">{resumeDetail.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sheetRatingColor[rating]}`}>{sheetRatingLabel[rating]}</span>
                    <span className="text-[11px] text-hivio-text-muted dark:text-hivio-text-muted-dark">Resume Review</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setResumeDetailId(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-hivio-text-muted dark:text-hivio-text-muted-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors flex-shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: 'Applied', val: resumeDetail.applied, cls: 'bg-hivio-status-applied-bg text-hivio-status-applied dark:bg-hivio-status-applied-bg-dark dark:text-white' },
                  { label: 'Interview', val: resumeDetail.interviews, cls: 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300' },
                  { label: 'Offer', val: resumeDetail.offers, cls: 'bg-hivio-status-offer-bg text-hivio-status-offer dark:bg-hivio-status-offer-bg-dark dark:text-white' },
                  { label: 'Rejected', val: resumeDetail.rejected, cls: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300' },
                ].map(({ label, val, cls }) => (
                  <div key={label} className={`rounded-lg p-2.5 text-center ${cls}`}>
                    <p className="text-base font-bold">{val}</p>
                    <p className="text-[9px] font-semibold opacity-80 leading-tight mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Rate row */}
              <div className="flex gap-2 mb-5">
                <div className="flex-1 rounded-lg border border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-surface dark:bg-hivio-surface-dark p-3 text-center shadow-hivio-sm">
                  <p className="text-base font-bold text-hivio-text-primary dark:text-hivio-text-primary-dark">{formatPct(resumeDetail.interviewRate)}</p>
                  <p className="text-[10px] text-hivio-text-muted dark:text-hivio-text-muted-dark font-semibold">Interview rate</p>
                </div>
                <div className="flex-1 rounded-lg border border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-surface dark:bg-hivio-surface-dark p-3 text-center shadow-hivio-sm">
                  <p className="text-base font-bold text-hivio-text-primary dark:text-hivio-text-primary-dark">{formatPct(resumeDetail.offerRate)}</p>
                  <p className="text-[10px] text-hivio-text-muted dark:text-hivio-text-muted-dark font-semibold">Offer rate</p>
                </div>
              </div>

              {/* Guidance */}
              <p className="text-[11px] font-bold uppercase tracking-wide text-hivio-text-muted dark:text-hivio-text-muted-dark mb-2">Guidance</p>
              <div className="space-y-2">
                {tips.map((tip) => (
                  <div key={tip.label} className="rounded-xl border border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-surface dark:bg-hivio-surface-dark p-4 shadow-hivio-sm">
                    <p className="text-xs font-semibold text-hivio-text-primary dark:text-hivio-text-primary-dark">{tip.label}</p>
                    <p className="text-[11px] text-hivio-text-secondary dark:text-hivio-text-secondary-dark mt-1 leading-relaxed">{tip.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        frameEl
      );
    })()}
    </>
  );
}

export default Dashboard;