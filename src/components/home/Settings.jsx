import React, { useEffect, useMemo, useRef, useState } from 'react';
import AutocompleteInput from '../common/Autocompleteinput';
import { MN_SCHOOLS } from '../../data/schools-mn';
import { COMMON_MAJORS } from '../../data/majors';
import { careerInterests, dashboardWidgets, DEFAULT_DASHBOARD_WIDGETS, DEFAULT_DASHBOARD_ORDER, DASHBOARD_ORDER_LABELS } from '../../data/constants';
import { getUser, saveUser } from '../../utils/storage';
import { getStoredTheme, storeTheme, applyThemeClass } from '../../utils/theme';
import { EMAIL_REGEX } from '../../utils/validate';

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
    try {
      const key = 'hivio_feedback';
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([entry, ...prev]));
    } catch {}
    setSubmitted(true);
    setTimeout(() => { setOpen(false); setSubmitted(false); setRating(0); setComment(''); }, 2000);
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-slate-300 dark:border-slate-800 overflow-hidden mb-6">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
      >
        <div>
          <p className="font-semibold text-slate-700 dark:text-slate-200 text-left">Share Feedback</p>
          <p className="text-xs text-slate-400 mt-0.5 text-left">Report a bug or share what's working</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-300 dark:text-slate-500 transition-transform ${open ? 'rotate-90' : ''}`}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          {submitted ? (
            <div className="text-center py-4">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Thanks for your feedback!</p>
              <p className="text-xs text-slate-400 mt-1">It helps us build a better experience.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">How would you rate Hivio?</p>
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
                    <span className="text-xs font-semibold text-slate-400 ml-2">
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
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all resize-none"
              />

              <button
                type="button"
                onClick={submit}
                disabled={!rating}
                className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
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

