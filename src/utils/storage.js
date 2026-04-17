// ─── Navigation intent (localStorage only — ephemeral tab-to-tab state) ──────

export function getApplicationsIntentKey(uid) {
  return `hivio_nav_intent_${uid || 'anon'}`;
}

// ─── Dismissed stale alerts (device-specific, non-critical) ──────────────────

export function getDismissedStaleKey(uid) {
  return `hivio_dismissed_stale_${uid || 'anon'}`;
}

// ─── Generic localStorage helpers ────────────────────────────────────────────

export function safeReadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function safeWriteJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
