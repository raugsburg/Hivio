import React, { useEffect, useMemo, useRef, useState } from 'react';

const careerInterests = [
  'Software Engineering', 'Product Management', 'Data Science',
  'UX Design', 'Marketing', 'Finance', 'Consulting',
  'Research', 'Operations', 'Sales', 'Human Resources',
  'Business Analytics', 'Cybersecurity'
];

const DEFAULT_DASHBOARD_WIDGETS = {
  statusBreakdown: true,
  weeklyActivity: true,
  interviewsLanded: true,
  upcomingTasks: true,
  recentApps: true,
  rejectionRate: false
};

/**
 * Removed "Response Rate" from dashboard personalization (leave to Analytics),
 * so users don't toggle a widget that isn't implemented on Dashboard.
 */
const dashboardWidgetsList = [
  {
    id: 'statusBreakdown',
    label: 'Application Status',
    desc: 'See how many apps are applied, interviewing, offered, or rejected.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
    )
  },
  {
    id: 'weeklyActivity',
    label: 'Weekly Activity',
    desc: 'Track how many applications you submit each week.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    )
  },
  {
    id: 'interviewsLanded',
    label: 'Interviews Landed',
    desc: "Highlight how many interviews you've secured so far.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
      </svg>
    )
  },
  {
    id: 'upcomingTasks',
    label: 'Upcoming Follow-ups',
    desc: 'Reminders for follow-up dates and deadlines.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  },
  {
    id: 'recentApps',
    label: 'Recent Applications',
    desc: 'Quick access to your latest submitted applications.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    )
  }
];

function getUserStorageKey() {
  return 'hivio_user';
}

