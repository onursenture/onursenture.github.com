"use client";

import { useSyncExternalStore } from "react";
import { Toggle } from "@/components/ui/toggle";
import { serializeCookie } from "@/lib/view/cookies";
import { THEME_COOKIE, THEME_PREFERENCES, type ThemePreference } from "@/lib/view/theme";

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
] as const satisfies readonly { value: ThemePreference; label: string }[];

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

// Light / Dark / Auto. Theme switches are instant (no transition).
export function ThemeToggle() {
  // Server render has no preference; "system" matches the script's default.
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);

  function choose(next: ThemePreference) {
    document.cookie = serializeCookie(THEME_COOKIE, next);
    apply(next);
    listeners.forEach((l) => l());
  }

  return <Toggle label="Theme" testId="theme-toggle" options={OPTIONS} value={preference} onChange={choose} />;
}
