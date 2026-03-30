const USERS_KEY = 'hivio_users';

// --- Multi-user storage ---

export function getAllUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const users = raw ? JSON.parse(raw) : {};

    // One-time migration: fold in legacy single-user key if present
    const legacy = localStorage.getItem('hivio_user');
    if (legacy) {
      try {
        const legacyUser = JSON.parse(legacy);
        if (legacyUser?.email && !users[legacyUser.email.toLowerCase()]) {
          users[legacyUser.email.toLowerCase()] = legacyUser;
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
      } catch {}
      localStorage.removeItem('hivio_user');
    }

    return users;
  } catch {
    return {};
  }
}

export function getUser(email) {
  if (!email) return null;
  const users = getAllUsers();
  return users[email.toLowerCase()] || null;
}

export function saveUser(userData) {
  if (!userData?.email) return;
  const users = getAllUsers();
  users[userData.email.toLowerCase()] = userData;
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } catch {
    return false;
  }
}

// --- Per-user data keys ---

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

// Returns true on success, false if storage is full or unavailable
export function safeWriteJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
