import React, { useEffect, useMemo, useRef, useState } from 'react';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
];

function getResumesStorageKey(user) {
  const email = user?.email || 'anonymous';
  return `hivio_resumes_${email.toLowerCase()}`;
}

function readResumesFromStorage(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writeResumesToStorage(storageKey, resumes) {
  localStorage.setItem(storageKey, JSON.stringify(resumes));
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
  const border = 'border border-slate-200 dark:border-slate-800';
  const textMain = 'text-slate-900 dark:text-slate-100';
  const textSub = 'text-slate-500 dark:text-slate-300';

  const inputBase =
    'w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all';

  return (
    <div className={`relative flex flex-col min-h-full px-5 py-6 ${pageBg}`}>
      <h1 className={`text-2xl font-bold tracking-tight ${textMain} mb-2`}>
        Resumes
      </h1>
      <p className={`text-sm ${textSub} font-medium mb-6`}>
        Upload, label, and manage your resume versions.
      </p>

      {/* Upload section */}
      <div className={`${cardBg} ${border} rounded-2xl p-4 shadow-sm mb-5`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Upload Resume
          </h2>

          <button
            type="button"
            onClick={openFilePicker}
            className="bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold px-4 py-2 rounded-xl shadow-md transition-colors min-h-[40px]"
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

        <div className="mt-3">
          <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
            Accepted: PDF, DOCX. Max size: 5MB.
          </p>

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
      </div>

      {/* Resume list */}
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
          Saved Resumes
        </h2>

        {resumes.length === 0 ? (
          <div className={`${cardBg} ${border} rounded-2xl p-6 shadow-sm text-center`}>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
              No resumes uploaded yet.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Use “Choose File” above to upload your first resume.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((r) => (
              <div
                key={r.id}
                className={`${cardBg} ${border} rounded-2xl p-4 shadow-sm`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${textMain} truncate`}>
                      {r.label || r.fileName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-300 font-medium mt-1 truncate">
                      {r.fileName} • {formatBytes(r.fileSize)}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Uploaded {new Date(r.uploadedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId((prev) => (prev === r.id ? null : r.id))
                        }
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                        aria-label="More actions"
                      >
                        ⋯
                      </button>

                      {openMenuId === r.id && (
                        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-10">
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

                <div className="mt-3 flex gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold">
                    {r.fileType === 'application/pdf' ? 'PDF' : 'DOCX'}
                  </span>
                </div>
              </div>
            ))}
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