import React, { useState } from 'react';
import { auth, db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { seedUserData, clearUserData } from '../../utils/seedData';

const STARS = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];

function DevPage({ onBack }) {
  const user = auth.currentUser;
  const [targetUid, setTargetUid] = useState(user?.uid || '');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState(null);
  const [countLoading, setCountLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [fbLoading, setFbLoading] = useState(false);

  async function handleSeed() {
    if (!targetUid.trim()) return setStatus('Enter a UID first.');
    setLoading(true);
    setStatus('');
    try {
      await seedUserData(targetUid.trim());
      setStatus(`Seed complete — 20–24 apps, resumes & reminders written to ${targetUid.trim()}.`);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    if (!targetUid.trim()) return setStatus('Enter a UID first.');
    setLoading(true);
    setStatus('');
    try {
      await clearUserData(targetUid.trim());
      setStatus(`Cleared all data for ${targetUid.trim()}.`);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCount() {
    if (!targetUid.trim()) return;
    setCountLoading(true); setCounts(null);
    try {
      const [apps, resumes, reminders] = await Promise.all([
        getDocs(collection(db, 'users', targetUid.trim(), 'applications')),
        getDocs(collection(db, 'users', targetUid.trim(), 'resumes')),
        getDocs(collection(db, 'users', targetUid.trim(), 'reminders')),
      ]);
      setCounts({ apps: apps.size, resumes: resumes.size, reminders: reminders.size });
    } catch (e) { setCounts({ error: e.message }); }
    finally { setCountLoading(false); }
  }

  async function handleLoadFeedback() {
    setFbLoading(true); setFeedback(null);
    try {
      const snap = await getDocs(collection(db, 'feedback'));
      const entries = snap.docs
        .map((d) => d.data())
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setFeedback(entries);
    } catch (e) { setFeedback([{ error: e.message }]); }
    finally { setFbLoading(false); }
  }

  return (
    <div className="flex flex-col px-5 pt-6 pb-6 bg-[#F7F9FC] dark:bg-slate-950">
      <div className="flex items-start gap-3 mb-5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-1 w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex-shrink-0 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Developer Console</h1>
          <p className="text-xs text-slate-400 mt-0.5">Seed or clear any account by UID.</p>
        </div>
      </div>

      {/* Auth info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 mb-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Signed in as</p>
        <p className="text-sm font-mono text-slate-800 dark:text-slate-200 break-all">{user?.uid || 'Not signed in'}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email || ''}</p>
      </div>

      {/* Seed controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Target UID</p>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={targetUid}
            onChange={(e) => setTargetUid(e.target.value)}
            placeholder="Paste a Firebase UID…"
            className="flex-1 px-3 py-2 rounded-xl text-sm font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {user?.uid && targetUid !== user.uid && (
            <button
              type="button"
              onClick={() => setTargetUid(user.uid)}
              className="text-xs text-indigo-500 hover:underline whitespace-nowrap"
            >
              Use mine
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSeed}
            disabled={loading || !targetUid.trim()}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
          >
            {loading ? 'Working…' : 'Seed account'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading || !targetUid.trim()}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-colors"
          >
            {loading ? 'Working…' : 'Clear account'}
          </button>
        </div>
        {status && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{status}</p>
        )}
      </div>

      {/* Doc count */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 mt-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Data Summary</p>
        <button type="button" onClick={handleCount} disabled={countLoading || !targetUid.trim()}
          className="w-full py-2 rounded-xl text-sm font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-800 dark:text-slate-100 transition-colors">
          {countLoading ? 'Counting…' : 'Check data for UID above'}
        </button>
        {counts && !counts.error && (
          <div className="flex gap-4 text-sm">
            <span className="text-slate-700 dark:text-slate-300"><span className="font-bold">{counts.apps}</span> apps</span>
            <span className="text-slate-700 dark:text-slate-300"><span className="font-bold">{counts.resumes}</span> resumes</span>
            <span className="text-slate-700 dark:text-slate-300"><span className="font-bold">{counts.reminders}</span> reminders</span>
          </div>
        )}
        {counts?.error && <p className="text-xs text-red-500">{counts.error}</p>}
      </div>

      {/* Feedback reader */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 mt-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">User Feedback</p>
        <button type="button" onClick={handleLoadFeedback} disabled={fbLoading}
          className="w-full py-2 rounded-xl text-sm font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-800 dark:text-slate-100 transition-colors">
          {fbLoading ? 'Loading…' : feedback ? 'Refresh' : 'Load feedback'}
        </button>
        {feedback && (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {feedback.length === 0 && <p className="text-xs text-slate-400">No feedback yet.</p>}
            {feedback.map((f, i) => f.error ? (
              <p key={i} className="text-xs text-red-500">{f.error}</p>
            ) : (
              <div key={f.id || i} className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{f.email}</span>
                  <span className="text-xs text-amber-400">{STARS[f.rating] || ''}</span>
                </div>
                {f.comment && <p className="text-xs text-slate-500 dark:text-slate-400">{f.comment}</p>}
                <p className="text-[11px] text-slate-400">{new Date(f.submittedAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DevPage;
