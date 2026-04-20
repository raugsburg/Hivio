import React, { useEffect, useRef, useState } from 'react';
import { subscribeResumes, saveResume, updateResumeLabel, deleteResume, subscribeApplications, saveApplication } from '../../utils/db';

// Module-level cache — survives tab switches (component unmount/remount)
const dataUrlCache = new Map();

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function Resumes({ user }) {
  const fileInputRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [label, setLabel] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const [viewingResume, setViewingResume] = useState(null);
  const [viewLabel, setViewLabel] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [apps, setApps] = useState([]);
  const [linkingResume, setLinkingResume] = useState(null);
  const [linkSelected, setLinkSelected] = useState(new Set());
  const [linkSearch, setLinkSearch] = useState('');
  const [linkFilter, setLinkFilter] = useState('all');

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeResumes(user.uid, setResumes);
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeApplications(user.uid, setApps);
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!openMenuId) return;
    function onDocClick() { setOpenMenuId(null); }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openMenuId]);

  function openFilePicker() {
    setError('');
    setSuccess('');
    fileInputRef.current?.click();
  }

  function validateFile(file) {
    if (!file) return 'Please select a file.';
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Unsupported file type. Please upload a PDF or DOCX.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return 'File is too large. Please upload a file under 5MB.';
    }
    return '';
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    setSuccess('');
    setError('');

    const validationError = validateFile(file);
    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setLabel(file.name.replace(/\.[^/.]+$/, '')); // default label = file name without extension
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSaveResume() {
    setError('');
    setSuccess('');

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!label.trim()) {
      setError('Please add a label so you can identify this resume later.');
      return;
    }

    setSaving(true);
    try {
      const dataUrl = await fileToDataUrl(selectedFile);
      const newResume = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        label: label.trim(),
        uploadedAt: new Date().toISOString(),
      };

      await saveResume(user.uid, newResume);
      dataUrlCache.set(newResume.id, dataUrl);

      setSelectedFile(null);
      setLabel('');
      setSuccess('Resume saved successfully.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      setError('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(resumeId) {
    try {
      await deleteResume(user.uid, resumeId);
    } catch {
      setError('Delete failed. Please try again.');
    }
    if (viewingResume?.id === resumeId) {
      setViewingResume(null);
      setViewLabel('');
    }
  }

  function openViewer(resume) {
    setOpenMenuId(null);
    const el = document.getElementById('app-scroll-container');
    if (el) el.scrollTo({ top: 0, behavior: 'auto' });
    setViewingResume({ ...resume, dataUrl: dataUrlCache.get(resume.id) });
    setViewLabel(resume.label || '');
  }

  function openLinkView(resume) {
    setOpenMenuId(null);
    const el = document.getElementById('app-scroll-container');
    if (el) el.scrollTo({ top: 0, behavior: 'auto' });
    const alreadyLinked = new Set(apps.filter((a) => !a.archived && a.resumeId === resume.id).map((a) => a.id));
    setLinkSelected(alreadyLinked);
    setLinkSearch('');
    setLinkFilter('all');
    setLinkingResume(resume);
  }

  async function saveLinkApps() {
    if (!linkingResume) return;
    setSaving(true);
    const activeApps = apps.filter((a) => !a.archived);
    try {
      await Promise.all(activeApps.map((a) => {
        const shouldLink = linkSelected.has(a.id);
        const alreadyLinked = a.resumeId === linkingResume.id;
        if (shouldLink && !alreadyLinked) {
          return saveApplication(user.uid, { ...a, resumeId: linkingResume.id, updatedAt: new Date().toISOString() });
        }
        if (!shouldLink && alreadyLinked) {
          return saveApplication(user.uid, { ...a, resumeId: '', updatedAt: new Date().toISOString() });
        }
        return Promise.resolve();
      }));
      setSuccess(`Linked to ${linkSelected.size} application${linkSelected.size !== 1 ? 's' : ''}.`);
      setLinkingResume(null);
      setLinkSelected(new Set());
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Link failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function saveViewerLabel() {
    if (!viewingResume) return false;

    const nextLabel = viewLabel.trim();
    if (!nextLabel) {
      setError('Label cannot be empty.');
      return false;
    }

    setSaving(true);
    try {
      await updateResumeLabel(user.uid, viewingResume.id, nextLabel);
      setViewingResume((prev) => prev ? { ...prev, label: nextLabel } : prev);
      setSuccess('Label updated.');
      return true;
    } catch {
      setError('Failed to update label.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  const pageBg = 'bg-hivio-bg dark:bg-hivio-bg-dark';
  const cardBg = 'bg-hivio-surface dark:bg-hivio-surface-dark';
  const border = 'border border-[#C4CDD6] dark:border-hivio-border-dark';
  const textMain = 'text-hivio-text-primary dark:text-hivio-text-primary-dark';
  const textSub = 'text-hivio-text-secondary dark:text-hivio-text-secondary-dark';

  const inputBase =
    'w-full text-sm font-normal text-hivio-text-primary dark:text-hivio-text-primary-dark bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-sm px-3 py-2 shadow-hivio-sm placeholder:text-hivio-text-muted dark:placeholder:text-hivio-text-muted-dark focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 ease-in-out';

  const filteredResumes = searchQuery.trim()
    ? resumes.filter((r) =>
        (r.label || r.fileName || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : resumes;

  // ── Viewer view ──────────────────────────────────────────────────────────────
  if (viewingResume) {
    return (
      <div className={`flex flex-col min-h-full px-5 pt-4 pb-8 ${pageBg}`}>
        {/* Header */}
        <div className="relative flex items-center justify-center h-10 mb-5">
          <button
            type="button"
            onClick={() => setViewingResume(null)}
            className="w-10 h-10 flex items-center justify-center rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-secondary dark:text-hivio-text-secondary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 flex-shrink-0 absolute left-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div className="text-center">
            <h1 className="text-base font-bold text-hivio-text-primary dark:text-hivio-text-primary-dark truncate max-w-[200px]">
              {viewingResume.label || viewingResume.fileName}
            </h1>
            <p className="text-[11px] text-hivio-text-muted dark:text-hivio-text-muted-dark truncate max-w-[200px]">
              {viewingResume.fileName}
            </p>
          </div>
        </div>

        {/* Label edit row */}
        <div className="flex gap-2 mb-4">
          <input
            value={viewLabel}
            onChange={(e) => setViewLabel(e.target.value)}
            placeholder="Label"
            className="flex-1 text-sm text-hivio-text-primary dark:text-hivio-text-primary-dark bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-md px-3 py-2.5 shadow-hivio-sm placeholder:text-hivio-text-muted focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150"
          />
          <button
            type="button"
            onClick={async () => { const ok = await saveViewerLabel(); if (ok) setViewingResume(null); }}
            disabled={saving}
            className="bg-hivio-primary hover:bg-hivio-primary-hover text-hivio-text-inverse text-sm font-medium px-4 py-2.5 rounded-md shadow-hivio-sm transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>

        {/* Error / success */}
        {error && <div className="mb-3 bg-hivio-status-rejected-bg dark:bg-hivio-status-rejected-bg-dark border border-hivio-status-rejected/20 dark:border-hivio-status-rejected-dark/20 text-hivio-status-rejected dark:text-hivio-status-rejected-dark text-sm font-medium px-4 py-2.5 rounded-md">{error}</div>}
        {success && <div className="mb-3 bg-hivio-status-offer-bg dark:bg-hivio-status-offer-bg-dark border border-hivio-status-offer/20 dark:border-hivio-status-offer-dark/20 text-hivio-status-offer dark:text-hivio-status-offer-dark text-sm font-medium px-4 py-2.5 rounded-md">{success}</div>}

        {/* Preview */}
        {!viewingResume.dataUrl ? (
          <div className="bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-lg p-8 text-center shadow-hivio">
            <p className="text-sm font-semibold text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1">Preview not available</p>
            <p className="text-xs text-hivio-text-secondary dark:text-hivio-text-secondary-dark">
              Previews are only stored for the current session. Delete this entry and re-upload to enable preview.
            </p>
          </div>
        ) : viewingResume.fileType === 'application/pdf' ? (
          <iframe
            title="Resume preview"
            src={viewingResume.dataUrl}
            className="w-full flex-1 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark"
            style={{ minHeight: '70vh' }}
          />
        ) : (
          <div className="bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-lg p-6 text-center shadow-hivio">
            <p className="text-sm font-semibold text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1">DOCX preview not supported</p>
            <p className="text-xs text-hivio-text-secondary dark:text-hivio-text-secondary-dark mb-4">Download the file to view it.</p>
            <a
              href={viewingResume.dataUrl}
              download={viewingResume.fileName}
              className="inline-block bg-hivio-primary hover:bg-hivio-primary-hover text-hivio-text-inverse text-sm font-medium px-4 py-2 rounded-md shadow-hivio-sm transition-colors duration-150"
            >
              Download DOCX
            </a>
          </div>
        )}
      </div>
    );
  }

  // ── Link to applications view ───────────────────────────────────────────────
  if (linkingResume) {
    const activeApps = apps.filter((a) => !a.archived);
    const filteredLinkApps = activeApps.filter((a) => {
      const matchesFilter = linkFilter === 'all' || a.status === linkFilter;
      const q = linkSearch.trim().toLowerCase();
      const matchesSearch = !q || a.company?.toLowerCase().includes(q) || a.title?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
    const STATUS_CHIPS = ['all', 'Applied', 'Interview', 'Offer', 'Rejected'];

    return (
      <div className={`flex flex-col min-h-full px-5 pt-4 ${pageBg}`}>
        {/* Header */}
        <div className="relative flex items-center justify-center h-10 mb-4">
          <button
            type="button"
            onClick={() => setLinkingResume(null)}
            className="w-10 h-10 flex items-center justify-center rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-secondary dark:text-hivio-text-secondary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 flex-shrink-0 absolute left-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h1 className="text-base font-bold text-hivio-text-primary dark:text-hivio-text-primary-dark">Link to Apps</h1>
        </div>

        {/* Resume badge */}
        <div className="bg-hivio-bg dark:bg-hivio-bg-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-md px-4 py-2.5 mb-4 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-hivio-primary flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark truncate">{linkingResume.label || linkingResume.fileName}</p>
        </div>

        {activeApps.length === 0 ? (
          <div className="bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-lg p-8 text-center shadow-hivio mb-4">
            <p className="text-sm font-semibold text-hivio-text-primary dark:text-hivio-text-primary-dark">No active applications yet.</p>
            <p className="text-xs text-hivio-text-secondary dark:text-hivio-text-secondary-dark mt-1">Add applications first, then link your resume.</p>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-hivio-text-muted pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search by company or role…"
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                className="w-full bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark rounded-md pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 placeholder:text-hivio-text-muted shadow-hivio-sm"
              />
            </div>

            {/* Status filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
              {STATUS_CHIPS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setLinkFilter(s)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 ${
                    linkFilter === s
                      ? 'bg-hivio-primary text-hivio-text-inverse shadow-hivio-sm'
                      : 'bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-secondary dark:text-hivio-text-secondary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10'
                  }`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>

            {/* App checklist */}
            {filteredLinkApps.length === 0 ? (
              <p className="text-sm text-hivio-text-muted dark:text-hivio-text-muted-dark text-center py-6">No applications match.</p>
            ) : (
              <div className="space-y-2 pb-24">
                {filteredLinkApps.map((a) => {
                  const checked = linkSelected.has(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setLinkSelected((prev) => {
                        const next = new Set(prev);
                        checked ? next.delete(a.id) : next.add(a.id);
                        return next;
                      })}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border transition-colors duration-150 text-left ${
                        checked
                          ? 'border-hivio-border-focus bg-hivio-primary-light dark:bg-hivio-primary/10'
                          : 'border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-surface dark:bg-hivio-surface-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors duration-150 ${
                        checked ? 'bg-hivio-primary border-hivio-primary' : 'border-[#C4CDD6] dark:border-hivio-border-dark'
                      }`}>
                        {checked && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark truncate">{a.company}</p>
                        <p className="text-xs text-hivio-text-muted dark:text-hivio-text-muted-dark truncate">{a.title}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                        a.status === 'Applied' ? 'bg-hivio-status-applied-bg text-hivio-status-applied dark:bg-hivio-status-applied-bg-dark dark:text-white'
                        : a.status === 'Interview' ? 'bg-hivio-status-interview-bg text-hivio-status-interview dark:bg-hivio-status-interview-bg-dark dark:text-white'
                        : a.status === 'Offer' ? 'bg-hivio-status-offer-bg text-hivio-status-offer dark:bg-hivio-status-offer-bg-dark dark:text-white'
                        : 'bg-hivio-status-rejected-bg text-hivio-status-rejected dark:bg-hivio-status-rejected-bg-dark dark:text-white'
                      }`}>{a.status}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Sticky save bar */}
        <div className="sticky bottom-0 pt-3 pb-5 bg-hivio-bg dark:bg-hivio-bg-dark border-t border-[#C4CDD6] dark:border-hivio-border-dark -mx-5 px-5">
          <button
            type="button"
            onClick={saveLinkApps}
            disabled={saving}
            className="w-full bg-hivio-primary hover:bg-hivio-primary-hover text-hivio-text-inverse font-medium py-3.5 rounded-md shadow-hivio-sm transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Save{linkSelected.size > 0 ? ` — ${linkSelected.size} selected` : ''}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col min-h-full px-5 py-6 ${pageBg}`}>
      <div className="relative mb-4">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search resumes…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark text-hivio-text-primary dark:text-hivio-text-primary-dark rounded-md pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 placeholder:text-hivio-text-muted shadow-hivio-sm"
        />
      </div>

      {/* Upload section */}
      <div className={`${cardBg} ${border} rounded-lg shadow-hivio p-5 mb-5`}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h2 className={`text-lg font-semibold ${textMain}`}>
              Upload Resume
            </h2>
            <p className="text-xs font-medium text-hivio-text-muted dark:text-hivio-text-muted-dark mt-0.5">PDF or DOCX • Max 5MB</p>
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            className="bg-hivio-primary text-hivio-text-inverse text-sm font-medium px-4 py-2 rounded-md shadow-hivio-sm hover:bg-hivio-primary-hover transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:ring-offset-2 whitespace-nowrap"
          >
            Choose File
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
          />
        </div>

        {selectedFile && (
          <div className="mt-3 border border-[#C4CDD6] dark:border-hivio-border-dark rounded-md p-4 bg-hivio-bg dark:bg-hivio-bg-dark">
            <p className={`text-sm font-medium ${textMain}`}>
              Selected: {selectedFile.name}
            </p>
            <p className="text-xs font-medium text-hivio-text-muted dark:text-hivio-text-muted-dark mt-1">
              {formatBytes(selectedFile.size)}
            </p>

            <div className="mt-3">
              <label className="text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark mb-1 block">
                Label
              </label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., SWE Internship v1"
                className={inputBase}
              />
            </div>

            <button
              type="button"
              onClick={handleSaveResume}
              disabled={saving}
              className="w-full mt-3 bg-hivio-primary text-hivio-text-inverse text-sm font-medium py-2 rounded-md shadow-hivio-sm hover:bg-hivio-primary-hover transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Save Resume
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-hivio-status-rejected-bg dark:bg-hivio-status-rejected-bg-dark border border-hivio-status-rejected/20 dark:border-hivio-status-rejected-dark/20 text-hivio-status-rejected dark:text-hivio-status-rejected-dark text-sm font-medium px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-3 bg-hivio-status-offer-bg dark:bg-hivio-status-offer-bg-dark border border-hivio-status-offer/20 dark:border-hivio-status-offer-dark/20 text-hivio-status-offer dark:text-hivio-status-offer-dark text-sm font-medium px-4 py-3 rounded-md">
            {success}
          </div>
        )}
      </div>

      {/* Resume list */}
      <div className="flex-1 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className={`text-lg font-semibold ${textMain}`}>
              Your Resumes
            </h2>
            <p className="text-xs font-medium text-hivio-text-muted dark:text-hivio-text-muted-dark mt-0.5">Click to view, edit, or delete</p>
          </div>
        </div>

        {resumes.length === 0 ? (
          <div className={`${cardBg} ${border} rounded-lg shadow-hivio p-5 flex flex-col items-center justify-center py-12 text-center`}>
            <div className="w-12 h-12 rounded-full bg-hivio-primary-light dark:bg-hivio-primary/10 flex items-center justify-center mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <p className={`text-lg font-semibold ${textMain} mb-1`}>No resumes yet</p>
            <p className={`text-sm ${textSub}`}>Upload your first resume above to get started.</p>
          </div>
        ) : filteredResumes.length === 0 ? (
          <p className="text-sm font-medium text-hivio-text-muted dark:text-hivio-text-muted-dark text-center py-6">No resumes match your search.</p>
        ) : (
          <div className="space-y-3">
            {filteredResumes.map((r) => {
              const isPdf = r.fileType === 'application/pdf';
              return (
                <div
                  key={r.id}
                  className={`${cardBg} ${border} rounded-lg shadow-hivio p-4 transition-shadow duration-200 ease-in-out ${!openMenuId ? 'hover:shadow-hivio-md' : openMenuId !== r.id ? 'pointer-events-none' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {/* File type icon */}
                    <div className={`w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-semibold select-none ${
                      isPdf
                        ? 'bg-hivio-status-rejected-bg text-hivio-status-rejected'
                        : 'bg-hivio-status-applied-bg text-hivio-status-applied'
                    }`}>
                      {isPdf ? 'PDF' : 'DOC'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${textMain} truncate`}>
                        {r.label || r.fileName}
                      </p>
                      <p className="text-xs font-medium text-hivio-text-muted dark:text-hivio-text-muted-dark mt-0.5 truncate">
                        {formatBytes(r.fileSize)} · {new Date(r.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Menu */}
                    <div className={`relative flex-shrink-0 ${openMenuId === r.id ? 'z-20' : ''}`}>
                      <button
                        type="button"
                        onClick={() => setOpenMenuId((prev) => (prev === r.id ? null : r.id))}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-hivio-text-muted dark:text-hivio-text-muted-dark hover:text-hivio-text-primary dark:hover:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 ease-in-out"
                        aria-label="More actions"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                        </svg>
                      </button>

                      {openMenuId === r.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-md shadow-hivio-md overflow-hidden z-50" onMouseDown={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openViewer(r)}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 ease-in-out"
                          >
                            View / Edit label
                          </button>
                          {apps.filter((a) => !a.archived).length > 0 && (
                            <button
                              type="button"
                              onClick={() => openLinkView(r)}
                              className="w-full text-left px-4 py-3 text-sm font-medium text-hivio-text-primary dark:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10 transition-colors duration-150 ease-in-out"
                            >
                              Link to applications
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-hivio-status-rejected-bg transition-colors duration-150 ease-in-out"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default Resumes;
