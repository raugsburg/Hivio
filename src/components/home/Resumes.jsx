import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getResumesStorageKey } from '../../utils/storage';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
];

function readResumesFromStorage(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writeResumesToStorage(storageKey, resumes) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(resumes));
  } catch {}
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function Resumes({ user }) {
  const storageKey = useMemo(() => getResumesStorageKey(user), [user]);
  const fileInputRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [label, setLabel] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // modal + menu state
  const [viewingResume, setViewingResume] = useState(null);
  const [viewLabel, setViewLabel] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load resumes on first render (and when user changes)
  useEffect(() => {
    setResumes(readResumesFromStorage(storageKey));
  }, [storageKey]);

  function persist(next) {
    setResumes(next);
    writeResumesToStorage(storageKey, next);
  }

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

    try {
      const dataUrl = await fileToDataUrl(selectedFile);

      const newResume = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        label: label.trim(),
        uploadedAt: new Date().toISOString(),
        dataUrl,
      };

      const next = [newResume, ...resumes];
      persist(next);

      setSelectedFile(null);
      setLabel('');
      setSuccess('Resume uploaded successfully.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      setError('Upload failed. Please try again.');
    }
  }

  function handleDelete(resumeId) {
    const updated = resumes.filter((r) => r.id !== resumeId);
    persist(updated);

    if (viewingResume?.id === resumeId) {
      setViewingResume(null);
      setViewLabel('');
    }
  }

  function openViewer(resume) {
    setOpenMenuId(null);
    setViewingResume(resume);
    setViewLabel(resume.label || '');
  }

  // return true/false so the Save button can close only on success
  function saveViewerLabel() {
    if (!viewingResume) return false;

    const nextLabel = viewLabel.trim();
    if (!nextLabel) {
      setError('Label cannot be empty.');
      return false;
    }

    const updated = resumes.map((r) =>
      r.id === viewingResume.id ? { ...r, label: nextLabel } : r
    );

    persist(updated);

    // keep modal in sync
    const updatedResume = updated.find((r) => r.id === viewingResume.id);
    setViewingResume(updatedResume || viewingResume);

    setSuccess('Label updated.');
    return true;
  }

  const pageBg = 'bg-[#F7F9FC] dark:bg-slate-950';
  const cardBg = 'bg-white dark:bg-slate-900';
  const border = 'border border-slate-300 dark:border-slate-800';
  const textMain = 'text-slate-900 dark:text-slate-100';
  const textSub = 'text-slate-500 dark:text-slate-300';

  const inputBase =
    'w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all';

  const filteredResumes = searchQuery.trim()
    ? resumes.filter((r) =>
        (r.label || r.fileName || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : resumes;

  return (
    <div className={`relative flex flex-col min-h-full px-5 py-6 ${pageBg}`}>
      <h1 className={`text-2xl font-bold tracking-tight ${textMain} mb-4`}>
        Resumes
      </h1>

      <div className="relative mb-4">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search resumes…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all placeholder:text-slate-400 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        />
      </div>

      {/* Upload section */}
      <div className={`${cardBg} ${border} rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.12)] mb-5`}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h2 className={`text-sm font-bold ${textMain}`}>
              Upload Resume
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">PDF or DOCX • Max 5MB</p>
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            className="bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold px-4 py-2.5 rounded-xl shadow-md transition-colors min-h-[40px] whitespace-nowrap"
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
          <div className="mt-3 border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-950">
            <p className={`text-sm font-semibold ${textMain}`}>
              Selected: {selectedFile.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300 font-medium mt-1">
              {formatBytes(selectedFile.size)}
            </p>

            <div className="mt-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 ml-1">
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
              className="w-full mt-3 bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3 rounded-xl shadow-md transition-colors min-h-[44px]"
            >
              Save Resume
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-200 text-sm font-medium px-4 py-3 rounded-xl">
            {success}
          </div>
        )}
      </div>

      {/* Resume list */}
      <div className="flex-1 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className={`text-sm font-bold ${textMain}`}>
              Your Resumes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Click to view, edit, or delete</p>
          </div>
        </div>

        {resumes.length === 0 ? (
          <div className={`${cardBg} ${border} rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.12)] text-center`}>
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C6E91" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <p className={`text-sm font-semibold ${textMain}`}>No resumes yet</p>
            <p className={`text-xs ${textSub} font-medium mt-1`}>Upload your first resume above to get started.</p>
          </div>
        ) : filteredResumes.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center py-6">No resumes match your search.</p>
        ) : (
          <div className="space-y-2.5">
            {filteredResumes.map((r) => {
              const isPdf = r.fileType === 'application/pdf';
              return (
                <div
                  key={r.id}
                  className={`${cardBg} ${border} rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.07)] hover:-translate-y-px transition-all duration-150`}
                >
                  <div className="flex items-center gap-3">
                    {/* File type icon */}
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-[11px] tracking-tight select-none ${
                      isPdf
                        ? 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400'
                        : 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    }`}>
                      {isPdf ? 'PDF' : 'DOC'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${textMain} truncate leading-snug`}>
                        {r.label || r.fileName}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
                        {formatBytes(r.fileSize)} · {new Date(r.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Menu */}
                    <div className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId((prev) => (prev === r.id ? null : r.id))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="More actions"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                        </svg>
                      </button>

                      {openMenuId === r.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-10">
                          <button
                            type="button"
                            onClick={() => openViewer(r)}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            View / Edit label
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
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

      {/* In-app viewer modal (frame constrained) */}
      {viewingResume && (
        <div
          className="absolute inset-0 z-50 bg-black/40 p-4 overflow-y-auto"
          onClick={() => setViewingResume(null)}
        >
          <div
            className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${textMain} truncate`}>
                  {viewingResume.label || viewingResume.fileName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-300 font-medium truncate">
                  {viewingResume.fileName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingResume(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="p-3 max-h-[85vh] overflow-y-auto">
              {/* Label editing only inside viewer */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 ml-1">
                  Label
                </label>
                <div className="flex gap-2">
                  <input
                    value={viewLabel}
                    onChange={(e) => setViewLabel(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const ok = saveViewerLabel();
                      if (ok) setViewingResume(null); // close instantly only if save succeeds
                    }}
                    className="px-4 py-3 rounded-xl bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>

              {viewingResume.fileType === 'application/pdf' ? (
                <iframe
                  title="Resume preview"
                  src={viewingResume.dataUrl}
                  className="w-full h-[60vh] rounded-xl border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="text-sm text-slate-700 dark:text-slate-200">
                  <p className="font-semibold mb-2">
                    Preview not available for DOCX.
                  </p>
                  <p className="text-slate-500 dark:text-slate-300 text-sm mb-3">
                    You can download/open the file instead.
                  </p>

                  <a
                    href={viewingResume.dataUrl}
                    download={viewingResume.fileName}
                    className="inline-block px-4 py-2 rounded-xl bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold transition-colors"
                  >
                    Download DOCX
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Resumes;