function Settings({ user, onLogout, onUpdateUser, notificationsEnabled, onToggleNotifications, onTabChange }) {
  const [view, setView] = useState('main'); // main | account | dashboard
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
      name: user?.name || '',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl || '',

      // profile (standardized like ProfileSetup)
      school: user?.profile?.school || '',
      major: user?.profile?.major || '',
      gradYear: user?.profile?.gradYear || '',
      interests: Array.isArray(user?.profile?.interests) ? user.profile.interests : [],

      // dashboard widgets
      dashboardWidgets: user?.dashboardWidgets || { ...DEFAULT_DASHBOARD_WIDGETS },

      // dashboard widget order
      dashboardOrder: Array.isArray(user?.dashboardOrder) ? [...user.dashboardOrder] : [...DEFAULT_DASHBOARD_ORDER]
    };
  }, [user]);

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const photoInputRef = useRef(null);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [view]);

  const pageWrap = 'flex flex-col min-h-full px-5 py-6 bg-[#F7F9FC] dark:bg-slate-950';
  const card = 'bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-slate-300 dark:border-slate-800';
  const title = 'text-slate-900 dark:text-slate-100';
  const subText = 'text-slate-500 dark:text-slate-300';
  const faintText = 'text-slate-400 dark:text-slate-400';
  const btnOutline = 'px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]';

  const inputBase =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all';

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
    if (!normalizeText(form.email)) return 'Email is required.';
    if (!EMAIL_REGEX.test(form.email.trim())) {
      return 'Enter a valid email address.';
    }
    return '';
  }

  function persistUserAndUpdateState(updatedUser) {
    saveUser(updatedUser);
    if (typeof onUpdateUser === 'function') onUpdateUser(updatedUser);
  }

  function saveAccountDetails() {
    setError('');
    setSuccess('');

    const v = validateAccount();
    if (v) {
      setError(v);
      return;
    }

    const storedUser = getUser(user.email);
    if (!storedUser) {
      setError('No stored user found. Please log out and log back in.');
      return;
    }

    const updatedUser = {
      ...storedUser,
      name: normalizeText(form.name),
      email: form.email.trim().toLowerCase(),
      avatarUrl: form.avatarUrl || null,
      profile: {
        ...(storedUser.profile || {}),
        school: normalizeText(form.school),
        major: normalizeText(form.major),
        gradYear: String(form.gradYear),
        interests: form.interests || []
      }
    };

    try {
      persistUserAndUpdateState(updatedUser);
      setSuccess('Account details updated.');
      setView('main');
    } catch {
      setError('Failed to save changes. Please try again.');
    }
  }

  function saveDashboardPersonalization() {
    setError('');
    setSuccess('');

    const storedUser = getUser(user.email);
    if (!storedUser) {
      setError('No stored user found. Please log out and log back in.');
      return;
    }

    const updatedUser = {
      ...storedUser,
      dashboardWidgets: {
        ...(storedUser.dashboardWidgets || {}),
        ...(form.dashboardWidgets || {})
      },
      dashboardOrder: Array.isArray(form.dashboardOrder) ? [...form.dashboardOrder] : [...DEFAULT_DASHBOARD_ORDER],
    };

    try {
      persistUserAndUpdateState(updatedUser);
      setSuccess('Dashboard preferences saved.');
      setView('main');
    } catch {
      setError('Failed to save changes. Please try again.');
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
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-200 text-sm font-medium px-4 py-3 rounded-xl">
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
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-[#2C6E91]/10 group-hover:text-[#2C6E91] transition-all overflow-hidden">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-[#2C6E91] text-white p-1.5 rounded-full border-2 border-white dark:border-slate-900">
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

          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, avatarUrl: '' }))}
            className="mt-3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Remove photo
          </button>
        </div>

        {/* Basic */}
        <div className={`${card} mb-4 p-4`}>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Basic</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">
                Full Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleBasicChange}
                className={inputBase}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">
                Email
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleBasicChange}
                className={inputBase}
              />
              <p className={`text-[11px] font-medium mt-1 ml-1 ${faintText}`}>
                This is used for login in your local MVP.
              </p>
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
              placeholder="Start typing your school (Minnesota list)..."
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
              placeholder="Start typing your major..."
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">
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
                      ? 'bg-[#2C6E91] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
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
          className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors min-h-[44px]"
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
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-200 text-sm font-medium px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

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
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                    enabled
                      ? 'border-[#2C6E91] bg-blue-50/40 dark:bg-[#2C6E91]/10 ring-1 ring-[#2C6E91]/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      enabled ? 'bg-[#2C6E91] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300'
                    }`}
                  >
                    {widget.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${enabled ? 'text-[#2C6E91]' : 'text-slate-700 dark:text-slate-200'}`}>
                      {widget.label}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{widget.desc}</div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      enabled ? 'border-[#2C6E91] bg-[#2C6E91]' : 'border-slate-300 dark:border-slate-600'
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
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all ${
                    isDragging
                      ? 'opacity-40 border-dashed border-slate-300 dark:border-slate-600'
                      : isOver
                      ? 'border-[#2C6E91] bg-blue-50/40 dark:bg-[#2C6E91]/10 shadow-sm'
                      : isEnabled
                      ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-50'
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
                  <span className={`flex-1 text-sm font-semibold ${isEnabled ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
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
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
          >
            Reset defaults
          </button>

          <button
            type="button"
            onClick={saveDashboardPersonalization}
            className="flex-1 bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors min-h-[44px]"
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
      <h1 className={`text-2xl font-bold tracking-tight ${title} mb-6`}>
        Settings
      </h1>

      <div className={`${card} flex items-center gap-4 mb-6 p-4`}>
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="Avatar"
            className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-sm"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#2C6E91] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h2 className={`text-base font-bold ${title}`}>{user.name}</h2>
          <p className={`text-sm ${subText}`}>{user.email}</p>
          {user.profile && (
            <p className={`text-xs mt-0.5 ${faintText}`}>
              {user.profile.school} · {user.profile.gradYear}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-slate-300 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800 mb-6">
        <button
          type="button"
          onClick={() => setView('account')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-t-2xl min-h-[44px]"
        >
          <span className="font-semibold text-slate-700 dark:text-slate-200">Account Details</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-500">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setView('dashboard')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
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
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800 min-h-[44px]"
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
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800 min-h-[44px]"
        >
          <span className="font-semibold text-slate-700 dark:text-slate-200">Appearance</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
            <div
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 border ${
                theme === 'dark'
                  ? 'bg-[#2C6E91]/20 border-[#2C6E91]/30'
                  : 'bg-slate-100 border-slate-200'
              }`}
              aria-hidden="true"
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  theme === 'dark'
                    ? 'bg-[#2C6E91] translate-x-5'
                    : 'bg-white translate-x-0'
                }`}
              />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onToggleNotifications?.(!notificationsEnabled)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-b-2xl min-h-[44px]"
        >
          <span className="font-semibold text-slate-700 dark:text-slate-200">Notifications</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">
              {notificationsEnabled ? 'On' : 'Off'}
            </span>
            <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 border ${
              notificationsEnabled
                ? 'bg-[#2C6E91]/20 border-[#2C6E91]/30'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}>
              <div className={`w-5 h-5 rounded-full transition-transform ${
                notificationsEnabled
                  ? 'bg-[#2C6E91] translate-x-5'
                  : 'bg-white dark:bg-slate-500 translate-x-0'
              }`} />
            </div>
          </div>
        </button>
      </div>

      <FeedbackCard user={user} />

      <button
        onClick={onLogout}
        className="w-full bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 dark:text-red-300 font-semibold py-3.5 rounded-xl transition-colors min-h-[44px] border border-red-100 dark:border-red-900/40"
      >
        Sign Out
      </button>
    </div>
  );
}

export default Settings;