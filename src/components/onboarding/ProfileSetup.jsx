import React, { useState, useRef, useMemo, useEffect } from 'react';
import AutocompleteInput from '../common/Autocompleteinput';
import { MN_SCHOOLS } from '../../data/schools-mn';
import { COMMON_MAJORS } from '../../data/majors';
import { careerInterests, dashboardWidgets, DEFAULT_DASHBOARD_WIDGETS } from '../../data/constants';
import { MAJOR_ABBREVIATIONS } from '../../data/majors';
import { SCHOOL_ABBREVIATIONS } from '../../data/schools-mn';
import { saveUserProfile } from '../../utils/db';
import { getStoredTheme, applyThemeClass } from '../../utils/theme';

function normalizeText(s) {
  return (s || '').trim().replace(/\s+/g, ' ');
}

const bg = 'bg-hivio-bg dark:bg-hivio-bg-dark';
const inputCls = 'select-field w-full text-sm font-normal text-hivio-text-primary dark:text-hivio-text-primary-dark bg-hivio-surface dark:bg-hivio-surface-dark border border-hivio-border dark:border-hivio-border-dark rounded-sm px-3 py-2 shadow-hivio-sm placeholder:text-hivio-text-muted dark:placeholder:text-hivio-text-muted-dark focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 ease-in-out';

function ProgressBar({ step }) {
  return (
    <div className="flex gap-2">
      <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-hivio-primary' : 'bg-hivio-border dark:bg-hivio-border-dark'}`} />
      <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-hivio-primary' : 'bg-hivio-border dark:bg-hivio-border-dark'}`} />
    </div>
  );
}

