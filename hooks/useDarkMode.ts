'use client';

import { useCallback, useSyncExternalStore } from 'react';

const THEME_KEY = 'ledger_theme';
const THEME_EVENT = 'ledger-theme-change';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

function getThemeSnapshot() {
  return window.localStorage.getItem(THEME_KEY) === 'dark';
}

function getServerThemeSnapshot() {
  return false;
}

export function useDarkMode() {
  const isDark = useSyncExternalStore(subscribe, getThemeSnapshot, getServerThemeSnapshot);

  const toggleTheme = useCallback(() => {
    const nextTheme = getThemeSnapshot() ? 'light' : 'dark';
    window.localStorage.setItem(THEME_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return { isDark, toggleTheme };
}
