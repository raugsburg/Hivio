import React, { useState, useRef, useMemo, useEffect } from 'react';
import AutocompleteInput from '../common/Autocompleteinput';
import { MN_SCHOOLS } from '../../data/schools-mn';
import { COMMON_MAJORS } from '../../data/majors';
import { careerInterests, dashboardWidgets } from '../../data/constants';
import { getUser, saveUser } from '../../utils/storage';
import { getStoredTheme, applyThemeClass } from '../../utils/theme';

function normalizeText(s) {
  return (s || '').trim().replace(/\s+/g, ' ');
}

function ProfileSetup({ user, onProfileComplete }) {
  const [step, setStep] = useState(1);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    school: '',
    major: '',
    gradYear: '',
    interests: [],
  });

  const [widgets, setWidgets] = useState({
    pipelineHealth: true,
    weeklyGoal: true,
    statusBreakdown: true,
    applicationFunnel: true,
    weeklyActivity: true,
    upcomingTasks: true,
    recentApps: true,
    rejectionRate: false,
  });

  // Apply saved theme so onboarding matches Settings
  useEffect(() => {
    applyThemeClass(getStoredTheme());
  }, []);

  const gradYearOptions = useMemo(() => {
    const start = new Date().getFullYear(); // 2026 right now
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
      alert('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function toggleInterest(interest) {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  }

  function toggleWidget(id) {
    setWidgets(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function handleNext() {
    setStep(2);
  }

  function handleSave() {
    const stored = getUser(user.email) || user;
    const normalizedProfile = {
      ...profile,
      school: normalizeText(profile.school),
      major: normalizeText(profile.major),
      gradYear: String(profile.gradYear),
    };

    const updatedUser = {
      ...stored,
      profile: normalizedProfile,
      avatarUrl: avatarPreview || null,
      dashboardWidgets: widgets,
    };

    saveUser(updatedUser);
    onProfileComplete(updatedUser);
  }

  return (
    <div className="flex flex-col min-h-screen px-8 py-10 bg-[#F7F9FC] dark:bg-slate-950">
      
      {/* Progress bar */}
      <div className="flex gap-2 mt-12 mb-8">
        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-[#2C6E91]' : 'bg-slate-200 dark:bg-slate-800'}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-[#2C6E91]' : 'bg-slate-200 dark:bg-slate-800'}`} />
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-[#2C6E91]/10 group-hover:text-[#2C6E91] transition-all overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-[#2C6E91] text-white p-1.5 rounded-full border-2 border-white dark:border-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-300 mt-4">
          {avatarPreview ? 'Tap to change photo' : 'Add a photo'}
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* ========== STEP 1: Academic Info ========== */}
      {step === 1 && (
        <>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">Set Up Your Profile</h1>
          <p className="text-slate-500 dark:text-slate-300 font-medium mb-8">Tell us about your academic background.</p>

          <div className="space-y-4">
            <AutocompleteInput
              label="School / University"
              value={profile.school}
              onChange={(v) => setProfile((p) => ({ ...p, school: v }))}
              options={MN_SCHOOLS}
              placeholder="Start typing your school (Minnesota list)..."
            />

            <AutocompleteInput
              label="Major / Field of Study"
              value={profile.major}
              onChange={(v) => setProfile((p) => ({ ...p, major: v }))}
              options={COMMON_MAJORS}
              placeholder="Start typing your major..."
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">
                Graduation Year
              </label>
              <select
                value={profile.gradYear}
                onChange={(e) => setProfile((p) => ({ ...p, gradYear: e.target.value }))}
                className="select-field w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
              >
                <option value="">Select year (optional)</option>
                {gradYearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-8"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-full text-slate-400 dark:text-slate-500 text-sm font-medium py-2 mt-1 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Skip for now
          </button>
        </>
      )}

      {/* ========== STEP 2: Personalization ========== */}
      {step === 2 && (
        <>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">Personalize Hivio</h1>
          <p className="text-slate-500 dark:text-slate-300 font-medium mb-6">Choose your interests and pick your dashboard widgets.</p>

          {/* Career Interests — horizontal scroll */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 ml-1">Career Interests</label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-8 px-8 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              {careerInterests.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    profile.interests.includes(interest)
                      ? 'bg-[#2C6E91] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            {profile.interests.length > 0 && (
              <p className="text-xs text-slate-400 mt-2 ml-1">
                {profile.interests.length} selected
              </p>
            )}
          </div>

          {/* Dashboard Widgets */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 ml-1">Dashboard Widgets</label>
            <p className="text-xs text-slate-400 mb-3 ml-1">Toggle what shows on your home screen.</p>
            <div className="space-y-2">
              {dashboardWidgets.map(widget => (
                <button
                  key={widget.id}
                  type="button"
                  onClick={() => toggleWidget(widget.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                    widgets[widget.id]
                      ? 'border-[#2C6E91] bg-blue-50/40 dark:bg-[#2C6E91]/10 ring-1 ring-[#2C6E91]/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    widgets[widget.id]
                      ? 'bg-[#2C6E91] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300'
                  }`}>
                    {widget.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${widgets[widget.id] ? 'text-[#2C6E91]' : 'text-slate-700 dark:text-slate-200'}`}>
                      {widget.label}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{widget.desc}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    widgets[widget.id]
                      ? 'border-[#2C6E91] bg-[#2C6E91]'
                      : 'border-slate-300 dark:border-slate-600'
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

          <div className="flex gap-3 mt-6 pb-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors"
            >
              Save & Continue
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ProfileSetup;