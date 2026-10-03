import { cookiePattern } from "./cookies";

export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export const THEME_COOKIE = "theme";

const THEME_COOKIE_PATTERN = cookiePattern(THEME_COOKIE, THEME_PREFERENCES.join("|"));

// Runs inline in <head> before first paint: reads the theme cookie, resolves
// "system" against the OS setting, and sets <html data-theme>. Kept tiny and
// dependency-free because it is injected as a string.
export const themeScript = `(function(){try{var m=document.cookie.match(new RegExp(${JSON.stringify(THEME_COOKIE_PATTERN.source)}));var p=m?m[1]:"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.dataset.theme=d?"dark":"light";r.dataset.themePreference=p;}catch(e){}})();`;