function ProfileSetup({ user, onProfileComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [cancelling, setCancelling] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    school: '',
    major: '',
    gradYear: '',
    interests: [],
  });

  const [widgets, setWidgets] = useState({ ...DEFAULT_DASHBOARD_WIDGETS });

  useEffect(() => {
    applyThemeClass(getStoredTheme());
  }, []);

  const gradYearOptions = useMemo(() => {
    const start = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 9; i++) years.push(String(start + i));
    return years;
  }, []);

  function handlePhotoClick() {
    fileInputRef.current.click();
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Image must be under 2MB.');
      return;
    }
    setPhotoError('');
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  }

  function toggleInterest(interest) {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  }

  function toggleWidget(id) {
    setWidgets(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaveError('');
    const updatedProfile = {
      profile: {
        ...profile,
        school: normalizeText(profile.school),
        major: normalizeText(profile.major),
        gradYear: String(profile.gradYear),
      },
      avatarUrl: avatarPreview || null,
      dashboardWidgets: widgets,
    };
    setSaving(true);
    try {
      await saveUserProfile(user.uid, updatedProfile);
      onProfileComplete({ ...user, ...updatedProfile });
    } catch {
      setSaveError('Failed to save. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  // ─── STEP 1: Academic info + career interests, no scroll ────────────────────
  if (step === 1) {
    return (
      <div className={`h-full flex flex-col px-6 pt-5 pb-6 ${bg}`}>
        <ProgressBar step={step} />

        <h1 className="text-2xl font-bold text-hivio-text-primary dark:text-hivio-text-primary-dark mt-4 mb-1">Set Up Your Profile</h1>
        <p className="text-sm text-hivio-text-secondary dark:text-hivio-text-secondary-dark mb-4">Tell us about your academic background.</p>

        <div className="space-y-3">
          <AutocompleteInput
            label="School / University"
            value={profile.school}
            onChange={(v) => setProfile((p) => ({ ...p, school: v }))}
            options={MN_SCHOOLS}
            placeholder="Start typing or use abbreviation (e.g. UMN, SCSU)..."
            abbreviations={SCHOOL_ABBREVIATIONS}
          />
          <AutocompleteInput
            label="Major / Field of Study"
            value={profile.major}
            onChange={(v) => setProfile((p) => ({ ...p, major: v }))}
            options={COMMON_MAJORS}
            placeholder="Start typing or use abbreviation (e.g. MIS, CS)..."
            abbreviations={MAJOR_ABBREVIATIONS}
          />
          <div>
            <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">
              Graduation Year
            </label>
            <select
              value={profile.gradYear}
              onChange={(e) => setProfile((p) => ({ ...p, gradYear: e.target.value }))}
              className={inputCls}
            >
              <option value="">Select year (optional)</option>
              {gradYearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Career Interests — horizontal scroll */}
        <div className="mt-4">
          <label className="text-xs font-medium text-hivio-text-muted dark:text-hivio-text-muted-dark uppercase tracking-wide mb-2 block">Career Interests</label>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-hide">
            {careerInterests.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 ease-in-out ${
                  profile.interests.includes(interest)
                    ? 'bg-hivio-primary text-hivio-text-inverse'
                    : 'bg-hivio-primary-light dark:bg-hivio-surface-dark text-hivio-text-secondary dark:text-hivio-text-secondary-dark'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => setStep(2)}
            className="w-full bg-hivio-primary text-hivio-text-inverse text-sm font-medium px-4 py-3 rounded-md shadow-hivio-sm hover:bg-hivio-primary-hover transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:ring-offset-2"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full text-hivio-text-muted dark:text-hivio-text-muted-dark text-sm font-medium py-2 mt-1 hover:text-hivio-text-secondary dark:hover:text-hivio-text-secondary-dark transition-colors duration-150 ease-in-out"
          >
            I'll fill this in later
          </button>
          <button
            type="button"
            disabled={cancelling}
            onClick={async () => { setCancelling(true); await onCancel(); }}
            className="w-full text-hivio-text-muted dark:text-hivio-text-muted-dark text-xs font-medium py-1.5 hover:text-hivio-status-rejected transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelling ? 'Cancelling…' : 'Cancel sign up'}
          </button>
        </div>
      </div>
    );
  }

  // ─── STEP 2: Photo + dashboard widgets, scrollable ──────────────────────────
  return (
    <div className={`min-h-full flex flex-col px-6 pb-6 ${bg}`}>
      {/* Progress bar at very top */}
      <div className="pt-4 pb-5">
        <ProgressBar step={step} />
      </div>

      {/* Photo */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
          <div className="w-24 h-24 bg-hivio-primary-light dark:bg-hivio-surface-dark rounded-full border-2 border-dashed border-hivio-border dark:border-hivio-border-dark flex items-center justify-center text-hivio-text-muted dark:text-hivio-text-muted-dark group-hover:bg-hivio-primary-ghost dark:group-hover:bg-hivio-primary/10 group-hover:text-hivio-primary transition-colors duration-150 ease-in-out overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-hivio-primary text-hivio-text-inverse p-1.5 rounded-full border-2 border-hivio-surface dark:border-hivio-surface-dark">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
        </div>
        <p className="text-sm font-medium text-hivio-text-secondary dark:text-hivio-text-secondary-dark mt-3">
          {avatarPreview ? 'Tap to change photo' : 'Add a photo'}
        </p>
        <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
        {photoError && (
          <p className="text-xs font-medium text-hivio-status-rejected mt-2">{photoError}</p>
        )}
      </div>

      {/* Dashboard Widgets */}
      <div className="mb-5">
        <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Dashboard Widgets</label>
        <p className="text-xs font-medium text-hivio-text-muted dark:text-hivio-text-muted-dark mb-3">Toggle what shows on your home screen.</p>
        <div className="space-y-2">
          {dashboardWidgets.map(widget => (
            <button
              key={widget.id}
              type="button"
              onClick={() => toggleWidget(widget.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors duration-150 ease-in-out text-left ${
                widgets[widget.id]
                  ? 'border-hivio-primary bg-hivio-primary-light dark:bg-hivio-primary/10 ring-1 ring-hivio-primary/20'
                  : 'border-hivio-border dark:border-hivio-border-dark bg-hivio-surface dark:bg-hivio-surface-dark hover:border-hivio-border-focus'
              }`}
            >
              <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
                widgets[widget.id] ? 'bg-hivio-primary text-hivio-text-inverse' : 'bg-hivio-primary-light dark:bg-hivio-surface-dark text-hivio-text-muted dark:text-hivio-text-muted-dark'
              }`}>
                {widget.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${widgets[widget.id] ? 'text-hivio-primary' : 'text-hivio-text-primary dark:text-hivio-text-primary-dark'}`}>
                  {widget.label}
                </div>
                <div className="text-xs font-medium text-hivio-text-muted dark:text-hivio-text-muted-dark truncate">{widget.desc}</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                widgets[widget.id] ? 'border-hivio-primary bg-hivio-primary' : 'border-hivio-border dark:border-hivio-border-dark'
              }`}>
                {widgets[widget.id] && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {saveError && (
        <p className="text-xs font-medium text-hivio-status-rejected mb-3">{saveError}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep(1)}
          className="flex-1 text-hivio-primary bg-transparent text-sm font-medium px-4 py-3 rounded-md border border-hivio-border dark:border-hivio-border-dark hover:bg-hivio-primary-ghost transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-hivio-border-focus"
        >
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-hivio-primary text-hivio-text-inverse text-sm font-medium px-4 py-3 rounded-md shadow-hivio-sm hover:bg-hivio-primary-hover transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          type="button"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}

export default ProfileSetup;
