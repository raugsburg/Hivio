import React, { useEffect, useMemo, useRef, useState } from 'react';

/* Storage helpers */
function getApplicationsStorageKey(user) {
  const email = user?.email || 'anonymous';
  return `hivio_applications_${email.toLowerCase()}`;
}

function getApplicationsIntentKey(user) {
  const email = user?.email || 'anonymous';
  return `hivio_applications_intent_${email.toLowerCase()}`;
}

function scrollAppContainerToTop() {
  const el = document.getElementById('app-scroll-container');
  if (el) el.scrollTo({ top: 0, behavior: 'auto' });
}

function readApps(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeApps(storageKey, apps) {
  localStorage.setItem(storageKey, JSON.stringify(apps));
}

/* Resumes storage (linking + upload) */
function getResumesStorageKey(user) {
  const email = user?.email || 'anonymous';
  return `hivio_resumes_${email.toLowerCase()}`;
}

function readResumes(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeResumes(storageKey, resumes) {
  localStorage.setItem(storageKey, JSON.stringify(resumes));
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

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
];

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

function isValidDateStringYYYYMMDD(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function Applications({ user }) {
  const appsStorageKey = useMemo(() => getApplicationsStorageKey(user), [user]);
  const resumesStorageKey = useMemo(() => getResumesStorageKey(user), [user]);
  const intentKey = useMemo(() => getApplicationsIntentKey(user), [user]);

  const [apps, setApps] = useState([]);
  const [resumes, setResumes] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm());

  const [editingApp, setEditingApp] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm());

  const [openMenuId, setOpenMenuId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const [activeFilter, setActiveFilter] = useState('all');

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
    const modalOpen = showAdd || Boolean(editingApp);
    if (!modalOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showAdd, editingApp]);

  function persistApps(next) {
    setApps(next);
    writeApps(appsStorageKey, next);
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

  function openAdd() {
    scrollAppContainerToTop
    setSuccess('');
    setError('');
    setAddForm(emptyForm());

    setShowAddResumeUpload(false);
    setAddResumeFile(null);
    setAddResumeLabel('');
    if (addResumeInputRef.current) addResumeInputRef.current.value = '';

    setShowAdd(true);
  }

  function closeAdd() {
    setShowAdd(false);
    setError('');
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
  }

  function closeEdit() {
    setEditingApp(null);
    setError('');
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
    setShowAdd(false);
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
    setEditingApp(null);
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

  const activeAppsAll = apps.filter((a) => !a.archived);

  const activeAppsFiltered = (() => {
    if (activeFilter === 'all') return activeAppsAll;

    if (activeFilter === 'followups') {
      return [...activeAppsAll]
        .filter((a) => isValidDateStringYYYYMMDD(a.followUpDate))
        .sort((a, b) => (a.followUpDate || '').localeCompare(b.followUpDate || ''));
    }

    return activeAppsAll.filter((a) => (a.status || 'Applied') === activeFilter);
  })();

  const archivedApps = apps.filter((a) => a.archived);

  return (
    <div className="relative flex flex-col min-h-full px-5 py-6 bg-[#F7F9FC]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
            Applications
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Track every job you&apos;ve applied to.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold px-4 py-2 rounded-xl shadow-md transition-colors min-h-[40px]"
        >
          + Add
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => {
            const selected = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveFilter(chip.id)}
                className={
                  selected
                    ? 'px-3 py-2 rounded-xl bg-[#2C6E91] text-white text-xs font-semibold shadow-sm'
                    : 'px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50'
                }
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => setShowArchived((p) => !p)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
        >
          {showArchived ? 'Hide archived' : 'Show archived'}
          {archivedApps.length ? ` (${archivedApps.length})` : ''}
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl">
          {success}
        </div>
      )}

      {activeAppsFiltered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
          <p className="text-sm font-medium text-slate-500">
            No applications found.
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Try changing the filter or add a new application.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeAppsFiltered.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {a.title}
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                    {a.company}
                    {a.location ? ` • ${a.location}` : ''}
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Applied on {a.date}
                  </p>

                  {a.followUpDate ? (
                    <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                      Follow-up: {a.followUpDate}
                    </p>
                  ) : null}

                  {a.resumeId ? (
                    <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                      Resume: {resumeLabelById(a.resumeId)}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                    {a.status}
                  </span>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId((prev) => (prev === a.id ? null : a.id))
                      }
                      className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                      aria-label="More actions"
                    >
                      ⋯
                    </button>

                    {openMenuId === a.id && (
                      <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-10">
                        <button
                          type="button"
                          onClick={() => openEdit(a)}
                          className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View / Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchive(a.id)}
                          className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Archive
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(a.id)}
                          className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {a.notes ? (
                <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap line-clamp-3">
                  {a.notes}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {showArchived && archivedApps.length > 0 && (
        <div className="mt-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            Archived
          </h2>
          <div className="space-y-3">
            {archivedApps.map((a) => (
              <div
                key={a.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {a.title}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                      {a.company}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Applied on {a.date}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUnarchive(a.id)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                  >
                    Unarchive
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <div
          className="absolute inset-0 z-50 bg-black/40 p-4"
          onClick={() => setShowAdd(false)}
          style={{ overscrollBehavior: 'contain' }}
        >
          <div
            className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end px-3 py-2 border-b border-slate-200">
              <button
                type="button"
                onClick={closeAdd}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div
              className="p-4 space-y-3 max-h-[82vh] overflow-y-auto"
              style={{ overscrollBehavior: 'contain' }}
            >
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                  Company *
                </label>
                <input
                  name="company"
                  value={addForm.company}
                  onChange={handleAddChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                  Job Title *
                </label>
                <input
                  name="title"
                  value={addForm.title}
                  onChange={handleAddChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={addForm.date}
                    onChange={handleAddChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={addForm.status}
                    onChange={handleAddChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                    Follow-Up
                  </label>
                  <input
                    type="date"
                    name="followUpDate"
                    value={addForm.followUpDate}
                    onChange={handleAddChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                    Location
                  </label>
                  <input
                    name="location"
                    value={addForm.location}
                    onChange={handleAddChange}
                    placeholder="Remote / City"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                    Resume Used
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowAddResumeUpload((p) => !p)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    {showAddResumeUpload ? 'Hide upload' : 'Upload new'}
                  </button>
                </div>

                <select
                  name="resumeId"
                  value={addForm.resumeId}
                  onChange={handleAddChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                >
                  <option value="">None</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label || r.fileName}
                    </option>
                  ))}
                </select>

                {showAddResumeUpload && (
                  <div className="mt-2 border border-slate-200 bg-slate-50 rounded-xl p-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddResumeFilePick}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-white"
                      >
                        Choose File
                      </button>

                      <input
                        ref={addResumeInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleAddResumeFileChange}
                      />
                    </div>

                    {addResumeFile && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-600 font-medium truncate">
                          Selected: {addResumeFile.name}
                        </p>

                        <label className="block text-xs font-semibold text-slate-600 mt-2 mb-1 ml-1">
                          Label
                        </label>
                        <input
                          value={addResumeLabel}
                          onChange={(e) => setAddResumeLabel(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                        />

                        <button
                          type="button"
                          onClick={handleAddResumeUpload}
                          className="w-full mt-2 bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3 rounded-xl shadow-md transition-colors"
                        >
                          Upload & Link
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={addForm.notes}
                  onChange={handleAddChange}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all resize-none"
                />
              </div>

              <button
                type="button"
                onClick={saveNewApp}
                className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-1"
              >
                Save Application
              </button>
            </div>
          </div>
        </div>
      )}

      {editingApp && (
        <div
          className="absolute inset-0 z-50 bg-black/40 p-4"
          onClick={closeEdit}
          style={{ overscrollBehavior: 'contain' }}
        >
          <div
            className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end px-3 py-2 border-b border-slate-200">
              <button
                type="button"
                onClick={closeEdit}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div
              className="p-4 space-y-3 max-h-[82vh] overflow-y-auto"
              style={{ overscrollBehavior: 'contain' }}
            >
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                  Company *
                </label>
                <input
                  name="company"
                  value={editForm.company}
                  onChange={handleEditChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                  Job Title *
                </label>
                <input
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={editForm.date}
                    onChange={handleEditChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                    Follow-Up
                  </label>
                  <input
                    type="date"
                    name="followUpDate"
                    value={editForm.followUpDate}
                    onChange={handleEditChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                    Location
                  </label>
                  <input
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    placeholder="Remote / City"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                    Resume Used
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowEditResumeUpload((p) => !p)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    {showEditResumeUpload ? 'Hide upload' : 'Upload new'}
                  </button>
                </div>

                <select
                  name="resumeId"
                  value={editForm.resumeId}
                  onChange={handleEditChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                >
                  <option value="">None</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label || r.fileName}
                    </option>
                  ))}
                </select>

                {editForm.resumeId ? (
                  <p className="text-xs text-slate-500 font-medium mt-1 ml-1">
                    Currently linked: {resumeLabelById(editForm.resumeId)}
                  </p>
                ) : null}

                {showEditResumeUpload && (
                  <div className="mt-2 border border-slate-200 bg-slate-50 rounded-xl p-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleEditResumeFilePick}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-white"
                      >
                        Choose File
                      </button>

                      <input
                        ref={editResumeInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleEditResumeFileChange}
                      />
                    </div>

                    {editResumeFile && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-600 font-medium truncate">
                          Selected: {editResumeFile.name}
                        </p>

                        <label className="block text-xs font-semibold text-slate-600 mt-2 mb-1 ml-1">
                          Label
                        </label>
                        <input
                          value={editResumeLabel}
                          onChange={(e) => setEditResumeLabel(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                        />

                        <button
                          type="button"
                          onClick={handleEditResumeUpload}
                          className="w-full mt-2 bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3 rounded-xl shadow-md transition-colors"
                        >
                          Upload & Link
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={editForm.notes}
                  onChange={handleEditChange}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all resize-none"
                />
              </div>

              <button
                type="button"
                onClick={saveEditsAndClose}
                className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors mt-1"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Applications;