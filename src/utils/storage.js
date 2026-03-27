export function getApplicationsStorageKey(user) {
  const email = user?.email || 'anonymous';
  return `hivio_applications_${email.toLowerCase()}`;
}

export function getApplicationsIntentKey(user) {
  const email = user?.email || 'anonymous';
  return `hivio_applications_intent_${email.toLowerCase()}`;
}

export function getResumesStorageKey(user) {
  const email = user?.email || 'anonymous';
  return `hivio_resumes_${email.toLowerCase()}`;
}

export function getRemindersStorageKey(user) {
  const email = user?.email || 'anonymous';
  return `hivio_reminders_${email.toLowerCase()}`;
}

export function safeReadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
