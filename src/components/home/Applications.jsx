import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getApplicationsStorageKey, getApplicationsIntentKey, getResumesStorageKey, safeReadJSON, safeWriteJSON } from '../../utils/storage';
import { isValidDateStringYYYYMMDD } from '../../utils/dateUtils';
import { MN_LOCATIONS } from '../../data/mn-locations';

function scrollAppContainerToTop() {
  const el = document.getElementById('app-scroll-container');
  if (el) el.scrollTo({ top: 0, behavior: 'auto' });
}

function readApps(storageKey) {
  return safeReadJSON(storageKey, []);
}

function writeApps(storageKey, apps) {
  return safeWriteJSON(storageKey, apps);
}

function readResumes(storageKey) {
  return safeReadJSON(storageKey, []);
}

function writeResumes(storageKey, resumes) {
  safeWriteJSON(storageKey, resumes);
}

/* Constants */
const STATUS_OPTIONS = ['Applied', 'Interview', 'Offer', 'Rejected'];

const FILTER_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'Applied', label: 'Applied' },
  { id: 'Interview', label: 'Interview' },
  { id: 'Offer', label: 'Offer' },
  { id: 'Rejected', label: 'Rejected' },
  { id: 'followups', label: 'Follow-ups' },
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
    if (!q) return LOCATION_OPTIONS.slice(0, 8);
    const starts = [];
    const contains = [];
    for (const opt of LOCATION_OPTIONS) {
      const t = opt.toLowerCase();
      if (t.startsWith(q)) starts.push(opt);
      else if (t.includes(q)) contains.push(opt);
      if (starts.length + contains.length >= 8) break;
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
        <div className="absolute z-30 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(opt); setQuery(opt); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm"
            >
              {opt}
            </button>
          ))}
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

