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

function shownIdsKey(uid) {
  return `hivio_shown_notifs_${uid || 'anon'}`;
}

export function getShownNotifIds(uid) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(shownIdsKey(uid));
    const data = raw ? JSON.parse(raw) : {};
    return new Set(data[today] || []);
  } catch {
    return new Set();
  }
}

export function markNotifShown(uid, id) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const key = shownIdsKey(uid);
    const raw = localStorage.getItem(key);
    const prev = raw ? JSON.parse(raw) : {};
    const next = { [today]: [...(prev[today] || []), id] };
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
}

// ── Due notifications — accepts live data from Firestore subscriptions ────────

export function getDueNotifications(apps, reminders) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const results = [];

  // Follow-up dates from applications
  (apps || [])
    .filter((a) => !a.archived && a.followUpDate === today)
    .forEach((a) => {
      results.push({
        id: `followup_${a.id}_${today}`,
        type: 'followup',
        title: 'Follow-up Today',
        body: `${a.company}${a.title ? ` · ${a.title}` : ''}`,
      });
    });

  // Custom reminders
  (reminders || [])
    .filter((r) => {
      if (r.date !== today || r.done) return false;
      if (!r.time) return true;
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

  return results;
}
