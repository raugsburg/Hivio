import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getApplicationsStorageKey, getRemindersStorageKey, safeReadJSON } from '../../utils/storage';
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
  d.setHours(d.getHours() + 1);
  return `${String(d.getHours()).padStart(2, '0')}:00`;
}

function Calendar({ user, onNotify, onSchedule }) {
  const appsKey = useMemo(() => getApplicationsStorageKey(user), [user]);
  const remindersKey = useMemo(() => getRemindersStorageKey(user), [user]);

  const [apps, setApps] = useState([]);
  const [reminders, setReminders] = useState([]);
  const remindersLoaded = useRef(false);

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

  useEffect(() => {
    setApps(safeReadJSON(appsKey, []));
    remindersLoaded.current = false;
    setReminders(safeReadJSON(remindersKey, []));
  }, [appsKey, remindersKey]);

  useEffect(() => {
    if (!remindersLoaded.current) {
      remindersLoaded.current = true;
      return;
    }
    try {
      localStorage.setItem(remindersKey, JSON.stringify(reminders));
    } catch {}
  }, [reminders, remindersKey]);

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
      resumeLabel: a.resumeId ? 'Resume linked' : '',
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

  function saveReminder() {
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

    if (editingId) {
      const updated = { title: form.title.trim(), date: form.date, time: form.time || '', notes: form.notes.trim() };
      setReminders((prev) =>
        prev.map((r) => r.id === editingId ? { ...r, ...updated } : r)
      );
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
      setReminders((prev) => [next, ...prev]);
      setSelectedDate(form.date);

      // Immediately notify if reminder is for today
      if (form.date === today && typeof onNotify === 'function') {
        onNotify({
          id: `reminder_created_${next.id}_${today}`,
          type: 'reminder',
          title: 'Reminder Set',
          body: next.title,
        });
      }
      // Schedule a timed popup if it has a future time
      if (typeof onSchedule === 'function') onSchedule(next);
    }

    setShowForm(false);
    setForm({ title: '', date: selectedDate, time: nextHourTime(), notes: '' });
  }

  function toggleReminderDone(reminderId) {
    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, done: !r.done } : r))
    );
  }

  function deleteReminder(reminderId) {
    if (editingId === reminderId) cancelEdit();
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
  }

  const pageBg = 'bg-[#F7F9FC] dark:bg-slate-950';
  const cardBg = 'bg-white dark:bg-slate-900';
  const border = 'border border-slate-300 dark:border-slate-800';
  const title = 'text-slate-900 dark:text-slate-100';

  return (
    <div className={`flex flex-col px-5 pt-6 pb-6 ${pageBg}`}>
      <div className="mb-5">
        <h1 className={`text-2xl font-bold tracking-tight ${title} mb-1`}>
          Calendar + Reminders
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-300 font-medium">
          Your schedule combines follow-ups from applications and custom reminders.
        </p>
      </div>

      <div className={`${cardBg} rounded-2xl p-4 ${border} shadow-[0_2px_12px_rgba(0,0,0,0.15)] mb-4`}>
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={gotoPrevMonth}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Prev
          </button>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{monthLabel(currentMonth)}</p>
          <button
            type="button"
            onClick={gotoNextMonth}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
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
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Jump to today
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <p key={d} className="text-[10px] font-bold text-slate-400 text-center uppercase">{d}</p>
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
                className={`h-12 rounded-xl border text-xs font-semibold transition-colors ${
                  selected
                    ? 'border-[#2C6E91] bg-blue-50 dark:bg-[#2C6E91]/15 text-[#2C6E91]'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                } ${cell.isToday ? 'ring-1 ring-[#2C6E91]/30' : ''}`}
              >
                <div className="flex flex-col items-center justify-center">
                  <span>{cell.day}</span>
                  <div className="flex items-center gap-1 mt-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          ev.type === 'followup' ? 'bg-[#2C6E91]' : ev.done ? 'bg-slate-300' : 'bg-emerald-500'
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

      <div className={`${cardBg} rounded-2xl ${border} shadow-[0_2px_12px_rgba(0,0,0,0.15)] mb-4 overflow-hidden`}>
        <button
          type="button"
          onClick={() => {
            if (editingId) { cancelEdit(); return; }
            setShowForm((prev) => !prev);
            setError('');
          }}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {editingId ? 'Edit Reminder' : 'Add Reminder'}
            </h2>
            {!showForm && !editingId && (
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Tap to create a new reminder</p>
            )}
          </div>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            showForm || editingId
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              : 'bg-[#2C6E91] text-white'
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
          <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs font-semibold px-3 py-2">
                {error}
              </div>
            )}

            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Reminder title"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-3 pr-2 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:opacity-60"
              />
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-3 pr-2 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all [&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:opacity-60"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, time: '09:00' }))}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                9:00 AM
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, time: '13:00' }))}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                1:00 PM
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, time: '' }))}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                No time
              </button>
            </div>

            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes"
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E91]/30 focus:border-[#2C6E91] transition-all"
            />

            <button
              type="button"
              onClick={saveReminder}
              className="w-full bg-[#2C6E91] hover:bg-[#1a4a66] text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {editingId ? 'Update Reminder' : 'Save Reminder'}
            </button>
          </div>
        )}
      </div>

      <div className={`${cardBg} rounded-2xl p-4 ${border} shadow-[0_2px_12px_rgba(0,0,0,0.15)]`}>
        <div className="mb-3">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedDate} Schedule</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Follow-ups and reminders for the selected day.</p>
        </div>

        {selectedEvents.length === 0 ? (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-300">No items scheduled for this day.</p>
        ) : (
          <div className="space-y-2">
            {selectedEvents.map((ev) => (
              <div key={ev.id} className={`rounded-xl border p-3 ${
                ev.type === 'followup'
                  ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5'
                  : 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5'
              }`}>
                {ev.type === 'followup' ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{ev.title}</p>
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20 px-2 py-1 rounded-lg">
                        Follow-up
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                      {formatTimeLabel(ev.time)}
                      {ev.company ? ` • ${ev.company}` : ''}
                      {ev.location ? ` • ${ev.location}` : ''}
                      {ev.status ? ` • ${ev.status}` : ''}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${ev.done ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                        {ev.title}
                      </p>
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${ev.done ? 'text-slate-500 bg-slate-200 dark:bg-slate-800' : 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20'}`}>
                        {ev.done ? 'Done' : 'Reminder'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                      {formatTimeLabel(ev.time)}{ev.notes ? ` • ${ev.notes}` : ''}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => toggleReminderDone(ev.id)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {ev.done ? 'Mark Active' : 'Mark Done'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { const r = reminders.find((rem) => rem.id === ev.id); if (r) startEdit(r); }}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-[#2C6E91] hover:bg-blue-50 dark:hover:bg-[#2C6E91]/10"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteReminder(ev.id)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
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
