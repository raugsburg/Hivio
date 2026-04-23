import React, { useEffect, useMemo, useRef, useState } from 'react';
import AutocompleteInput from '../common/Autocompleteinput';
import { MN_SCHOOLS } from '../../data/schools-mn';
import { COMMON_MAJORS } from '../../data/majors';
import { careerInterests, dashboardWidgets, DEFAULT_DASHBOARD_WIDGETS, DEFAULT_DASHBOARD_ORDER, DASHBOARD_ORDER_LABELS } from '../../data/constants';
import { MAJOR_ABBREVIATIONS } from '../../data/majors';
import { SCHOOL_ABBREVIATIONS } from '../../data/schools-mn';
import { submitFeedback, saveUserProfile, subscribeResumes } from '../../utils/db';
import { getStoredTheme, storeTheme, applyThemeClass } from '../../utils/theme';


function normalizeText(s) {
  return (s || '').trim().replace(/\s+/g, ' ');
}

function FeedbackCard({ user }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (!rating) return;
    const entry = {
      id: `fb_${Date.now()}`,
      email: user?.email || 'anonymous',
      rating,
      comment: comment.trim(),
      submittedAt: new Date().toISOString(),
    };
    submitFeedback(entry).catch(() => {});
    setSubmitted(true);
    setTimeout(() => { setOpen(false); setSubmitted(false); setRating(0); setComment(''); }, 2000);
  }

  return (
    <div className="bg-hivio-surface dark:bg-hivio-surface-dark rounded-lg shadow-hivio border border-[#C4CDD6] dark:border-hivio-border-dark overflow-hidden mb-6">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between p-4 hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 min-h-[44px]"
      >
        <div>
          <p className="font-semibold text-hivio-text-primary dark:text-hivio-text-primary-dark text-left">Share Feedback</p>
          <p className="text-xs text-hivio-text-muted dark:text-hivio-text-muted-dark mt-0.5 text-left">Report a bug or share what's working</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-hivio-text-muted dark:text-hivio-text-muted-dark transition-transform ${open ? 'rotate-90' : ''}`}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#C4CDD6] dark:border-hivio-border-dark pt-4">
          {submitted ? (
            <div className="text-center py-4">
              <p className="text-sm font-bold text-hivio-status-offer">Thanks for your feedback!</p>
              <p className="text-xs text-hivio-text-muted dark:text-hivio-text-muted-dark mt-1">It helps us build a better experience.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-hivio-text-secondary dark:text-hivio-text-secondary-dark mb-2">How would you rate Hivio?</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110"
                      aria-label={`${star} star`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                        fill={(hovered || rating) >= star ? '#FBBF24' : 'none'}
                        stroke={(hovered || rating) >= star ? '#FBBF24' : '#CBD5E1'}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="text-xs font-medium text-hivio-text-muted dark:text-hivio-text-muted-dark ml-2">
                      {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                    </span>
                  )}
                </div>
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Any comments or suggestions? (optional)"
                rows={3}
                className="w-full bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 resize-none placeholder:text-hivio-text-muted"
              />

              <button
                type="button"
                onClick={submit}
                disabled={!rating}
                className="w-full bg-hivio-primary hover:bg-hivio-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-hivio-text-inverse font-medium py-2.5 rounded-md transition-colors duration-150 text-sm"
              >
                Submit Feedback
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Settings({ user, apps = [], onLogout, onUpdateUser, notificationsEnabled, onToggleNotifications, onTabChange }) {
  const [view, setView] = useState('main'); // main | account | dashboard
  const [resumes, setResumes] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeResumes(user.uid, setResumes);
    return () => unsub();
  }, [user?.uid]);

  function exportCSV() {
    const activeApps = apps.filter((a) => !a.archived);
    if (activeApps.length === 0) return;
    const resumeLabel = (id) => {
      const r = resumes.find((x) => x.id === id);
      return r ? r.label || r.fileName : '';
    };
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
      setExportFeedback({ msg: 'Exported successfully.', ok: true });
      setTimeout(() => setExportFeedback({ msg: '', ok: true }), 3000);
    } catch {
      setExportFeedback({ msg: 'Export failed. Please try again.', ok: false });
    }
  }

  function exportPDF() {
    const activeApps = apps.filter((a) => !a.archived);
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
    const total = activeApps.length;
    const interviewed = activeApps.filter((a) => a.status === 'Interview' || a.status === 'Offer').length;
    const offered = activeApps.filter((a) => a.status === 'Offer').length;
    const rejected = activeApps.filter((a) => a.status === 'Rejected').length;
    const applied = activeApps.filter((a) => a.status === 'Applied').length;
    const interviewRate = total > 0 ? Math.round((interviewed / total) * 100) : 0;
    const offerRate = total > 0 ? Math.round((offered / total) * 100) : 0;
    const recent = [...activeApps].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10);
    const td = `padding:8px 12px;border-bottom:1px solid ${c.border};font-size:13px;color:${c.text}`;
    const recentRows = recent.map((a) =>
      `<tr><td style="${td}">${a.company}</td><td style="${td}">${a.title}</td><td style="${td};color:#6366F1;font-weight:600">${a.status}</td><td style="${td};color:${c.muted}">${a.date || ''}</td></tr>`
    ).join('');
    const statusRows = [
      { label: 'Applied', value: applied, color: '#6366F1' },
      { label: 'Interview', value: interviewed, color: '#0F766E' },
      { label: 'Offer', value: offered, color: '#D97706' },
      { label: 'Rejected', value: rejected, color: '#64748B' },
    ];
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Hivio Job Search Report — ${user.name || ''}</title>
<style>
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:${c.text}; background:${c.bg}; padding:40px; }
@media print { body { padding:20px; } }
.header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #6366F1; padding-bottom:16px; margin-bottom:28px; }
.logo { font-size:22px; font-weight:900; color:#6366F1; letter-spacing:-0.5px; }
.meta { text-align:right; font-size:12px; color:${c.muted}; line-height:1.8; }
.section { margin-bottom:28px; }
.section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:${c.subtle}; margin-bottom:12px; }
.stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
.stat-box { background:${c.surface}; border:1px solid ${c.border}; border-radius:12px; padding:14px 16px; }
.stat-label { font-size:10px; font-weight:700; text-transform:uppercase; color:${c.subtle}; letter-spacing:0.08em; }
.stat-value { font-size:26px; font-weight:900; margin-top:4px; color:${c.text}; }
.status-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
.status-box { border-radius:10px; padding:12px; text-align:center; background:${c.surface}; border:1px solid ${c.border}; }
.status-dot { width:10px; height:10px; border-radius:50%; display:inline-block; margin-bottom:6px; }
.status-count { font-size:20px; font-weight:900; }
.status-name { font-size:11px; color:${c.muted}; font-weight:600; margin-top:2px; }
table { width:100%; border-collapse:collapse; background:${c.surface}; border:1px solid ${c.border}; border-radius:10px; overflow:hidden; }
th { padding:10px 12px; background:${c.tableHead}; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:${c.muted}; text-align:left; border-bottom:1px solid ${c.border}; }
.footer { margin-top:32px; padding-top:14px; border-top:1px solid ${c.border}; font-size:11px; color:${c.subtle}; text-align:center; }
</style></head><body>
<div class="header"><div class="logo">Hivio</div><div class="meta"><strong style="color:${c.text}">${user.name || 'Job Seeker'}</strong><br/>${user.email || ''}<br/>Generated ${date}</div></div>
<div class="section"><div class="section-title">Application Snapshot</div><div class="stat-grid">
<div class="stat-box"><div class="stat-label">Total Active</div><div class="stat-value" style="color:#6366F1">${total}</div></div>
<div class="stat-box"><div class="stat-label">Interview Rate</div><div class="stat-value" style="color:#0F766E">${interviewRate}%</div></div>
<div class="stat-box"><div class="stat-label">Offer Rate</div><div class="stat-value" style="color:#D97706">${offerRate}%</div></div>
<div class="stat-box"><div class="stat-label">Interviews Landed</div><div class="stat-value">${interviewed}</div></div>
</div></div>
<div class="section"><div class="section-title">Status Breakdown</div><div class="status-grid">
${statusRows.map((s) => `<div class="status-box"><div><span class="status-dot" style="background:${s.color}"></span></div><div class="status-count" style="color:${s.color}">${s.value}</div><div class="status-name">${s.label}</div></div>`).join('')}
</div></div>
${recent.length > 0 ? `<div class="section"><div class="section-title">Recent Applications</div><table><thead><tr><th>Company</th><th>Role</th><th>Status</th><th>Date</th></tr></thead><tbody>${recentRows}</tbody></table></div>` : ''}
<div class="footer">Generated by Hivio &middot; Job Application Tracker</div>
</body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
  }
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // ---- Dark mode state + helpers ----
  const [theme, setTheme] = useState(() => getStoredTheme());

  useEffect(() => {
    storeTheme(theme);
    applyThemeClass(theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  const gradYearOptions = useMemo(() => {
    const start = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 9; i++) years.push(String(start + i));
    return years;
  }, []);

  const initialForm = useMemo(() => {
    return {
      // account/basic
      firstName: user?.name ? user.name.split(' ')[0] : '',
      lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : '',
      avatarUrl: user?.avatarUrl || '',

      // profile (standardized like ProfileSetup)
      school: user?.profile?.school || '',
      major: user?.profile?.major || '',
      gradYear: user?.profile?.gradYear || '',
      interests: Array.isArray(user?.profile?.interests) ? user.profile.interests : [],

      // weekly application goal
      weeklyGoalTarget: user?.weeklyGoalTarget || 5,

      // dashboard widgets
      dashboardWidgets: user?.dashboardWidgets || { ...DEFAULT_DASHBOARD_WIDGETS },

      // dashboard widget order — merge saved order with defaults so newly-added widgets always appear
      dashboardOrder: (() => {
        const REMOVED = ['weeklyGoal', 'statusBreakdown'];
        const saved = Array.isArray(user?.dashboardOrder) ? [...user.dashboardOrder] : [...DEFAULT_DASHBOARD_ORDER];
        for (const id of DEFAULT_DASHBOARD_ORDER) {
          if (!saved.includes(id)) saved.push(id);
        }
        return saved.filter((id) => !REMOVED.includes(id));
      })()
    };
  }, [user]);

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [exportFeedback, setExportFeedback] = useState({ msg: '', ok: true });

  const photoInputRef = useRef(null);

  useEffect(() => {
    setForm(initialForm);
  }, [view]);

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [view]);

  const pageWrap = 'flex flex-col min-h-full px-5 py-6 bg-hivio-bg dark:bg-hivio-bg-dark';
  const card = 'bg-hivio-surface dark:bg-hivio-surface-dark rounded-lg shadow-hivio border border-[#C4CDD6] dark:border-hivio-border-dark';
  const title = 'text-hivio-text-primary dark:text-hivio-text-primary-dark';
  const subText = 'text-hivio-text-secondary dark:text-hivio-text-secondary-dark';
  const faintText = 'text-hivio-text-muted dark:text-hivio-text-muted-dark';
  const btnOutline = 'px-3 py-2 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark text-sm font-medium hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 min-h-[40px]';

  const inputBase =
    'w-full bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 placeholder:text-hivio-text-muted dark:placeholder:text-hivio-text-muted-dark';

  function handleBasicChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  }

  function handlePhotoClick() {
    photoInputRef.current?.click();
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, avatarUrl: reader.result }));
      setSuccess('');
      setError('');
    };
    reader.readAsDataURL(file);
  }

  function toggleInterest(interest) {
    setForm((prev) => {
      const curr = prev.interests || [];
      const next = curr.includes(interest)
        ? curr.filter((i) => i !== interest)
        : [...curr, interest];
      return { ...prev, interests: next };
    });
  }

  function toggleWidget(id) {
    setForm((prev) => ({
      ...prev,
      dashboardWidgets: {
        ...(prev.dashboardWidgets || {}),
        [id]: !(prev.dashboardWidgets || {})[id]
      }
    }));
  }


  function handleDragStart(idx) {
    setDragIdx(idx);
  }

  function handleDragOver(e, idx) {
    e.preventDefault();
    setDragOverIdx(idx);
  }

  function handleDrop(idx) {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    setForm((prev) => {
      const order = [...(prev.dashboardOrder || DEFAULT_DASHBOARD_ORDER)];
      const dragged = order.splice(dragIdx, 1)[0];
      order.splice(idx, 0, dragged);
      return { ...prev, dashboardOrder: order };
    });
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function resetWidgetsToDefaults() {
    setForm((prev) => ({
      ...prev,
      dashboardWidgets: { ...DEFAULT_DASHBOARD_WIDGETS },
      dashboardOrder: [...DEFAULT_DASHBOARD_ORDER],
    }));
  }

  function validateAccount() {
    if (!normalizeText(form.firstName)) return 'First name is required.';
    return '';
  }

  async function persistUserAndUpdateState(updates) {
    await saveUserProfile(user.uid, updates);
    if (typeof onUpdateUser === 'function') onUpdateUser({ ...user, ...updates });
  }

  async function saveAccountDetails() {
    setError('');
    setSuccess('');

    const v = validateAccount();
    if (v) { setError(v); return; }

    const updates = {
      name: `${normalizeText(form.firstName)} ${normalizeText(form.lastName)}`.trim(),
      avatarUrl: form.avatarUrl || null,
      profile: {
        ...(user.profile || {}),
        school: normalizeText(form.school),
        major: normalizeText(form.major),
        gradYear: String(form.gradYear),
        interests: form.interests || [],
      },
    };

    setSaving(true);
    try {
      await persistUserAndUpdateState(updates);
      setSuccess('Account details updated.');
      setView('main');
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function saveDashboardPersonalization() {
    setError('');
    setSuccess('');

    const updates = {
      weeklyGoalTarget: Math.max(1, Math.min(50, Number(form.weeklyGoalTarget) || 5)),
      dashboardWidgets: {
        ...(user.dashboardWidgets || {}),
        ...(form.dashboardWidgets || {}),
      },
      dashboardOrder: Array.isArray(form.dashboardOrder) ? [...form.dashboardOrder] : [...DEFAULT_DASHBOARD_ORDER],
    };

    setSaving(true);
    try {
      await persistUserAndUpdateState(updates);
      setSuccess('Dashboard preferences saved.');
      setView('main');
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // Account Details subpage
  // =========================
  if (view === 'account') {
    return (
      <div className={pageWrap}>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setView('main')}
            className={btnOutline}
          >
            Back
          </button>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Account Details</p>
          <div className="w-[64px]" />
        </div>

        {error && (
          <div className="mb-4 bg-hivio-status-rejected-bg dark:bg-hivio-status-rejected-bg-dark border border-hivio-status-rejected/20 dark:border-hivio-status-rejected-dark/20 text-hivio-status-rejected dark:text-hivio-status-rejected-dark text-sm font-medium px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-hivio-status-offer-bg dark:bg-hivio-status-offer-bg-dark border border-hivio-status-offer/20 dark:border-hivio-status-offer-dark/20 text-hivio-status-offer dark:text-hivio-status-offer-dark text-sm font-medium px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="relative group cursor-pointer"
            onClick={handlePhotoClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handlePhotoClick();
            }}
            aria-label="Change profile photo"
          >
            <div className="w-24 h-24 bg-hivio-bg dark:bg-hivio-bg-dark rounded-full border-2 border-dashed border-[#C4CDD6] dark:border-hivio-border-dark flex items-center justify-center text-hivio-text-muted dark:text-hivio-text-muted-dark group-hover:bg-hivio-primary-ghost dark:group-hover:bg-hivio-primary/10 group-hover:text-hivio-primary transition-all overflow-hidden">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-hivio-primary text-hivio-text-inverse p-1.5 rounded-full border-2 border-white dark:border-hivio-surface-dark">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
          </div>

          <p className={`text-sm font-semibold mt-4 ${subText}`}>
            {form.avatarUrl ? 'Tap to change photo' : 'Add a photo'}
          </p>

          <input
            type="file"
            ref={photoInputRef}
            onChange={handlePhotoChange}
            accept="image/*"
            className="hidden"
          />

          {form.avatarUrl && (
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, avatarUrl: '' }))}
              className="mt-3 px-3 py-2 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark text-xs font-medium hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150"
            >
              Remove photo
            </button>
          )}
        </div>

        {/* Basic */}
        <div className={`${card} mb-4 p-4`}>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Basic</p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">
                  First Name <span className="text-hivio-text-muted dark:text-hivio-text-muted-dark">*</span>
                </label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleBasicChange}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">
                  Last Name
                </label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleBasicChange}
                  className={inputBase}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Academic (standardized like ProfileSetup) */}
        <div className={`${card} mb-4 p-4`}>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Academic</p>

          <div className="space-y-4">
            <AutocompleteInput
              label="School / University"
              value={form.school}
              onChange={(v) => {
                setForm((prev) => ({ ...prev, school: v }));
                if (error) setError('');
                if (success) setSuccess('');
              }}
              options={MN_SCHOOLS}
              placeholder="Start typing or use abbreviation (e.g. UMN, SCSU)..."
              abbreviations={SCHOOL_ABBREVIATIONS}
            />

            <AutocompleteInput
              label="Major / Field of Study"
              value={form.major}
              onChange={(v) => {
                setForm((prev) => ({ ...prev, major: v }));
                if (error) setError('');
                if (success) setSuccess('');
              }}
              options={COMMON_MAJORS}
              placeholder="Start typing or use abbreviation (e.g. MIS, CS)..."
              abbreviations={MAJOR_ABBREVIATIONS}
            />

            <div>
              <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">
                Graduation Year
              </label>
              <select
                value={form.gradYear}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, gradYear: e.target.value }));
                  if (error) setError('');
                  if (success) setSuccess('');
                }}
                className={`${inputBase} select-field py-3.5`}
              >
                <option value="" disabled>Select year</option>
                {gradYearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className={`${card} mb-4 p-4`}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Career Interests</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {form.interests?.length || 0} selected
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {careerInterests.map((interest) => {
              const selected = form.interests?.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    selected
                      ? 'bg-hivio-primary text-hivio-text-inverse'
                      : 'bg-hivio-bg dark:bg-hivio-bg-dark text-hivio-text-secondary dark:text-hivio-text-secondary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={saveAccountDetails}
          disabled={saving}
          className="w-full bg-hivio-primary hover:bg-hivio-primary-hover text-hivio-text-inverse font-medium py-3.5 rounded-md shadow-hivio-sm transition-colors duration-150 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>

        <div className="h-4" />
      </div>
    );
  }

  // =========================
  // Dashboard personalization subpage
  // =========================
  if (view === 'dashboard') {
    return (
      <div className={pageWrap}>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setView('main')}
            className={btnOutline}
          >
            Back
          </button>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Dashboard</p>
          <div className="w-[64px]" />
        </div>

        {error && (
          <div className="mb-4 bg-hivio-status-rejected-bg dark:bg-hivio-status-rejected-bg-dark border border-hivio-status-rejected/20 dark:border-hivio-status-rejected-dark/20 text-hivio-status-rejected dark:text-hivio-status-rejected-dark text-sm font-medium px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-hivio-status-offer-bg dark:bg-hivio-status-offer-bg-dark border border-hivio-status-offer/20 dark:border-hivio-status-offer-dark/20 text-hivio-status-offer dark:text-hivio-status-offer-dark text-sm font-medium px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <div className={`${card} mb-3 p-4`}>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Applications per week</p>
          <p className="text-xs text-slate-400 mb-3">
            Used to score your activity in Pipeline Health.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-[#C4CDD6] dark:border-hivio-border-dark rounded-md overflow-hidden bg-hivio-surface dark:bg-hivio-surface-dark">
              <input
                type="number"
                min="1"
                max="50"
                value={form.weeklyGoalTarget}
                onChange={(e) => setForm((prev) => ({ ...prev, weeklyGoalTarget: e.target.value }))}
                onBlur={(e) => {
                  const n = Math.max(1, Math.min(50, Number(e.target.value) || 5));
                  setForm((prev) => ({ ...prev, weeklyGoalTarget: n }));
                }}
                className="w-14 bg-transparent text-hivio-text-primary dark:text-hivio-text-primary-dark px-3 py-2 text-sm font-medium focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="flex flex-col border-l border-[#C4CDD6] dark:border-hivio-border-dark">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, weeklyGoalTarget: Math.min(50, Number(prev.weeklyGoalTarget) + 1) }))}
                  className="px-2 py-1 text-slate-400 hover:text-hivio-text-primary dark:hover:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, weeklyGoalTarget: Math.max(1, Number(prev.weeklyGoalTarget) - 1) }))}
                  className="px-2 py-1 border-t border-[#C4CDD6] dark:border-hivio-border-dark text-slate-400 hover:text-hivio-text-primary dark:hover:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`${card} mb-4 p-4`}>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Dashboard Widgets</p>
          <p className="text-xs text-slate-400 mb-3">
            Toggle what shows on your home screen.
          </p>

          <div className="space-y-2">
            {dashboardWidgets.map((widget) => {
              const enabled = Boolean(form.dashboardWidgets?.[widget.id]);
              return (
                <button
                  key={widget.id}
                  type="button"
                  onClick={() => toggleWidget(widget.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-md border transition-all duration-150 text-left ${
                    enabled
                      ? 'border-hivio-border-focus bg-hivio-primary-light dark:bg-hivio-primary/10 ring-1 ring-hivio-border-focus/30'
                      : 'border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-surface dark:bg-hivio-surface-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      enabled ? 'bg-hivio-primary text-hivio-text-inverse' : 'bg-hivio-bg dark:bg-hivio-bg-dark text-hivio-text-muted dark:text-hivio-text-muted-dark'
                    }`}
                  >
                    {widget.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${enabled ? 'text-hivio-primary' : 'text-hivio-text-primary dark:text-hivio-text-primary-dark'}`}>
                      {widget.label}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{widget.desc}</div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      enabled ? 'border-hivio-primary bg-hivio-primary' : 'border-[#C4CDD6] dark:border-hivio-border-dark'
                    }`}
                  >
                    {enabled && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`${card} mb-4 p-4`}>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Widget Order</p>
          <p className="text-xs text-slate-400 mb-3">
            Drag to reorder widgets on your dashboard.
          </p>

          <div className="space-y-1.5">
            {(form.dashboardOrder || DEFAULT_DASHBOARD_ORDER).map((id, idx) => {
              const meta = DASHBOARD_ORDER_LABELS[id];
              if (!meta) return null;
              const isEnabled = Boolean(form.dashboardWidgets?.[meta.controlledBy]);
              const isDragging = dragIdx === idx;
              const isOver = dragOverIdx === idx && dragIdx !== idx;
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md border cursor-grab active:cursor-grabbing transition-all duration-150 ${
                    isDragging
                      ? 'opacity-40 border-dashed border-[#C4CDD6] dark:border-hivio-border-dark'
                      : isOver
                      ? 'border-hivio-border-focus bg-hivio-primary-light dark:bg-hivio-primary/10 shadow-hivio-sm'
                      : isEnabled
                      ? 'border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-surface dark:bg-hivio-surface-dark'
                      : 'border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-bg dark:bg-hivio-bg-dark opacity-50'
                  }`}
                >
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round"
                    className="text-slate-300 dark:text-slate-600 flex-shrink-0 pointer-events-none"
                  >
                    <line x1="8" y1="6" x2="16" y2="6" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                    <line x1="8" y1="18" x2="16" y2="18" />
                  </svg>
                  <span className="text-[10px] font-bold text-slate-400 w-4 text-center flex-shrink-0">{idx + 1}</span>
                  <span className={`flex-1 text-sm font-medium ${isEnabled ? 'text-hivio-text-primary dark:text-hivio-text-primary-dark' : 'text-hivio-text-muted dark:text-hivio-text-muted-dark'}`}>
                    {meta.label}
                  </span>
                  {!isEnabled && (
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">off</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={resetWidgetsToDefaults}
            className="flex-1 border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark font-medium py-3.5 rounded-md hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 min-h-[44px]"
          >
            Reset defaults
          </button>

          <button
            type="button"
            onClick={saveDashboardPersonalization}
            disabled={saving}
            className="flex-1 bg-hivio-primary hover:bg-hivio-primary-hover text-hivio-text-inverse font-medium py-3.5 rounded-md shadow-hivio-sm transition-colors duration-150 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Save Dashboard
          </button>
        </div>

        <div className="h-4" />
      </div>
    );
  }

  // =========================
  // Main Settings page
  // =========================
  return (
    <div className={pageWrap}>

      {error && (
        <div className="mb-4 bg-hivio-status-rejected-bg dark:bg-hivio-status-rejected-bg-dark border border-hivio-status-rejected/20 dark:border-hivio-status-rejected-dark/20 text-hivio-status-rejected dark:text-hivio-status-rejected-dark text-sm font-medium px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-hivio-status-offer-bg dark:bg-hivio-status-offer-bg-dark border border-hivio-status-offer/20 dark:border-hivio-status-offer-dark/20 text-hivio-status-offer dark:text-hivio-status-offer-dark text-sm font-medium px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      <button
        type="button"
        onClick={() => setView('account')}
        className={`${card} w-full flex items-center gap-4 mb-4 p-4 hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 text-left`}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="Avatar"
            className="w-14 h-14 rounded-full object-cover border-2 border-hivio-surface dark:border-hivio-surface-dark shadow-sm flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-hivio-primary flex items-center justify-center text-hivio-text-inverse font-bold text-lg shadow-sm flex-shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className={`text-base font-bold ${title}`}>{user.name}</h2>
          <p className={`text-sm ${subText}`}>{user.email}</p>
          {user.profile && (user.profile.school || user.profile.gradYear) && (
            <p className={`text-xs mt-0.5 ${faintText}`}>
              {[user.profile.school, user.profile.gradYear].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-500 flex-shrink-0">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div className="bg-hivio-surface dark:bg-hivio-surface-dark rounded-lg shadow-hivio border border-[#C4CDD6] dark:border-hivio-border-dark divide-y divide-hivio-border dark:divide-hivio-border-dark mb-4">
        <button
          type="button"
          onClick={() => setView('dashboard')}
          className="w-full flex items-center justify-between p-4 hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 rounded-t-lg min-h-[44px]"
        >
          <span className="font-semibold text-slate-700 dark:text-slate-200">Dashboard</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-500">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Developer Console — dev account only */}
        {user.email?.toLowerCase() === 'test@hivio.local' && (
          <button
            type="button"
            onClick={() => typeof onTabChange === 'function' && onTabChange('dev')}
            className="w-full flex items-center justify-between p-4 hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 border-t border-[#C4CDD6] dark:border-hivio-border-dark min-h-[44px]"
          >
            <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
              Developer Console
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                Dev
              </span>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-500">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Appearance toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-4 hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 border-t border-[#C4CDD6] dark:border-hivio-border-dark min-h-[44px]"
        >
          <span className="font-semibold text-slate-700 dark:text-slate-200">Appearance</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
            <div
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 border ${
                theme === 'dark'
                  ? 'bg-hivio-primary/20 border-hivio-primary/30'
                  : 'bg-hivio-bg border-hivio-border'
              }`}
              aria-hidden="true"
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  theme === 'dark'
                    ? 'bg-hivio-primary translate-x-5'
                    : 'bg-white translate-x-0'
                }`}
              />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onToggleNotifications?.(!notificationsEnabled)}
          className="w-full flex items-center justify-between p-4 hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 rounded-b-lg min-h-[44px]"
        >
          <span className="font-semibold text-slate-700 dark:text-slate-200">Notifications</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">
              {notificationsEnabled ? 'On' : 'Off'}
            </span>
            <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 border ${
              notificationsEnabled
                ? 'bg-hivio-primary/20 border-hivio-primary/30'
                : 'bg-hivio-bg dark:bg-hivio-bg-dark border-[#C4CDD6] dark:border-hivio-border-dark'
            }`}>
              <div className={`w-5 h-5 rounded-full transition-transform ${
                notificationsEnabled
                  ? 'bg-hivio-primary translate-x-5'
                  : 'bg-white dark:bg-hivio-text-muted-dark translate-x-0'
              }`} />
            </div>
          </div>
        </button>
      </div>

      <FeedbackCard user={user} />

      {/* Data & Export */}
      <div className="bg-hivio-surface dark:bg-hivio-surface-dark rounded-lg shadow-hivio border border-[#C4CDD6] dark:border-hivio-border-dark p-4 mb-4">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Data &amp; Export</p>
        <p className="text-xs text-hivio-text-muted dark:text-hivio-text-muted-dark mb-4">Download your application data</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={exportCSV}
            disabled={apps.filter((a) => !a.archived).length === 0}
            className="w-full flex items-center gap-3 p-3.5 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-bg dark:bg-hivio-bg-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            <div className="w-8 h-8 rounded-md bg-hivio-primary-light dark:bg-hivio-primary/15 flex items-center justify-center flex-shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-hivio-text-primary dark:text-hivio-text-primary-dark">Export CSV</p>
              <p className="text-xs text-hivio-text-muted dark:text-hivio-text-muted-dark">{apps.filter((a) => !a.archived).length} applications</p>
            </div>
          </button>
          <button
            type="button"
            onClick={exportPDF}
            disabled={apps.filter((a) => !a.archived).length === 0}
            className="w-full flex items-center gap-3 p-3.5 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-bg dark:bg-hivio-bg-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            <div className="w-8 h-8 rounded-md bg-hivio-primary-light dark:bg-hivio-primary/15 flex items-center justify-center flex-shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-hivio-text-primary dark:text-hivio-text-primary-dark">Export PDF Report</p>
              <p className="text-xs text-hivio-text-muted dark:text-hivio-text-muted-dark">Full dashboard summary</p>
            </div>
          </button>
        </div>
        {exportFeedback.msg && (
          <p className={`text-xs font-medium mt-3 ${exportFeedback.ok ? 'text-hivio-status-interview' : 'text-hivio-status-rejected'}`}>
            {exportFeedback.msg}
          </p>
        )}
      </div>

      <button
        onClick={onLogout}
        className="w-full bg-hivio-status-rejected-bg hover:bg-hivio-status-rejected/10 text-hivio-status-rejected font-medium py-3.5 rounded-md transition-colors duration-150 min-h-[44px] border border-hivio-status-rejected/20 dark:bg-[#3d2020] dark:hover:bg-[#4a2525] dark:text-[#e87c7c] dark:border-[#5a2a2a]"
      >
        Sign Out
      </button>
    </div>
  );
}

export default Settings;