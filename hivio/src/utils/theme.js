const THEME_KEY = 'hivio_theme'; // 'light' | 'dark' | 'system'

export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'system';
  } catch {
    return 'system';
  }
}

export function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

export function getSystemPrefersDark() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

export function resolveTheme(theme) {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  return getSystemPrefersDark() ? 'dark' : 'light';
}

export function applyThemeClass(theme) {
  const resolved = resolveTheme(theme);
  const root = document.documentElement; // <html>

  if (resolved === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');

  // Do NOT force root.style.colorScheme here — it can cause odd input rendering in some setups.
}