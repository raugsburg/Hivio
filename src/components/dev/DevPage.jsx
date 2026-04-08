import React, { useState } from 'react';
import { getAllUsers, deleteUser } from '../../utils/storage';
import { seedUserData, clearUserData } from '../../utils/seedData';

function DevPage({ onBack }) {
  const [, setRefreshKey] = useState(0);
  const [seededEmails, setSeededEmails] = useState({});
  const [confirmClear, setConfirmClear] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  const users = getAllUsers(); // eslint-disable-line react-hooks/exhaustive-deps
  const feedbackList = (() => { try { return JSON.parse(localStorage.getItem('hivio_feedback') || '[]'); } catch { return []; } })();
  const userList = Object.values(users);

  function handleSeed(email) {
    seedUserData(email);
    setSeededEmails((prev) => ({ ...prev, [email]: true }));
    refresh();
  }

  function handleClear(email) {
    clearUserData(email);
    setConfirmClear(null);
    setSeededEmails((prev) => ({ ...prev, [email]: false }));
    refresh();
  }

  function handleDeleteAccount(email) {
    deleteUser(email);
    setConfirmDelete(null);
    setSeededEmails((prev) => ({ ...prev, [email]: false }));
    refresh();
  }

  return (
    <div className="flex flex-col px-5 pt-6 pb-6 bg-[#F7F9FC] dark:bg-slate-950">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-1 w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex-shrink-0 transition-colors"
              aria-label="Back"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Developer Console
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                Dev Only
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 font-medium">
              localStorage snapshot · {userList.length} registered user{userList.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 flex-shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-1 gap-2 mb-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-300 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 leading-tight">Registered Users</p>
          <p className="text-3xl font-black mt-1 text-slate-900 dark:text-slate-100">{userList.length}</p>
        </div>
      </div>

      {/* Feedback */}
      {feedbackList.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
            User Feedback ({feedbackList.length})
          </h2>
          <div className="space-y-2">
            {feedbackList.map((fb) => (
              <div key={fb.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <svg key={s} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                        fill={s <= fb.rating ? '#FBBF24' : 'none'}
                        stroke={s <= fb.rating ? '#FBBF24' : '#CBD5E1'}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1.5">
                      {['','Poor','Fair','Good','Great','Excellent'][fb.rating]}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{fb.submittedAt ? new Date(fb.submittedAt).toLocaleDateString() : ''}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{fb.email}</p>
                {fb.comment && <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 font-medium">{fb.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User cards */}
      <div className="space-y-3">
        {userList.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-slate-400 font-medium">No users registered yet.</p>
            <p className="text-xs text-slate-400 mt-1">Create an account to see data here.</p>
          </div>
        )}

        {userList.map((user) => {
          const e = user.email.toLowerCase();
          const isDev = e === 'test@hivio.local';

          return (
            <div
              key={e}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden"
            >
              {/* User header */}
              <div className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-full bg-[#2C6E91] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.name || '—'}</p>
                  <p className="text-xs text-slate-400 font-medium truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isDev && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#2C6E91]/10 text-[#2C6E91] border border-[#2C6E91]/20">
                      DEV
                    </span>
                  )}
                  {user.profile ? (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {user.profile.gradYear}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                      No profile
                    </span>
                  )}
                </div>
              </div>

              {/* School / program */}
              {user.profile && (
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {user.profile.school}
                    {user.profile.program ? ` · ${user.profile.program}` : ''}
                    {user.profile.gradYear ? ` · Class of ${user.profile.gradYear}` : ''}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSeed(e)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    seededEmails[e]
                      ? 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-[#2C6E91]/40 text-[#2C6E91] hover:bg-[#2C6E91]/5'
                  }`}
                >
                  {seededEmails[e] ? '✓ Seeded' : 'Seed Data'}
                </button>

                {confirmClear === e ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleClear(e)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Confirm Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(null)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(e)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    Clear Data
                  </button>
                )}
              </div>

              {/* Delete account */}
              <div className="px-4 pb-3">
                {confirmDelete === e ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-red-500 font-semibold flex-1">Delete account + all data?</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(e)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(e)}
                    className="w-full py-2 rounded-xl text-xs font-semibold border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    Delete Account
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DevPage;
