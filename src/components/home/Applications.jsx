import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getApplicationsIntentKey, safeReadJSON } from '../../utils/storage';
import {
  subscribeApplications, saveApplication, deleteApplication,
  subscribeResumes, saveResume,
} from '../../utils/db';
import { isValidDateStringYYYYMMDD } from '../../utils/dateUtils';
import { MN_LOCATIONS } from '../../data/mn-locations';

function scrollAppContainerToTop() {
  const el = document.getElementById('app-scroll-container');
  if (el) el.scrollTo({ top: 0, behavior: 'auto' });
}

/* Constants */
const STATUS_OPTIONS = ['Applied', 'Interview', 'Offer', 'Rejected', 'No Response'];

const FILTER_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'Applied', label: 'Applied' },
  { id: 'Interview', label: 'Interview' },
  { id: 'Offer', label: 'Offer' },
  { id: 'Rejected', label: 'Rejected' },
  { id: 'followups', label: 'Follow-ups' },
  { id: 'No Response', label: 'No Response' },
  { id: 'ghost', label: 'Ghost' },
];

const AVATAR_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-700 dark:text-violet-300' },
  { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-300' },
  { bg: 'bg-teal-100 dark:bg-teal-500/20', text: 'text-teal-700 dark:text-teal-300' },
  { bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-300' },
];

function getCompanyInitials(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const skip = new Set(['of', 'the', 'and', '&', 'a', 'an', 'in', 'at', 'for']);
  const significant = words.filter((w) => !skip.has(w.toLowerCase()));
  if (significant.length >= 2) return (significant[0][0] + significant[1][0]).toUpperCase();
  return (words[0][0] + (words[1]?.[0] || words[0][1] || '')).toUpperCase();
}

function getCompanyColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
];

const LOCATION_OPTIONS = ['Remote', ...MN_LOCATIONS];