function safeReadUser() {
  try {
    const raw = localStorage.getItem(getUserStorageKey());
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeWriteUser(nextUser) {
  localStorage.setItem(getUserStorageKey(), JSON.stringify(nextUser));
}

function Settings({ user, onLogout, onUpdateUser }) {
  const [view, setView] = useState('main'); // main | account | dashboard

  const initialForm = useMemo(() => {
    return {
      // account/basic
      name: user?.name || '',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl || '',

      // profile
      school: user?.profile?.school || '',
      major: user?.profile?.major || '',
      gradYear: user?.profile?.gradYear || '',
      location: user?.profile?.location || '',
      interests: Array.isArray(user?.profile?.interests) ? user.profile.interests : [],

      // dashboard widgets
      dashboardWidgets: user?.dashboardWidgets || { ...DEFAULT_DASHBOARD_WIDGETS }
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

  function resetWidgetsToDefaults() {
    setForm((prev) => ({
      ...prev,
      dashboardWidgets: { ...DEFAULT_DASHBOARD_WIDGETS }
    }));
  }

  function validateAccount() {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Enter a valid email address.';
    }
    if (form.gradYear && !/^\d{4}$/.test(form.gradYear.trim())) {
      return 'Graduation year must be a 4-digit year (e.g., 2026).';
    }
    return '';
  }

  function persistUserAndUpdateState(updatedUser) {
    safeWriteUser(updatedUser);
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

    const storedUser = safeReadUser();
    if (!storedUser) {
      setError('No stored user found. Please log out and log back in.');
      return;
    }

    const updatedUser = {
      ...storedUser,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      avatarUrl: form.avatarUrl || null,
      profile: {
        ...(storedUser.profile || {}),
        school: form.school.trim(),
        major: form.major.trim(),
        gradYear: form.gradYear.trim(),
        location: form.location.trim(),
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

    const storedUser = safeReadUser();
    if (!storedUser) {
      setError('No stored user found. Please log out and log back in.');
      return;
    }

    const updatedUser = {
      ...storedUser,
      dashboardWidgets: {
        ...(storedUser.dashboardWidgets || {}),
        ...(form.dashboardWidgets || {})
      }
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
      <div className="flex flex-col px-5 py-6 bg-[#F7F9FC]">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setView('main')}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 min-h-[40px]"
          >
            Back
          </button>
          <p className="text-sm font-bold text-slate-800">Account Details</p>
          <div className="w-[64px]" />
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        {/* Avatar (same circular style as onboarding) */}
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
            <div className="w-24 h-24 bg-slate-100 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-[#2C6E91] transition-all overflow-hidden">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-[#2C6E91] text-white p-1.5 rounded-full border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-500 mt-4">
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
            className="mt-3 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
          >
            Remove photo
          </button>
        </div>

        {/* Basic */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <p className="text-sm font-bold text-slate-800 mb-3">Basic</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                Full Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleBasicChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                Email
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleBasicChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
              />
              <p className="text-[11px] text-slate-400 font-medium mt-1 ml-1">
                This is used for login in your local MVP.
              </p>
            </div>
          </div>
        </div>

        {/* School */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <p className="text-sm font-bold text-slate-800 mb-3">School</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                School
              </label>
              <input
                name="school"
                value={form.school}
                onChange={handleBasicChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                Major
              </label>
              <input
                name="major"
                value={form.major}
                onChange={handleBasicChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                Graduation Year
              </label>
              <input
                name="gradYear"
                value={form.gradYear}
                onChange={handleBasicChange}
                placeholder="2026"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-bold text-slate-800">Career Interests</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {form.interests?.length || 0} selected
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {careerInterests.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  form.interests?.includes(interest)
                    ? 'bg-[#2C6E91] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Location */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <p className="text-sm font-bold text-slate-800 mb-3">Preferred Location</p>
          <input
            name="location"
            value={form.location}
            onChange={handleBasicChange}
            placeholder="e.g. Minneapolis, MN or Remote"
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
          />
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
      <div className="flex flex-col px-5 py-6 bg-[#F7F9FC]">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setView('main')}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 min-h-[40px]"
          >
            Back
          </button>
          <p className="text-sm font-bold text-slate-800">Dashboard</p>
          <div className="w-[64px]" />
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 mb-4">
          <p className="text-sm font-bold text-slate-800 mb-1">Dashboard Widgets</p>
          <p className="text-xs text-slate-400 mb-3">
            Toggle what shows on your home screen.
          </p>

          <div className="space-y-2">
            {dashboardWidgetsList.map((widget) => {
              const enabled = Boolean(form.dashboardWidgets?.[widget.id]);
              return (
                <button
                  key={widget.id}
                  type="button"
                  onClick={() => toggleWidget(widget.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                    enabled
                      ? 'border-[#2C6E91] bg-blue-50/40 ring-1 ring-[#2C6E91]/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      enabled ? 'bg-[#2C6E91] text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {widget.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${enabled ? 'text-[#2C6E91]' : 'text-slate-700'}`}>
                      {widget.label}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{widget.desc}</div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      enabled ? 'border-[#2C6E91] bg-[#2C6E91]' : 'border-slate-300'
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={resetWidgetsToDefaults}
            className="flex-1 border border-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl hover:bg-slate-50 transition-colors min-h-[44px]"
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
    <div className="flex flex-col px-5 py-6 bg-[#F7F9FC]">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">
        Settings
      </h1>

      <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center gap-4 mb-6">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="Avatar"
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#2C6E91] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-900">{user.name}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>
          {user.profile && (
            <p className="text-xs text-slate-400 mt-0.5">
              {user.profile.school} · {user.profile.gradYear}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 divide-y divide-slate-50 mb-6">
        <button
          type="button"
          onClick={() => setView('account')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-t-2xl min-h-[44px]"
        >
          <span className="font-semibold text-slate-700">Account Details</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setView('dashboard')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors min-h-[44px]"
        >
          <span className="font-semibold text-slate-700">Dashboard</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors min-h-[44px]"
        >
          <span className="font-semibold text-slate-700">Notifications</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-b-2xl min-h-[44px]"
        >
          <span className="font-semibold text-slate-700">Appearance</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Light</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </button>
      </div>

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