'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    try {
      window.localStorage.setItem('netlab-theme', next ? 'dark' : 'light');
    } catch {
      // Storage can be blocked; the theme still applies for this page view.
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="inline-flex h-9 items-center gap-2 rounded border border-line px-2.5 text-xs text-muted transition-colors hover:text-ink"
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
      <span>{dark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