function LocationField({ value, onChange, inputClassName }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return LOCATION_OPTIONS;
    const starts = [];
    const contains = [];
    for (const opt of LOCATION_OPTIONS) {
      const t = opt.toLowerCase();
      if (t.startsWith(q)) starts.push(opt);
      else if (t.includes(q)) contains.push(opt);
    }
    return [...starts, ...contains];
  }, [query]);

  return (
    <div className="relative" ref={containerRef}>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Remote or city..."
        className={inputClassName}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-30 mt-1 w-full bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-lg shadow-hivio-md overflow-y-auto scrollbar-hide" style={{ maxHeight: '180px' }}>
          {suggestions.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(opt); setQuery(opt); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 text-hivio-text-primary dark:text-hivio-text-primary-dark text-sm"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ResumeSelectField({ value, onChange, resumes, inputClassName }) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function handleToggle() {
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 200);
    }
    setOpen((p) => !p);
  }

  const selected = resumes.find((r) => r.id === value);
  const displayLabel = selected ? (selected.label || selected.fileName) : 'None';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`${inputClassName} flex items-center justify-between text-left h-12 text-sm`}
      >
        <span className={`truncate flex-1 min-w-0 ${!selected ? 'text-hivio-text-muted dark:text-hivio-text-muted-dark' : ''}`}>
          {displayLabel}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ml-2 text-hivio-text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className={`absolute z-30 w-full bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-lg shadow-hivio-lg overflow-y-auto scrollbar-hide ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'}`} style={{ maxHeight: '200px' }}>
          <div>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(''); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${!value ? 'text-hivio-primary font-medium bg-hivio-primary-light dark:bg-hivio-primary/10' : 'text-hivio-text-muted dark:text-hivio-text-muted-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10'}`}
            >
              None
            </button>
            {resumes.length === 0 && (
              <p className="px-4 py-2.5 text-sm text-hivio-text-muted dark:text-hivio-text-muted-dark">No resumes uploaded yet.</p>
            )}
            {resumes.map((r) => (
              <button
                key={r.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onChange(r.id); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${value === r.id ? 'text-hivio-primary font-medium bg-hivio-primary-light dark:bg-hivio-primary/10' : 'text-hivio-text-primary dark:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10'}`}
              >
                {r.label || r.fileName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function emptyForm() {
  return {
    company: '',
    title: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'Applied',
    followUpDate: '',
    location: '',
    notes: '',
    resumeId: '',
  };
}

function Applications({ user, openAppId, onOpenAppIdConsumed }) {
  const intentKey = useMemo(() => getApplicationsIntentKey(user?.uid), [user]);

  const [apps, setApps] = useState([]);
  const [resumes, setResumes] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState('list'); // 'list' | 'add' | 'edit'
  const [addForm, setAddForm] = useState(emptyForm());

  const [editingApp, setEditingApp] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm());

  const [openMenuId, setOpenMenuId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resumeFilter, setResumeFilter] = useState(null);
  const [showResumeMenu, setShowResumeMenu] = useState(false);
  const resumeMenuRef = useRef(null);
  const [sortOrder, setSortOrder] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);

  const [showAddResumeUpload, setShowAddResumeUpload] = useState(false);
  const [showEditResumeUpload, setShowEditResumeUpload] = useState(false);

  const addResumeInputRef = useRef(null);
  const [addResumeFile, setAddResumeFile] = useState(null);
  const [addResumeLabel, setAddResumeLabel] = useState('');

  const editResumeInputRef = useRef(null);
  const [editResumeFile, setEditResumeFile] = useState(null);
  const [editResumeLabel, setEditResumeLabel] = useState('');

  // Firestore real-time subscriptions
  useEffect(() => {
    if (!user?.uid) return;
    const unsubApps = subscribeApplications(user.uid, setApps);
    const unsubResumes = subscribeResumes(user.uid, setResumes);
    return () => { unsubApps(); unsubResumes(); };
  }, [user?.uid]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(intentKey);
      if (!raw) return;

      const intent = JSON.parse(raw);
      if (intent?.status && intent.status !== 'All') {
        setActiveFilter(intent.status);
      } else if (intent?.status === 'All') {
        setActiveFilter('all');
      } else if (intent?.filter === 'followups') {
        setActiveFilter('followups');
      } else if (intent?.filter === 'ghost') {
        setActiveFilter('ghost');
      }

      localStorage.removeItem(intentKey);
    } catch {
      // ignore
    }
  }, [intentKey]);


  useEffect(() => {
    if (!openAppId || apps.length === 0) return;
    const app = apps.find((a) => a.id === openAppId);
    if (app) openEdit(app);
    if (typeof onOpenAppIdConsumed === 'function') onOpenAppIdConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAppId, apps]);

  useEffect(() => {
    if (!openMenuId) return;
    function onDocClick() { setOpenMenuId(null); }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openMenuId]);

  useEffect(() => {
    if (!showResumeMenu) return;
    function onDocClick(e) {
      if (!resumeMenuRef.current?.contains(e.target)) setShowResumeMenu(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showResumeMenu]);

  useEffect(() => {
    if (!showSortMenu) return;
    function onDocClick(e) {
      if (!sortMenuRef.current?.contains(e.target)) setShowSortMenu(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showSortMenu]);


  async function persistApp(app) {
    try {
      await saveApplication(user.uid, app);
      return true;
    } catch {
      setError('Save failed. Please try again.');
      return false;
    }
  }

  async function removeApp(appId) {
    try {
      await deleteApplication(user.uid, appId);
    } catch {
      setError('Delete failed. Please try again.');
    }
  }

  async function persistResume(resume) {
    try {
      await saveResume(user.uid, resume);
    } catch {
      setError('Resume save failed. Please try again.');
    }
  }

  function validate(form) {
    if (!form.company.trim()) return 'Company is required.';
    if (!form.title.trim()) return 'Job title is required.';
    if (!form.date) return 'Application date is required.';
    if (!form.status) return 'Status is required.';
    return '';
  }

  function validateResumeFile(file) {
    if (!file) return 'Please select a resume file.';
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Unsupported file type. Please upload a PDF or DOCX.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return 'File is too large. Please upload a file under 5MB.';
    }
    return '';
  }

  function resumeLabelById(resumeId) {
    if (!resumeId) return '';
    const r = resumes.find((x) => x.id === resumeId);
    return r ? r.label || r.fileName : 'Selected resume';
  }

  function openAdd() {
    scrollAppContainerToTop();
    setSuccess('');
    setError('');
    setAddForm(emptyForm());
    setShowAddResumeUpload(false);
    setAddResumeFile(null);
    setAddResumeLabel('');
    if (addResumeInputRef.current) addResumeInputRef.current.value = '';
    setView('add');
  }

  function closeAdd() {
    setView('list');
    setError('');
    scrollAppContainerToTop();
  }

  function openEdit(app) {
    scrollAppContainerToTop();
    setSuccess('');
    setError('');
    setOpenMenuId(null);
    setEditingApp(app);
    setEditForm({
      company: app.company || '',
      title: app.title || '',
      date: app.date || new Date().toISOString().slice(0, 10),
      status: app.status || 'Applied',
      followUpDate: app.followUpDate || '',
      location: app.location || '',
      notes: app.notes || '',
      resumeId: app.resumeId || '',
    });
    setShowEditResumeUpload(false);
    setEditResumeFile(null);
    setEditResumeLabel('');
    if (editResumeInputRef.current) editResumeInputRef.current.value = '';
    setView('edit');
  }

  function closeEdit() {
    setView('list');
    setEditingApp(null);
    setError('');
    scrollAppContainerToTop();
  }

  function handleAddChange(e) {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function saveNewApp() {
    setError('');
    setSuccess('');

    const validationError = validate(addForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    const newApp = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      company: addForm.company.trim(),
      title: addForm.title.trim(),
      date: addForm.date,
      status: addForm.status,
      followUpDate: addForm.followUpDate,
      location: addForm.location.trim(),
      notes: addForm.notes.trim(),
      resumeId: addForm.resumeId,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      const ok = await persistApp(newApp);
      if (!ok) return;
      setView('list');
      scrollAppContainerToTop();
      setSuccess('Application added.');
      setTimeout(() => setSuccess(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function saveEditsAndClose() {
    if (!editingApp) return;

    setError('');
    setSuccess('');

    const validationError = validate(editForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    const updated = {
      ...editingApp,
      company: editForm.company.trim(),
      title: editForm.title.trim(),
      date: editForm.date,
      status: editForm.status,
      followUpDate: editForm.followUpDate,
      location: editForm.location.trim(),
      notes: editForm.notes.trim(),
      resumeId: editForm.resumeId,
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      const ok = await persistApp(updated);
      if (!ok) return;
      setView('list');
      setEditingApp(null);
      scrollAppContainerToTop();
      setSuccess('Application updated.');
      setTimeout(() => setSuccess(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(appId) {
    await removeApp(appId);
    setOpenMenuId(null);
  }

  async function handleArchive(appId) {
    const app = apps.find((a) => a.id === appId);
    if (app) await persistApp({ ...app, archived: true });
    setOpenMenuId(null);
  }

  async function handleUnarchive(appId) {
    const app = apps.find((a) => a.id === appId);
    if (app) await persistApp({ ...app, archived: false });
  }


  function handleAddResumeFilePick() {
    setError('');
    setSuccess('');
    addResumeInputRef.current?.click();
  }

  function handleAddResumeFileChange(e) {
    setError('');
    setSuccess('');

    const file = e.target.files?.[0];
    const v = validateResumeFile(file);
    if (v) {
      setAddResumeFile(null);
      setAddResumeLabel('');
      setError(v);
      return;
    }

    setAddResumeFile(file);
    setAddResumeLabel(file.name.replace(/\.[^/.]+$/, ''));
  }

  async function handleAddResumeUpload() {
    setError('');
    setSuccess('');

    const v = validateResumeFile(addResumeFile);
    if (v) {
      setError(v);
      return;
    }
    if (!addResumeLabel.trim()) {
      setError('Please add a label for this resume.');
      return;
    }

    try {
      const newResume = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        fileName: addResumeFile.name,
        fileType: addResumeFile.type,
        fileSize: addResumeFile.size,
        label: addResumeLabel.trim(),
        uploadedAt: new Date().toISOString(),
      };

      await persistResume(newResume);
      setAddForm((prev) => ({ ...prev, resumeId: newResume.id }));

      setAddResumeFile(null);
      setAddResumeLabel('');
      if (addResumeInputRef.current) addResumeInputRef.current.value = '';

      setShowAddResumeUpload(false);
      setSuccess('Resume linked.');
    } catch {
      setError('Resume save failed. Please try again.');
    }
  }

  function handleEditResumeFilePick() {
    setError('');
    setSuccess('');
    editResumeInputRef.current?.click();
  }

  function handleEditResumeFileChange(e) {
    setError('');
    setSuccess('');

    const file = e.target.files?.[0];
    const v = validateResumeFile(file);
    if (v) {
      setEditResumeFile(null);
      setEditResumeLabel('');
      setError(v);
      return;
    }

    setEditResumeFile(file);
    setEditResumeLabel(file.name.replace(/\.[^/.]+$/, ''));
  }

  async function handleEditResumeUpload() {
    setError('');
    setSuccess('');

    const v = validateResumeFile(editResumeFile);
    if (v) {
      setError(v);
      return;
    }
    if (!editResumeLabel.trim()) {
      setError('Please add a label for this resume.');
      return;
    }

    try {
      const newResume = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        fileName: editResumeFile.name,
        fileType: editResumeFile.type,
        fileSize: editResumeFile.size,
        label: editResumeLabel.trim(),
        uploadedAt: new Date().toISOString(),
      };

      await persistResume(newResume);
      setEditForm((prev) => ({ ...prev, resumeId: newResume.id }));

      setEditResumeFile(null);
      setEditResumeLabel('');
      if (editResumeInputRef.current) editResumeInputRef.current.value = '';

      setShowEditResumeUpload(false);
      setSuccess('Resume linked.');
    } catch {
      setError('Resume save failed. Please try again.');
    }
  }

  const activeAppsAll = useMemo(() => apps.filter((a) => !a.archived), [apps]);

  const activeAppsFiltered = useMemo(() => {
    let list = activeAppsAll;

    if (resumeFilter) {
      list = list.filter((a) => a.resumeId === resumeFilter);
    }

    if (activeFilter === 'followups') {
      list = [...list]
        .filter((a) => isValidDateStringYYYYMMDD(a.followUpDate))
        .sort((a, b) => (a.followUpDate || '').localeCompare(b.followUpDate || ''));
    } else if (activeFilter === 'ghost') {
      const now = Date.now();
      list = list.filter((a) => {
        if (a.status !== 'Applied' || a.followUpDate) return false;
        const ageDays = (now - new Date(a.createdAt || a.date || 0).getTime()) / 86400000;
        return ageDays > 21;
      });
    } else if (activeFilter !== 'all') {
      list = list.filter((a) => (a.status || 'Applied') === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.company?.toLowerCase().includes(q) ||
          a.title?.toLowerCase().includes(q) ||
          a.location?.toLowerCase().includes(q)
      );
    }

    if (activeFilter !== 'followups') {
      list = [...list].sort((a, b) => {
        if (sortOrder === 'az') return (a.company || '').localeCompare(b.company || '');
        if (sortOrder === 'oldest') return (a.date || '').localeCompare(b.date || '');
        return (b.date || '').localeCompare(a.date || '');
      });
    }

    return list;
  }, [activeAppsAll, activeFilter, searchQuery, resumeFilter, sortOrder]);

  const archivedApps = useMemo(() => apps.filter((a) => a.archived), [apps]);


  const pageBg = 'bg-hivio-bg dark:bg-hivio-bg-dark';
  const cardBg = 'bg-hivio-surface dark:bg-hivio-surface-dark';
  const border = 'border border-[#C4CDD6] dark:border-hivio-border-dark';
  const textMain = 'text-hivio-text-primary dark:text-hivio-text-primary-dark';
  const textSub = 'text-hivio-text-secondary dark:text-hivio-text-secondary-dark';

  const inputBase =
    'w-full bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 placeholder:text-hivio-text-muted dark:placeholder:text-hivio-text-muted-dark';

  const backBtn = 'w-10 h-10 flex items-center justify-center rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-secondary dark:text-hivio-text-secondary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors flex-shrink-0 absolute left-0';

  // ─── ADD PAGE ──────────────────────────────────────────────────────────────
  if (view === 'add') {
    return (
      <div className={`flex flex-col min-h-full px-5 pt-4 pb-8 ${pageBg}`}>
        <div className="relative flex items-center justify-center h-10 mb-5">
          <button type="button" onClick={closeAdd} className={backBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h1 className={`text-base font-bold ${textMain}`}>New Application</h1>
        </div>

        {error && (
          <div className="mb-4 bg-hivio-status-rejected-bg dark:bg-hivio-status-rejected-bg-dark border border-hivio-status-rejected/20 dark:border-hivio-status-rejected-dark/20 text-hivio-status-rejected dark:text-hivio-status-rejected-dark text-sm font-medium px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Company *</label>
            <input name="company" value={addForm.company} onChange={handleAddChange} className={inputBase} />
          </div>
          <div>
            <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Job Title *</label>
            <input name="title" value={addForm.title} onChange={handleAddChange} className={inputBase} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Date *</label>
              <input type="date" name="date" value={addForm.date} onChange={handleAddChange} className={inputBase} />
            </div>
            <div>
              <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Status *</label>
              <select name="status" value={addForm.status} onChange={handleAddChange} className={`${inputBase} select-field`}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Follow-Up</label>
              <input type="date" name="followUpDate" value={addForm.followUpDate} onChange={handleAddChange} className={inputBase} />
            </div>
            <div>
              <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Location</label>
              <LocationField value={addForm.location} onChange={(v) => setAddForm((p) => ({ ...p, location: v }))} inputClassName={inputBase} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Resume Used</label>
              <button type="button" onClick={() => setShowAddResumeUpload((p) => !p)} className="px-3 py-2 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark text-xs font-medium hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150">
                {showAddResumeUpload ? 'Hide upload' : 'Upload new'}
              </button>
            </div>
            <ResumeSelectField
              value={addForm.resumeId}
              onChange={(v) => setAddForm((p) => ({ ...p, resumeId: v }))}
              resumes={resumes}
              inputClassName={inputBase}
            />
            {showAddResumeUpload && (
              <div className="mt-2 border border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-bg dark:bg-hivio-bg-dark rounded-lg p-3">
                <button type="button" onClick={handleAddResumeFilePick} className="px-3 py-2 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark text-sm font-medium hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150">
                  Choose File
                </button>
                <input ref={addResumeInputRef} type="file" className="hidden" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleAddResumeFileChange} />
                {addResumeFile && (
                  <div className="mt-2">
                    <p className="text-xs text-hivio-text-secondary dark:text-hivio-text-secondary-dark font-medium truncate">Selected: {addResumeFile.name}</p>
                    <label className="text-xs font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mt-2 mb-1 block">Label</label>
                    <input value={addResumeLabel} onChange={(e) => setAddResumeLabel(e.target.value)} className={inputBase} />
                    <button type="button" onClick={handleAddResumeUpload} className="w-full mt-2 bg-hivio-primary hover:bg-hivio-primary-hover text-hivio-text-inverse font-medium py-3 rounded-md shadow-hivio-sm transition-colors duration-150">Upload & Link</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Notes</label>
            <textarea name="notes" value={addForm.notes} onChange={handleAddChange} rows={2} className={`${inputBase} resize-none`} />
          </div>
          <button type="button" onClick={saveNewApp} disabled={saving} className="w-full bg-hivio-primary hover:bg-hivio-primary-hover text-hivio-text-inverse font-medium py-3.5 rounded-md shadow-hivio-sm transition-colors duration-150 mt-1 disabled:opacity-60 disabled:cursor-not-allowed">
            Save Application
          </button>
        </div>
      </div>
    );
  }

  // ─── EDIT PAGE ─────────────────────────────────────────────────────────────
  if (view === 'edit') {
    return (
      <div className={`flex flex-col min-h-full px-5 pt-4 pb-8 ${pageBg}`}>
        <div className="relative flex items-center justify-center h-10 mb-5">
          <button type="button" onClick={closeEdit} className={backBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h1 className={`text-base font-bold ${textMain}`}>Edit Application</h1>
        </div>

        {error && (
          <div className="mb-4 bg-hivio-status-rejected-bg dark:bg-hivio-status-rejected-bg-dark border border-hivio-status-rejected/20 dark:border-hivio-status-rejected-dark/20 text-hivio-status-rejected dark:text-hivio-status-rejected-dark text-sm font-medium px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Company *</label>
            <input name="company" value={editForm.company} onChange={handleEditChange} className={inputBase} />
          </div>
          <div>
            <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Job Title *</label>
            <input name="title" value={editForm.title} onChange={handleEditChange} className={inputBase} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Date *</label>
              <input type="date" name="date" value={editForm.date} onChange={handleEditChange} className={inputBase} />
            </div>
            <div>
              <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Status *</label>
              <select name="status" value={editForm.status} onChange={handleEditChange} className={`${inputBase} select-field`}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Follow-Up</label>
              <input type="date" name="followUpDate" value={editForm.followUpDate} onChange={handleEditChange} className={inputBase} />
            </div>
            <div>
              <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Location</label>
              <LocationField value={editForm.location} onChange={(v) => setEditForm((p) => ({ ...p, location: v }))} inputClassName={inputBase} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Resume Used</label>
              <button type="button" onClick={() => setShowEditResumeUpload((p) => !p)} className="px-3 py-2 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark text-xs font-medium hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150">
                {showEditResumeUpload ? 'Hide upload' : 'Upload new'}
              </button>
            </div>
            <ResumeSelectField
              value={editForm.resumeId}
              onChange={(v) => setEditForm((p) => ({ ...p, resumeId: v }))}
              resumes={resumes}
              inputClassName={inputBase}
            />
            {editForm.resumeId && (
              <p className="text-xs text-hivio-text-secondary dark:text-hivio-text-secondary-dark font-medium mt-1 ml-1">Currently linked: {resumeLabelById(editForm.resumeId)}</p>
            )}
            {showEditResumeUpload && (
              <div className="mt-2 border border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-bg dark:bg-hivio-bg-dark rounded-lg p-3">
                <button type="button" onClick={handleEditResumeFilePick} className="px-3 py-2 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark text-sm font-medium hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150">
                  Choose File
                </button>
                <input ref={editResumeInputRef} type="file" className="hidden" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleEditResumeFileChange} />
                {editResumeFile && (
                  <div className="mt-2">
                    <p className="text-xs text-hivio-text-secondary dark:text-hivio-text-secondary-dark font-medium truncate">Selected: {editResumeFile.name}</p>
                    <label className="text-xs font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mt-2 mb-1 block">Label</label>
                    <input value={editResumeLabel} onChange={(e) => setEditResumeLabel(e.target.value)} className={inputBase} />
                    <button type="button" onClick={handleEditResumeUpload} className="w-full mt-2 bg-hivio-primary hover:bg-hivio-primary-hover text-hivio-text-inverse font-medium py-3 rounded-md shadow-hivio-sm transition-colors duration-150">Upload & Link</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">Notes</label>
            <textarea name="notes" value={editForm.notes} onChange={handleEditChange} rows={2} className={`${inputBase} resize-none`} />
          </div>
          <button type="button" onClick={saveEditsAndClose} disabled={saving} className="w-full bg-hivio-primary hover:bg-hivio-primary-hover text-hivio-text-inverse font-medium py-3.5 rounded-md shadow-hivio-sm transition-colors duration-150 mt-1 disabled:opacity-60 disabled:cursor-not-allowed">
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col min-h-full px-5 pt-5 pb-4 ${pageBg}`}>

      {/* Search bar — top */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Company, role, or location…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark rounded-md pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 placeholder:text-hivio-text-muted shadow-hivio-sm"
          />
        </div>
        {/* Sort button */}
        <div className="relative flex-shrink-0" ref={sortMenuRef}>
          <button
            type="button"
            onClick={() => setShowSortMenu((p) => !p)}
            className={`flex items-center gap-1 px-3 py-2.5 rounded-md border text-xs font-medium transition-colors duration-150 ${
              sortOrder !== 'newest'
                ? 'bg-hivio-primary-light border-hivio-border-focus text-hivio-primary'
                : 'border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-secondary dark:text-hivio-text-secondary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            {{ newest: 'Newest', oldest: 'Oldest', az: 'A–Z' }[sortOrder]}
            {sortOrder !== 'newest' && (
              <span
                role="button"
                aria-label="Clear sort"
                className="flex-shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-hivio-primary/15 text-hivio-primary hover:bg-hivio-primary/25 transition-colors duration-150 text-[11px] font-bold leading-none ml-0.5"
                onMouseDown={(e) => { e.stopPropagation(); setSortOrder('newest'); setShowSortMenu(false); }}
              >×</span>
            )}
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-lg shadow-hivio-md overflow-hidden w-28">
              {[{ id: 'newest', label: 'Newest' }, { id: 'oldest', label: 'Oldest' }, { id: 'az', label: 'A–Z' }].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onMouseDown={() => { setSortOrder(opt.id); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors duration-150 ${
                    sortOrder === opt.id ? 'text-hivio-primary bg-hivio-primary-light dark:bg-hivio-primary/10' : 'text-hivio-text-primary dark:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status filter chips */}
      <div className="mb-4 -mx-5 px-5">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {FILTER_CHIPS.map((chip) => {
            const selected = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveFilter(chip.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors duration-150 ${
                  selected
                    ? 'bg-hivio-primary text-hivio-text-inverse shadow-hivio-sm'
                    : 'bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-secondary dark:text-hivio-text-secondary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          type="button"
          onClick={() => { setShowArchived((p) => !p); }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs font-medium transition-colors duration-150 ${
            showArchived
              ? 'bg-hivio-primary-light border-hivio-border-focus text-hivio-primary'
              : 'border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10'
          }`}
        >
          {showArchived ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Active
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
              Archived{archivedApps.length > 0 && <span className="ml-1 bg-hivio-primary text-hivio-text-inverse rounded-full px-1.5 py-0.5 text-[10px] font-bold">{archivedApps.length}</span>}
            </>
          )}
        </button>

        {/* Resume filter dropdown */}
        <div className="relative" ref={resumeMenuRef}>
          <button
            type="button"
            onClick={() => resumes.length > 0 && setShowResumeMenu((p) => !p)}
            disabled={resumes.length === 0}
            title={resumeFilter ? resumeLabelById(resumeFilter) : undefined}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs font-medium transition-colors duration-150 min-w-[90px] max-w-[140px] overflow-hidden ${
              resumes.length === 0
                ? 'border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-muted dark:text-hivio-text-muted-dark opacity-50 cursor-not-allowed'
                : resumeFilter
                ? 'bg-hivio-primary-light border-hivio-border-focus text-hivio-primary'
                : 'border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span className="truncate min-w-0">{resumeFilter ? resumeLabelById(resumeFilter) : 'Resume'}</span>
            {resumeFilter && (
              <span
                role="button"
                aria-label="Clear resume filter"
                className="flex-shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-hivio-primary/15 text-hivio-primary hover:bg-hivio-primary/25 transition-colors duration-150 text-[11px] font-bold leading-none"
                onMouseDown={(e) => { e.stopPropagation(); setResumeFilter(null); setShowResumeMenu(false); }}
              >×</span>
            )}
          </button>
          {showResumeMenu && resumes.length > 0 && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-lg shadow-hivio-md overflow-hidden w-48">
              {resumes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onMouseDown={() => { setResumeFilter(r.id); setShowResumeMenu(false); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 truncate block ${
                    resumeFilter === r.id ? 'text-hivio-primary' : 'text-hivio-text-primary dark:text-hivio-text-primary-dark'
                  }`}
                >
                  {r.label || r.fileName}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {success && (
        <div className="mb-4 bg-hivio-status-offer-bg dark:bg-hivio-status-offer-bg-dark border border-hivio-status-offer/20 dark:border-hivio-status-offer-dark/20 text-hivio-status-offer dark:text-hivio-status-offer-dark text-sm font-medium px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {!showArchived ? (
        activeAppsFiltered.length === 0 ? (
        <div className={`${cardBg} ${border} rounded-lg p-8 shadow-hivio text-center`}>
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 dark:text-blue-300">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
          </div>
          <p className={`text-sm font-semibold ${textMain}`}>
            {activeFilter !== 'all' || resumeFilter ? 'No applications match this filter' : 'No applications yet'}
          </p>
          <p className={`text-xs ${textSub} font-medium mt-1`}>
            {activeFilter !== 'all' || resumeFilter ? 'Try changing the filter or add a new application.' : 'Track every role you apply to in one place.'}
          </p>
          {activeFilter === 'all' && !resumeFilter && (
            <button
              type="button"
              onClick={openAdd}
              className="mt-4 inline-flex items-center gap-2 bg-hivio-primary hover:bg-hivio-primary-hover text-hivio-text-inverse text-sm font-medium px-5 py-2.5 rounded-md shadow-hivio-sm transition-colors duration-150"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add application
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeAppsFiltered.map((a) => {
            const color = getCompanyColor(a.company);
            return (
              <div
                key={a.id}
                className={`bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-lg p-4 shadow-hivio transition-all duration-150 ${!openMenuId ? 'hover:shadow-hivio-md hover:-translate-y-px' : openMenuId !== a.id ? 'pointer-events-none' : ''}`}
              >
                {/* Top row: avatar + info + menu */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm select-none ${color.bg} ${color.text}`}>
                    {getCompanyInitials(a.company)}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${textMain} truncate leading-snug`}>
                      {a.company}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                      {a.title}{a.location ? ` · ${a.location}` : ''}
                    </p>
                  </div>

                  {/* Right: status + menu */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      a.status === 'Applied'
                        ? 'bg-hivio-status-applied-bg text-hivio-status-applied dark:bg-hivio-status-applied-bg-dark dark:text-white'
                        : a.status === 'Interview'
                        ? 'bg-hivio-status-interview-bg text-hivio-status-interview dark:bg-hivio-status-interview-bg-dark dark:text-white'
                        : a.status === 'Offer'
                        ? 'bg-hivio-status-offer-bg text-hivio-status-offer dark:bg-hivio-status-offer-bg-dark dark:text-white'
                        : a.status === 'No Response'
                        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        : 'bg-hivio-status-rejected-bg text-hivio-status-rejected dark:bg-hivio-status-rejected-bg-dark dark:text-white'
                    }`}>
                      {a.status}
                    </span>

                    <div className={`relative ${openMenuId === a.id ? 'z-20' : ''}`}>
                      <button
                        type="button"
                        onClick={() => setOpenMenuId((prev) => (prev === a.id ? null : a.id))}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-hivio-text-muted dark:text-hivio-text-muted-dark hover:text-hivio-text-primary dark:hover:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150"
                        aria-label="More actions"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                        </svg>
                      </button>

                      {openMenuId === a.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-lg shadow-hivio-md overflow-hidden z-50" onMouseDown={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openEdit(a)}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150"
                          >
                            View / Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchive(a.id)}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150"
                          >
                            Archive
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id)}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-hivio-status-rejected hover:bg-hivio-status-rejected-bg transition-colors duration-150"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom row: date + tags */}
                <div className="flex items-center gap-2 mt-3 ml-[52px] flex-wrap">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{a.date}</span>

                  {a.followUpDate && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {a.followUpDate}
                    </span>
                  )}

                  {a.resumeId && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-hivio-primary-light text-hivio-primary text-[11px] font-medium dark:bg-[#1e2a3a] dark:text-white">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      {resumeLabelById(a.resumeId)}
                    </span>
                  )}
                </div>

                {a.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 ml-[52px] line-clamp-2 leading-relaxed">
                    {a.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )
      ) : (
        /* Archived view */
        archivedApps.length === 0 ? (
          <div className={`${cardBg} ${border} rounded-lg p-8 shadow-hivio text-center`}>
            <p className={`text-sm font-semibold ${textMain}`}>No archived applications</p>
            <p className={`text-xs ${textSub} font-medium mt-1`}>Archived apps will appear here.</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-3">{archivedApps.length} archived application{archivedApps.length !== 1 ? 's' : ''}</p>
            <div className="space-y-3">
              {archivedApps.map((a) => (
                <div
                  key={a.id}
                  className={`${cardBg} ${border} rounded-lg p-4 shadow-hivio`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${textMain} truncate`}>{a.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300 font-medium mt-1 truncate">{a.company}</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">Applied on {a.date}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnarchive(a.id)}
                      className="px-3 py-2 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark text-xs font-medium hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 flex-shrink-0"
                    >
                      Unarchive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* FAB */}
      {!showArchived && (
        <div className="sticky bottom-4 flex justify-end pointer-events-none mt-4">
          <button
            type="button"
            onClick={openAdd}
            className="pointer-events-auto w-14 h-14 bg-hivio-primary hover:bg-hivio-primary-hover text-hivio-text-inverse rounded-full shadow-[0_4px_20px_rgba(99,102,241,0.45)] flex items-center justify-center transition-all duration-150 active:scale-95"
            aria-label="Add application"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      )}


    </div>
  );
}

export default Applications;