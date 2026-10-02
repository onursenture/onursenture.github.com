"use client";

import { useSyncExternalStore } from "react";
import { THEME_COOKIE, THEME_PREFERENCES, type ThemePreference } from "@/lib/view/theme";

function readPreference(): ThemePreference {
  const value = document.documentElement.dataset.themePreference;
  return (THEME_PREFERENCES as readonly string[]).includes(value ?? "")
    ? (value as ThemePreference)
    : "system";
}

function apply(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.themePreference = preference;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Follow OS changes while the preference is "system".
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (readPreference() === "system") apply("system");
  };
  media.addEventListener("change", onChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onChange);
  };
}

export function ThemeToggle() {
  // Server render has no preference; "system" matches the script's default.
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);

  function cycle() {
    const index = THEME_PREFERENCES.indexOf(preference);
    const next = THEME_PREFERENCES[(index + 1) % THEME_PREFERENCES.length];
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    apply(next);
    listeners.forEach((l) => l());
  }

  return (
    <button type="button" onClick={cycle} data-testid="theme-toggle">
      Theme: {preference}
    </button>
  );
}
