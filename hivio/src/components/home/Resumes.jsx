import React, { useRef, useState } from 'react';
function Resumes({ user }) {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const fileInputRef = useRef(null);
  // Close menu on outside click
  React.useEffect(() => {
    if (menuOpenId === null) return;
    const handleClick = (e) => {
      // Only close if not clicking a menu button
      if (!e.target.closest('.resume-menu')) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpenId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const newResume = {
        id: Date.now(),
        name: file.name,
        file,
        label: '',
      };
      setResumes((prev) => [...prev, newResume]);
    }
    e.target.value = '';
  };

  const handleLabelChange = (id, newLabel) => {
    setResumes((prev) =>
      prev.map((resume) =>
        resume.id === id ? { ...resume, label: newLabel } : resume
      )
    );
  };

  const handleLabelBlur = () => {
    setEditingLabelId(null);
  };

  const handleLabelKeyDown = (e) => {
    if (e.key === 'Enter') {
      setEditingLabelId(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleResumeClick = (resume) => {
    setSelectedResumeId(resume.id);
  };

  const handleBackToList = () => {
    setSelectedResumeId(null);
  };

  const handleDeleteResume = (id) => {
    setResumes((prev) => prev.filter((resume) => resume.id !== id));
    if (selectedResumeId === id) {
      setSelectedResumeId(null);
    }
  };

  return (
    <div className="flex flex-col px-5 py-6 bg-[#F7F9FC] overflow-x-hidden">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Resumes</h1>
      <p className="text-sm text-slate-500 font-medium mb-6">Manage your resume versions.</p>

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className="flex-1 flex flex-col items-center justify-center text-center w-full overflow-x-hidden">
        {selectedResumeId ? (() => {
          const selectedResume = resumes.find(r => r.id === selectedResumeId);
          if (!selectedResume) return null;
          return (
            <div className="w-full max-w-xl bg-white rounded-lg shadow p-6 flex flex-col items-start overflow-x-hidden">
              <button
                className="mb-4 text-[#2C6E91] hover:underline text-sm font-medium self-start"
                onClick={handleBackToList}
              >
                ← Back to list
              </button>
              <div className="font-bold text-lg text-slate-900 mb-2">{selectedResume.name}</div>
              <div className="mb-2 text-slate-700 flex flex-row items-center gap-2 mt-2">
                <span className="font-medium">Label:</span>
                {editingLabelId === selectedResume.id ? (
                  <input
                    className="border border-slate-300 rounded px-2 py-1 text-sm"
                    type="text"
                    autoFocus
                    placeholder="Add a label (e.g. 'Software Engineer', '2026')"
                    value={selectedResume.label}
                    onClick={e => e.stopPropagation()}
                    onChange={e => handleLabelChange(selectedResume.id, e.target.value)}
                    onBlur={handleLabelBlur}
                    onKeyDown={handleLabelKeyDown}
                    style={{ minWidth: 120 }}
                  />
                ) : (
                  <span
                    className="text-slate-700 text-sm cursor-pointer min-h-[32px] px-1 flex items-center"
                    onClick={e => {
                      e.stopPropagation();
                      setEditingLabelId(selectedResume.id);
                    }}
                  >
                    {selectedResume.label ? (
                      <span className="font-bold">{selectedResume.label}</span>
                    ) : (
                      <span className="italic text-slate-400">Add a label</span>
                    )}
                  </span>
                )}
              </div>
              <a
                href={URL.createObjectURL(selectedResume.file)}
                download={selectedResume.name}
                className="text-[#2C6E91] hover:underline text-sm font-medium mb-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Resume
              </a>
              <iframe
                src={URL.createObjectURL(selectedResume.file)}
                title="Resume Preview"
                className="w-full h-96 border rounded mt-2"
              />
            </div>
          );
        })() : resumes.length === 0 ? (
          <div>
            <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 mb-4 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-4">No resumes uploaded yet.</p>
          </div>
        ) : (
          <div className="w-full max-w-xl space-y-4 overflow-x-hidden">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex flex-col sm:flex-row sm:items-center bg-white rounded-lg shadow p-4 mb-2 cursor-pointer hover:bg-slate-50 transition w-full overflow-x-hidden"
                onClick={() => handleResumeClick(resume)}
              >
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{resume.name}</div>
                  {editingLabelId === resume.id ? (
                    <input
                      className="mt-2 border border-slate-300 rounded px-2 py-1 text-sm w-full"
                      type="text"
                      autoFocus
                      placeholder="Add a label (e.g. 'Software Engineer', '2026')"
                      value={resume.label}
                      onClick={e => e.stopPropagation()}
                      onChange={(e) => handleLabelChange(resume.id, e.target.value)}
                      onBlur={handleLabelBlur}
                      onKeyDown={handleLabelKeyDown}
                    />
                  ) : (
                    <div
                      className="mt-2 text-slate-600 text-sm cursor-pointer min-h-[32px]"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingLabelId(resume.id);
                      }}
                    >
                      {resume.label ? (
                        <span className="font-bold">{resume.label}</span>
                      ) : (
                        <span className="italic text-slate-400">Add a label</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-row gap-2 flex-shrink-0 mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto justify-end">
                  {menuOpenId === resume.id ? (
                    <div className="resume-menu flex flex-row gap-2">
                      <a
                        href={URL.createObjectURL(resume.file)}
                        download={resume.name}
                        className="text-[#2C6E91] hover:underline text-sm font-medium px-3 py-1 rounded border border-slate-200 bg-slate-50"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => {
                          e.stopPropagation();
                          setMenuOpenId(null);
                        }}
                      >
                        Download
                      </a>
                      <button
                        className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 rounded border border-red-200 bg-red-50"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteResume(resume.id);
                          setMenuOpenId(null);
                        }}
                        title="Delete resume"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      className="resume-menu px-2 py-1 rounded hover:bg-slate-100 text-slate-500"
                      onClick={e => {
                        e.stopPropagation();
                        setMenuOpenId(resume.id);
                      }}
                      title="Open menu"
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {!selectedResumeId && (
          <button
            className="mt-6 bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-colors min-h-[44px]"
            onClick={handleUploadClick}
          >
            Upload Resume
          </button>
        )}
      </div>
    </div>
  );
}

export default Resumes;