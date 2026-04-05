import { getApplicationsStorageKey, getRemindersStorageKey } from './storage';

export const NOTIF_ENABLED_KEY = 'hivio_notifications_enabled';

// ── Enable / disable ──────────────────────────────────────────────────────────

export function getNotificationsEnabled() {
  try {
    return localStorage.getItem(NOTIF_ENABLED_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setNotificationsEnabled(val) {
  try {
    localStorage.setItem(NOTIF_ENABLED_KEY, String(val));
  } catch {}
}

// ── Browser (OS-level) notifications ─────────────────────────────────────────

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function fireNativeNotification(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/favicon.ico' });
  } catch {}
}

// ── Persisted shown-IDs (survives page refresh) ───────────────────────────────
// Stores { "YYYY-MM-DD": ["id1", "id2", ...] } — only keeps today's entries.

function shownIdsKey(user) {
  const email = (user?.email || 'anonymous').toLowerCase();
  return `hivio_shown_notifs_${email}`;
}

export function getShownNotifIds(user) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(shownIdsKey(user));
    const data = raw ? JSON.parse(raw) : {};
    return new Set(data[today] || []);
  } catch {
    return new Set();
  }
}

export function markNotifShown(user, id) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const key = shownIdsKey(user);
    const raw = localStorage.getItem(key);
    const prev = raw ? JSON.parse(raw) : {};
    // Only keep today's entries — drops yesterday's automatically
    const next = { [today]: [...(prev[today] || []), id] };
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
}

// ── Due notifications (date + time aware) ────────────────────────────────────

export function getDueNotifications(user) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const results = [];

  // Follow-up dates from applications
  try {
    const apps = JSON.parse(localStorage.getItem(getApplicationsStorageKey(user)) || '[]');
    apps
      .filter((a) => !a.archived && a.followUpDate === today)
      .forEach((a) => {
        results.push({
          id: `followup_${a.id}_${today}`,
          type: 'followup',
          title: 'Follow-up Today',
          body: `${a.company}${a.title ? ` · ${a.title}` : ''}`,
        });
      });
  } catch {}

  // Custom reminders — only fire at or after their scheduled time
  try {
    const reminders = JSON.parse(localStorage.getItem(getRemindersStorageKey(user)) || '[]');
    reminders
      .filter((r) => {
        if (r.date !== today || r.done) return false;
        if (!r.time) return true; // no time set → show any time today
        const [h, m] = r.time.split(':').map(Number);
        if (!Number.isFinite(h) || !Number.isFinite(m)) return true;
        return nowMinutes >= h * 60 + m;
      })
      .forEach((r) => {
        results.push({
          id: `reminder_due_${r.id}_${today}`,
          type: 'reminder',
          title: 'Reminder',
          body: r.title,
        });
      });
  } catch {}

  return results;
}
