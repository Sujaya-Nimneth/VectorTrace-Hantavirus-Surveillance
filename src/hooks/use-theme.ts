import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "vectortrace-theme";

const listeners = new Set<() => void>();
let media: MediaQueryList | null = null;

function notify() {
  for (const l of listeners) l();
}

function onSystemChange() {
  // Follow the OS preference only while the user hasn't picked a theme.
  if (!getStoredTheme()) {
    applyTheme(systemTheme());
    notify();
  }
}

/** Resolve the effective theme: stored choice, else system preference. */
export function resolveTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  return systemTheme();
}

function systemTheme(): Theme {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  if (!media) {
    media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", onSystemChange);
  }
  return () => listeners.delete(onChange);
}

function getSnapshot(): Theme {
  // The document class is the single source of truth, kept in sync by the
  // pre-paint script in the root shell and by setTheme below.
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable: theme applies for this session only.
    }
    notify();
  }, []);

  const toggle = useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [setTheme, theme],
  );

  return { theme, setTheme, toggle };
}
