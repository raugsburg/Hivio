import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  subscribeApplications, subscribeReminders, subscribeResumes,
  saveReminder as dbSaveReminder, updateReminder as dbUpdateReminder, deleteReminder as dbDeleteReminder,
} from '../../utils/db';
import { startOfDayISO, isValidDateStringYYYYMMDD } from '../../utils/dateUtils';

function monthLabel(d) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function buildMonthCells(currentMonth) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    cells.push({
      day,
      key: startOfDayISO(date),
      isToday: startOfDayISO(date) === startOfDayISO(new Date()),
    });
  }

  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function sortByTime(items) {
  return [...items].sort((a, b) => {
    const ta = a.time || '';
    const tb = b.time || '';
    return ta.localeCompare(tb);
  });
}

function formatTimeLabel(time) {
  if (!time) return 'Any time';
  const [hRaw, mRaw] = time.split(':');
  const hNum = Number(hRaw);
  const mNum = Number(mRaw);
  if (!Number.isFinite(hNum) || !Number.isFinite(mNum)) return time;
  const suffix = hNum >= 12 ? 'PM' : 'AM';
  const h12 = ((hNum + 11) % 12) + 1;
  const mm = String(mNum).padStart(2, '0');
  return `${h12}:${mm} ${suffix}`;
}

function nextHourTime() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  const next = (d.getHours() + 1) % 24;
  return `${String(next).padStart(2, '0')}:00`;
}