function Applications({ user }) {
  const appsStorageKey = useMemo(() => getApplicationsStorageKey(user), [user]);
  const resumesStorageKey = useMemo(() => getResumesStorageKey(user), [user]);
  const intentKey = useMemo(() => getApplicationsIntentKey(user), [user]);

  const [apps, setApps] = useState([]);
  const [resumes, setResumes] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const [showAddResumeUpload, setShowAddResumeUpload] = useState(false);
  const [showEditResumeUpload, setShowEditResumeUpload] = useState(false);

  const addResumeInputRef = useRef(null);
  const [addResumeFile, setAddResumeFile] = useState(null);
  const [addResumeLabel, setAddResumeLabel] = useState('');

  const editResumeInputRef = useRef(null);
  const [editResumeFile, setEditResumeFile] = useState(null);
  const [editResumeLabel, setEditResumeLabel] = useState('');

  useEffect(() => {
    setApps(readApps(appsStorageKey));
  }, [appsStorageKey]);

  useEffect(() => {
    setResumes(readResumes(resumesStorageKey));
  }, [resumesStorageKey]);

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
      }

      localStorage.removeItem(intentKey);
    } catch {
      // ignore
    }
  }, [intentKey]);


  useEffect(() => {
    if (!showResumeMenu) return;
    function onDocClick(e) {
      if (!resumeMenuRef.current?.contains(e.target)) setShowResumeMenu(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showResumeMenu]);

  function persistApps(next) {
    setApps(next);
    const ok = writeApps(appsStorageKey, next);
    if (!ok) setError('Save failed — storage may be full. Try removing large resume files.');
  }

  function persistResumes(next) {
    setResumes(next);
    writeResumes(resumesStorageKey, next);
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

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function resumeLabelById(resumeId) {
    if (!resumeId) return '';
    const r = resumes.find((x) => x.id === resumeId);
    return r ? r.label || r.fileName : 'Selected resume';
  }

  function exportToCSV() {
    const activeApps = apps.filter((a) => !a.archived);
    if (activeApps.length === 0) return;

    const headers = ['Company', 'Job Title', 'Status', 'Date Applied', 'Follow-up Date', 'Location', 'Resume', 'Notes'];
    const rows = activeApps.map((a) => [
      a.company || '',
      a.title || '',
      a.status || '',
      a.date || '',
      a.followUpDate || '',
      a.location || '',
      resumeLabelById(a.resumeId),
      a.notes || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hivio_applications_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('Applications exported successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Export failed. Please try again.');
    }
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

  function saveNewApp() {
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

    persistApps([newApp, ...apps]);
    setView('list');
    scrollAppContainerToTop();
    setSuccess('Application added.');
  }

  function saveEditsAndClose() {
    if (!editingApp) return;

    setError('');
    setSuccess('');

    const validationError = validate(editForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    const next = apps.map((a) =>
      a.id === editingApp.id
        ? {
            ...a,
            company: editForm.company.trim(),
            title: editForm.title.trim(),
            date: editForm.date,
            status: editForm.status,
            followUpDate: editForm.followUpDate,
            location: editForm.location.trim(),
            notes: editForm.notes.trim(),
            resumeId: editForm.resumeId,
            updatedAt: new Date().toISOString(),
          }
        : a
    );

    persistApps(next);
    setView('list');
    setEditingApp(null);
    scrollAppContainerToTop();
    setSuccess('Application updated.');
  }

  function handleDelete(appId) {
    persistApps(apps.filter((a) => a.id !== appId));
    setOpenMenuId(null);
  }

  function handleArchive(appId) {
    persistApps(apps.map((a) => (a.id === appId ? { ...a, archived: true } : a)));
    setOpenMenuId(null);
  }

  function handleUnarchive(appId) {
    persistApps(apps.map((a) => (a.id === appId ? { ...a, archived: false } : a)));
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
      const dataUrl = await fileToDataUrl(addResumeFile);
      const newResume = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        fileName: addResumeFile.name,
        fileType: addResumeFile.type,
        fileSize: addResumeFile.size,
        label: addResumeLabel.trim(),
        uploadedAt: new Date().toISOString(),
        dataUrl,
      };

      persistResumes([newResume, ...resumes]);
      setAddForm((prev) => ({ ...prev, resumeId: newResume.id }));

      setAddResumeFile(null);
      setAddResumeLabel('');
      if (addResumeInputRef.current) addResumeInputRef.current.value = '';

      setShowAddResumeUpload(false);
      setSuccess('Resume uploaded and linked.');
    } catch {
      setError('Resume upload failed. Please try again.');
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
      const dataUrl = await fileToDataUrl(editResumeFile);
      const newResume = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        fileName: editResumeFile.name,
        fileType: editResumeFile.type,
        fileSize: editResumeFile.size,
        label: editResumeLabel.trim(),
        uploadedAt: new Date().toISOString(),
        dataUrl,
      };

      persistResumes([newResume, ...resumes]);
      setEditForm((prev) => ({ ...prev, resumeId: newResume.id }));

      setEditResumeFile(null);
      setEditResumeLabel('');
      if (editResumeInputRef.current) editResumeInputRef.current.value = '';

      setShowEditResumeUpload(false);
      setSuccess('Resume uploaded and linked.');
    } catch {
      setError('Resume upload failed. Please try again.');
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

    return list;
  }, [activeAppsAll, activeFilter, searchQuery, resumeFilter]);

  const archivedApps = useMemo(() => apps.filter((a) => a.archived), [apps]);


  const pageBg = 'bg-[#F7F9FC] dark:bg-slate-950';
  const cardBg = 'bg-white dark:bg-slate-900';
  const border = 'border border-slate-300 dark:border-slate-800';
  const textMain = 'text-slate-900 dark:text-slate-100';
  const textSub = 'text-slate-500 dark:text-slate-300';

  const inputBase =
    'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all';

  const backBtn = 'w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 absolute left-0';

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
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Company *</label>
            <input name="company" value={addForm.company} onChange={handleAddChange} className={inputBase} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Job Title *</label>
            <input name="title" value={addForm.title} onChange={handleAddChange} className={inputBase} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Date *</label>
              <input type="date" name="date" value={addForm.date} onChange={handleAddChange} className={inputBase} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Status *</label>
              <select name="status" value={addForm.status} onChange={handleAddChange} className={`${inputBase} select-field`}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Follow-Up</label>
              <input type="date" name="followUpDate" value={addForm.followUpDate} onChange={handleAddChange} className={inputBase} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Location</label>
              <LocationField value={addForm.location} onChange={(v) => setAddForm((p) => ({ ...p, location: v }))} inputClassName={inputBase} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Resume Used</label>
              <button type="button" onClick={() => setShowAddResumeUpload((p) => !p)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                {showAddResumeUpload ? 'Hide upload' : 'Upload new'}
              </button>
            </div>
            <select name="resumeId" value={addForm.resumeId} onChange={handleAddChange} className={`${inputBase} select-field`}>
              <option value="">None</option>
              {resumes.map((r) => <option key={r.id} value={r.id}>{r.label || r.fileName}</option>)}
            </select>
            {showAddResumeUpload && (
              <div className="mt-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl p-3">
                <button type="button" onClick={handleAddResumeFilePick} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-white dark:hover:bg-slate-900">
                  Choose File
                </button>
                <input ref={addResumeInputRef} type="file" className="hidden" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleAddResumeFileChange} />
                {addResumeFile && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">Selected: {addResumeFile.name}</p>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2 mb-1 ml-1">Label</label>
                    <input value={addResumeLabel} onChange={(e) => setAddResumeLabel(e.target.value)} className={inputBase} />
                    <button type="button" onClick={handleAddResumeUpload} className="w-full mt-2 bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3 rounded-xl shadow-md transition-colors">Upload & Link</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Notes</label>
            <textarea name="notes" value={addForm.notes} onChange={handleAddChange} rows={2} className={`${inputBase} resize-none`} />
          </div>
          <button type="button" onClick={saveNewApp} className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-1">
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
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Company *</label>
            <input name="company" value={editForm.company} onChange={handleEditChange} className={inputBase} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Job Title *</label>
            <input name="title" value={editForm.title} onChange={handleEditChange} className={inputBase} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Date *</label>
              <input type="date" name="date" value={editForm.date} onChange={handleEditChange} className={inputBase} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Status *</label>
              <select name="status" value={editForm.status} onChange={handleEditChange} className={`${inputBase} select-field`}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Follow-Up</label>
              <input type="date" name="followUpDate" value={editForm.followUpDate} onChange={handleEditChange} className={inputBase} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Location</label>
              <LocationField value={editForm.location} onChange={(v) => setEditForm((p) => ({ ...p, location: v }))} inputClassName={inputBase} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Resume Used</label>
              <button type="button" onClick={() => setShowEditResumeUpload((p) => !p)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                {showEditResumeUpload ? 'Hide upload' : 'Upload new'}
              </button>
            </div>
            <select name="resumeId" value={editForm.resumeId} onChange={handleEditChange} className={`${inputBase} select-field`}>
              <option value="">None</option>
              {resumes.map((r) => <option key={r.id} value={r.id}>{r.label || r.fileName}</option>)}
            </select>
            {editForm.resumeId && (
              <p className="text-xs text-slate-500 dark:text-slate-300 font-medium mt-1 ml-1">Currently linked: {resumeLabelById(editForm.resumeId)}</p>
            )}
            {showEditResumeUpload && (
              <div className="mt-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl p-3">
                <button type="button" onClick={handleEditResumeFilePick} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-white dark:hover:bg-slate-900">
                  Choose File
                </button>
                <input ref={editResumeInputRef} type="file" className="hidden" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleEditResumeFileChange} />
                {editResumeFile && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">Selected: {editResumeFile.name}</p>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2 mb-1 ml-1">Label</label>
                    <input value={editResumeLabel} onChange={(e) => setEditResumeLabel(e.target.value)} className={inputBase} />
                    <button type="button" onClick={handleEditResumeUpload} className="w-full mt-2 bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3 rounded-xl shadow-md transition-colors">Upload & Link</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">Notes</label>
            <textarea name="notes" value={editForm.notes} onChange={handleEditChange} rows={2} className={`${inputBase} resize-none`} />
          </div>
          <button type="button" onClick={saveEditsAndClose} className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-1">
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col min-h-full px-5 pt-5 pb-4 ${pageBg}`}>

      {/* Search bar — top */}
      <div className="relative mb-4">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search by company, role, or location…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all placeholder:text-slate-400 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        />
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
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selected
                    ? 'bg-[#2C6E91] text-white shadow-[0_4px_12px_rgba(44,110,145,0.25)]'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#2C6E91]/40'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar: Archived | Resume filter | Export */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          type="button"
          onClick={() => { setShowArchived((p) => !p); }}
          className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
            showArchived
              ? 'bg-[#2C6E91]/10 border-[#2C6E91]/40 text-[#2C6E91] dark:text-blue-300'
              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          {showArchived ? '← Active' : `Archived${archivedApps.length ? ` (${archivedApps.length})` : ''}`}
        </button>

        {/* Resume filter dropdown */}
        {resumes.length > 0 && (
          <div className="relative" ref={resumeMenuRef}>
            <button
              type="button"
              onClick={() => setShowResumeMenu((p) => !p)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                resumeFilter
                  ? 'bg-[#2C6E91]/10 border-[#2C6E91]/40 text-[#2C6E91] dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {resumeFilter ? resumeLabelById(resumeFilter) : 'Resume'}
              {resumeFilter && (
                <span
                  className="ml-1.5 text-[#2C6E91] dark:text-blue-300"
                  onMouseDown={(e) => { e.stopPropagation(); setResumeFilter(null); setShowResumeMenu(false); }}
                >×</span>
              )}
            </button>
            {showResumeMenu && (
              <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden min-w-[160px]">
                {resumes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onMouseDown={() => { setResumeFilter(r.id); setShowResumeMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      resumeFilter === r.id ? 'text-[#2C6E91]' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {r.label || r.fileName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={exportToCSV}
          disabled={apps.filter((a) => !a.archived).length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-200 text-sm font-medium px-4 py-3 rounded-xl">
          {success}
        </div>
      )}

      {!showArchived ? (
        activeAppsFiltered.length === 0 ? (
        <div className={`${cardBg} ${border} rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.12)] text-center`}>
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 dark:text-blue-300">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
          </div>
          <p className={`text-sm font-semibold ${textMain}`}>
            {activeFilter !== 'all' || resumeFilter ? 'No applications match this filter' : 'No applications yet'}
          </p>
          <p className={`text-xs ${textSub} font-medium mt-1`}>
            {activeFilter !== 'all' || resumeFilter ? 'Try changing the filter or add a new application.' : 'Tap the + button to start tracking your job applications.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeAppsFiltered.map((a) => {
            const color = getCompanyColor(a.company);
            return (
              <div
                key={a.id}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.07)] hover:-translate-y-px transition-all duration-150"
              >
                {/* Top row: avatar + info + menu */}
                <div className="flex items-start gap-3">
                  {/* Company avatar */}
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
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      a.status === 'Applied'
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-[#2C6E91] dark:text-blue-300'
                        : a.status === 'Interview'
                        ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                        : a.status === 'Offer'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {a.status}
                    </span>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId((prev) => (prev === a.id ? null : a.id))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="More actions"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                        </svg>
                      </button>

                      {openMenuId === a.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-10">
                          <button
                            type="button"
                            onClick={() => openEdit(a)}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            View / Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArchive(a.id)}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            Archive
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id)}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2C6E91]/8 dark:bg-[#2C6E91]/15 text-[#2C6E91] dark:text-blue-300 text-[11px] font-semibold">
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
          <div className={`${cardBg} ${border} rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.12)] text-center`}>
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
                  className={`${cardBg} ${border} rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.12)]`}
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
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex-shrink-0"
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

      {/* Sticky FAB — stays visible at the bottom of the phone scroll area */}
      {!showArchived && (
        <div className="sticky bottom-4 flex justify-end pointer-events-none mt-4">
          <button
            type="button"
            onClick={openAdd}
            className="pointer-events-auto w-14 h-14 bg-[#2C6E91] hover:bg-[#1a4a66] text-white rounded-full shadow-[0_4px_20px_rgba(44,110,145,0.45)] flex items-center justify-center transition-all active:scale-95"
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