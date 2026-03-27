export const NOTIF_ENABLED_KEY = 'hivio_notifications_enabled';

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

export function getDueNotifications(user) {
  const today = new Date().toISOString().slice(0, 10);
  const email = (user?.email || 'anonymous').toLowerCase();
  const results = [];

  try {
    const apps = JSON.parse(localStorage.getItem(`hivio_applications_${email}`) || '[]');
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

  try {
    const reminders = JSON.parse(localStorage.getItem(`hivio_reminders_${email}`) || '[]');
    reminders
      .filter((r) => r.date === today && !r.done)
      .forEach((r) => {
        results.push({
          id: `reminder_${r.id}_${today}`,
          type: 'reminder',
          title: 'Reminder',
          body: r.title,
        });
      });
  } catch {}

  return results;
}
