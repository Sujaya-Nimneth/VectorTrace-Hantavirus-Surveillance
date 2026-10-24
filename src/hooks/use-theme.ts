import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "vectortrace-theme";

export function getStoredTheme(): Theme | null {
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

/** Resolve the effective theme: stored choice, else system preference. */
export function resolveTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  );

  // The pre-paint script in the root shell normally applies the theme before
  // first render, but if hydration re-inserts that script after parse it never
  // executes — reconcile here as a fallback.
  useEffect(() => {
    const resolved = resolveTheme();
    const isDark = document.documentElement.classList.contains("dark");
    if ((resolved === "dark") !== isDark) {
      applyTheme(resolved);
      setTheme(resolved);
    }
  }, []);

  // Track system changes while the user hasn't picked an explicit theme.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!getStoredTheme()) {
        const next: Theme = media.matches ? "dark" : "light";
        setTheme(next);
        applyTheme(next);
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const set = useCallback((next: Theme) => {
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable: theme applies for this session only.
    }
  }, []);

  const toggle = useCallback(() => set(theme === "dark" ? "light" : "dark"), [set, theme]);

  return { theme, setTheme: set, toggle };
}