function Calendar({ user, onNotify, onSchedule }) {
  const [apps, setApps] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [resumes, setResumes] = useState([]);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(startOfDayISO(new Date()));

  const [form, setForm] = useState({
    title: '',
    date: startOfDayISO(new Date()),
    time: nextHourTime(),
    notes: '',
  });

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubApps = subscribeApplications(user.uid, setApps);
    const unsubRem = subscribeReminders(user.uid, setReminders);
    const unsubResumes = subscribeResumes(user.uid, setResumes);
    return () => { unsubApps(); unsubRem(); unsubResumes(); };
  }, [user?.uid]);

  const activeApps = apps.filter((a) => !a.archived);

  const followUpEvents = activeApps
    .filter((a) => isValidDateStringYYYYMMDD(a.followUpDate))
    .map((a) => ({
      id: `followup_${a.id}`,
      type: 'followup',
      date: a.followUpDate,
      title: `${a.title} follow-up`,
      company: a.company || '',
      status: a.status || 'Applied',
      location: a.location || '',
      resumeLabel: a.resumeId ? (resumes.find((r) => r.id === a.resumeId)?.label || 'Resume linked') : '',
      appId: a.id,
      time: '',
      done: false,
    }));

  const reminderEvents = reminders.map((r) => ({
    id: r.id,
    type: 'reminder',
    date: r.date,
    title: r.title,
    notes: r.notes || '',
    time: r.time || '',
    done: Boolean(r.done),
  }));

  const eventsByDate = [...followUpEvents, ...reminderEvents].reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  const selectedEvents = sortByTime(eventsByDate[selectedDate] || []);

  const monthCells = buildMonthCells(currentMonth);

  function gotoPrevMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function gotoNextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function startEdit(reminder) {
    setEditingId(reminder.id);
    setShowForm(true);
    setForm({
      title: reminder.title,
      date: reminder.date,
      time: reminder.time || '',
      notes: reminder.notes || '',
    });
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setShowForm(false);
    setForm({ title: '', date: selectedDate, time: nextHourTime(), notes: '' });
    setError('');
  }

  async function saveReminder() {
    setError('');
    if (!form.title.trim()) {
      setError('Reminder title is required.');
      return;
    }
    if (!isValidDateStringYYYYMMDD(form.date)) {
      setError('Please choose a valid date.');
      return;
    }

    const today = startOfDayISO(new Date());

    setSaving(true);
    try {
      if (editingId) {
        const existing = reminders.find((r) => r.id === editingId);
        if (existing) {
          const updated = { ...existing, title: form.title.trim(), date: form.date, time: form.time || '', notes: form.notes.trim() };
          await dbSaveReminder(user.uid, updated);
        }
        setEditingId(null);
        setSelectedDate(form.date);
      } else {
        const next = {
          id: `rem_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          title: form.title.trim(),
          date: form.date,
          time: form.time || '',
          notes: form.notes.trim(),
          done: false,
          createdAt: new Date().toISOString(),
        };
        await dbSaveReminder(user.uid, next);
        setSelectedDate(form.date);

        if (form.date === today && typeof onNotify === 'function') {
          onNotify({
            id: `reminder_created_${next.id}_${today}`,
            type: 'reminder',
            title: 'Reminder Set',
            body: next.title,
          });
        }
        if (typeof onSchedule === 'function') onSchedule(next);
      }

      setShowForm(false);
      setForm({ title: '', date: form.date, time: nextHourTime(), notes: '' });
    } catch {
      setError('Save failed. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleReminderDone(reminderId) {
    const reminder = reminders.find((r) => r.id === reminderId);
    if (reminder) {
      await dbUpdateReminder(user.uid, reminderId, { done: !reminder.done }).catch(() => {});
    }
  }

  async function deleteReminder(reminderId) {
    if (editingId === reminderId) cancelEdit();
    await dbDeleteReminder(user.uid, reminderId).catch(() => {});
  }

  const pageBg = 'bg-hivio-bg dark:bg-hivio-bg-dark';
  const cardBg = 'bg-hivio-surface dark:bg-hivio-surface-dark';
  const border = 'border border-[#C4CDD6] dark:border-hivio-border-dark';
  const textMain = 'text-hivio-text-primary dark:text-hivio-text-primary-dark';

  const dateInputCls = 'w-full text-sm font-normal text-hivio-text-primary dark:text-hivio-text-primary-dark bg-hivio-surface dark:bg-hivio-surface-dark border border-[#C4CDD6] dark:border-hivio-border-dark rounded-sm px-3 py-2 shadow-hivio-sm placeholder:text-hivio-text-muted dark:placeholder:text-hivio-text-muted-dark focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:border-hivio-border-focus transition-all duration-150 ease-in-out [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:opacity-60';

  return (
    <div className={`flex flex-col px-5 pt-6 pb-6 ${pageBg}`}>
      <div className={`${cardBg} ${border} rounded-lg shadow-hivio p-5 mb-4`}>
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={gotoPrevMonth}
            className="text-hivio-primary bg-transparent text-xs font-medium px-3 py-2 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/15 transition-colors duration-150 ease-in-out"
          >
            Prev
          </button>
          <p className={`text-lg font-semibold ${textMain}`}>{monthLabel(currentMonth)}</p>
          <button
            type="button"
            onClick={gotoNextMonth}
            className="text-hivio-primary bg-transparent text-xs font-medium px-3 py-2 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/15 transition-colors duration-150 ease-in-out"
          >
            Next
          </button>
        </div>

        <div className="flex items-center justify-end mb-3">
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelectedDate(startOfDayISO(today));
            }}
            className="text-hivio-primary bg-transparent text-xs font-medium px-3 py-1 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/15 transition-colors duration-150 ease-in-out"
          >
            Jump to today
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <p key={d} className="text-xs font-medium text-hivio-text-muted dark:text-hivio-text-muted-dark text-center uppercase">{d}</p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty_${idx}`} className="h-12" />;
            }

            const dayEvents = eventsByDate[cell.key] || [];
            const selected = selectedDate === cell.key;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDate(cell.key)}
                className={`h-12 rounded-md border text-xs font-medium transition-colors duration-150 ease-in-out ${
                  selected
                    ? 'border-hivio-primary bg-hivio-primary-light dark:bg-hivio-primary/15 text-hivio-primary'
                    : 'border-[#C4CDD6] dark:border-hivio-border-dark bg-hivio-surface dark:bg-hivio-surface-dark text-hivio-text-primary dark:text-hivio-text-primary-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/10'
                } ${cell.isToday ? 'ring-1 ring-hivio-primary/30' : ''}`}
              >
                <div className="flex flex-col items-center justify-center">
                  <span>{cell.day}</span>
                  <div className="flex items-center gap-1 mt-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          ev.type === 'followup' ? 'bg-hivio-primary' : ev.done ? 'bg-hivio-text-muted' : 'bg-hivio-status-offer'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${cardBg} ${border} rounded-lg shadow-hivio mb-4 overflow-hidden`}>
        <button
          type="button"
          onClick={() => {
            if (editingId) { cancelEdit(); return; }
            setShowForm((prev) => !prev);
            setError('');
          }}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/5 transition-colors duration-150 ease-in-out"
        >
          <div>
            <h2 className={`text-lg font-semibold ${textMain}`}>
              {editingId ? 'Edit Reminder' : 'Add Reminder'}
            </h2>
            {!showForm && !editingId && (
              <p className="text-xs font-medium text-hivio-text-muted dark:text-hivio-text-muted-dark mt-0.5">Tap to create a new reminder</p>
            )}
          </div>
          <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150 ease-in-out ${
            showForm || editingId
              ? 'bg-hivio-primary-light dark:bg-hivio-primary/15 text-hivio-text-muted dark:text-hivio-text-muted-dark'
              : 'bg-hivio-primary text-hivio-text-inverse'
          }`}>
            {showForm || editingId ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            )}
          </div>
        </button>

        {(showForm || editingId) && (
          <div className="px-5 pb-5 space-y-3 border-t border-[#C4CDD6] dark:border-hivio-border-dark pt-4">
            {error && (
              <div className="rounded-md bg-hivio-status-rejected-bg border border-hivio-status-rejected/20 text-hivio-status-rejected text-xs font-medium px-3 py-2">
                {error}
              </div>
            )}

            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Reminder title"
              className={dateInputCls}
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className={dateInputCls}
              />
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                className={dateInputCls}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, time: '09:00' }))}
                className="text-hivio-text-primary dark:text-hivio-text-primary-dark bg-transparent text-xs font-medium px-3 py-1 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/20 transition-colors duration-150 ease-in-out"
              >
                9:00 AM
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, time: '13:00' }))}
                className="text-hivio-text-primary dark:text-hivio-text-primary-dark bg-transparent text-xs font-medium px-3 py-1 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/15 transition-colors duration-150 ease-in-out"
              >
                1:00 PM
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, time: '' }))}
                className="text-hivio-text-primary dark:text-hivio-text-primary-dark bg-transparent text-xs font-medium px-3 py-1 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/15 transition-colors duration-150 ease-in-out"
              >
                No time
              </button>
            </div>

            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes"
              rows={3}
              className={dateInputCls}
            />

            <button
              type="button"
              onClick={saveReminder}
              disabled={saving}
              className="w-full bg-hivio-primary text-hivio-text-inverse text-sm font-medium px-4 py-2 rounded-md shadow-hivio-sm hover:bg-hivio-primary-hover transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-hivio-border-focus focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {editingId ? 'Update Reminder' : 'Save Reminder'}
            </button>
          </div>
        )}
      </div>

      <div className={`${cardBg} ${border} rounded-lg shadow-hivio p-5`}>
        <div className="mb-3">
          <h2 className={`text-lg font-semibold ${textMain}`}>{new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} Schedule</h2>
          <p className="text-xs font-medium text-hivio-text-muted dark:text-hivio-text-muted-dark mt-0.5">Follow-ups and reminders for the selected day.</p>
        </div>

        {selectedEvents.length === 0 ? (
          <p className="text-sm font-medium text-hivio-text-secondary dark:text-hivio-text-secondary-dark">No items scheduled for this day.</p>
        ) : (
          <div className="space-y-2">
            {selectedEvents.map((ev) => (
              <div key={ev.id} className={`rounded-md border p-3 ${
                ev.type === 'followup'
                  ? 'border-hivio-status-applied/20 bg-hivio-status-applied-bg dark:bg-hivio-status-applied/10'
                  : 'border-hivio-status-offer/20 bg-hivio-status-offer-bg dark:bg-hivio-status-offer/10'
              }`}>
                {ev.type === 'followup' ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${textMain}`}>{ev.title}</p>
                      <span className="flex-shrink-0 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-hivio-status-applied-bg text-hivio-status-applied dark:bg-hivio-status-applied-bg-dark dark:text-white">
                        Follow-up
                      </span>
                    </div>
                    <p className="text-xs font-medium text-hivio-text-secondary dark:text-hivio-text-secondary-dark mt-1">
                      {formatTimeLabel(ev.time)}
                      {ev.company ? ` • ${ev.company}` : ''}
                      {ev.location ? ` • ${ev.location}` : ''}
                      {ev.status ? ` • ${ev.status}` : ''}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${ev.done ? 'text-hivio-text-muted line-through' : textMain}`}>
                        {ev.title}
                      </p>
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${ev.done ? 'text-hivio-text-muted dark:text-hivio-text-muted-dark bg-hivio-status-ghosted-bg dark:bg-hivio-surface-dark' : 'bg-hivio-primary-light text-hivio-primary dark:bg-hivio-primary/20 dark:text-[#a5b4fc]'}`}>
                        {ev.done ? 'Done' : 'Reminder'}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-hivio-text-secondary dark:text-hivio-text-secondary-dark mt-1">
                      {formatTimeLabel(ev.time)}{ev.notes ? ` • ${ev.notes}` : ''}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => toggleReminderDone(ev.id)}
                        className="text-hivio-text-primary dark:text-hivio-text-primary-dark bg-transparent text-xs font-medium px-3 py-1 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/20 transition-colors duration-150 ease-in-out"
                      >
                        {ev.done ? 'Mark Active' : 'Mark Done'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { const r = reminders.find((rem) => rem.id === ev.id); if (r) startEdit(r); }}
                        className="text-hivio-primary bg-transparent text-xs font-medium px-3 py-1 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark hover:bg-hivio-primary-ghost dark:hover:bg-hivio-primary/20 transition-colors duration-150 ease-in-out"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteReminder(ev.id)}
                        className="text-red-500 dark:text-[#e87c7c] bg-transparent text-xs font-medium px-3 py-1 rounded-md border border-[#C4CDD6] dark:border-hivio-border-dark hover:bg-hivio-status-rejected-bg dark:hover:bg-[#3d2020] transition-colors duration-150 ease-in-out"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default Calendar;
