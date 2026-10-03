import { describe, expect, it } from "vitest";
import { PREFERENCE_COOKIE, cookiePattern, serializeCookie } from "@/lib/theme/cookies";
import { themeScript } from "@/lib/theme/theme";

describe("preference cookies", () => {
  it("serializes with the shared preference attributes", () => {
    expect(serializeCookie("theme", "dark")).toBe(
      `theme=dark; path=${PREFERENCE_COOKIE.path}; max-age=${PREFERENCE_COOKIE.maxAge}; samesite=${PREFERENCE_COOKIE.sameSite}`,
    );
    expect(PREFERENCE_COOKIE.maxAge).toBe(31_536_000);
  });

  it("matches a cookie only as a whole name=value pair", () => {
    const pattern = cookiePattern("theme", "light|dark|system");
    expect("theme=dark".match(pattern)?.[1]).toBe("dark");
    expect("x=site; theme=light; y=1".match(pattern)?.[1]).toBe("light");
    expect("theme=darkish").not.toMatch(pattern);
    expect("xtheme=dark").not.toMatch(pattern);
  });
});

describe("themeScript", () => {
  // Runs the inline script against a stand-in document and window.
  function run(cookie: string, osDark = false) {
    const root = { dataset: {} as Record<string, string> };
    const document = { cookie, documentElement: root };
    const window = { matchMedia: () => ({ matches: osDark }) };
    new Function("document", "window", themeScript)(document, window);
    return root.dataset;
  }

  it("applies the cookie's theme", () => {
    expect(run("theme=dark")).toEqual({ theme: "dark", themePreference: "dark" });
    expect(run("x=site; theme=light")).toEqual({ theme: "light", themePreference: "light" });
  });

  it("falls back to the OS for system, a missing cookie or a malformed one", () => {
    expect(run("theme=system", true)).toEqual({ theme: "dark", themePreference: "system" });
    expect(run("", false)).toEqual({ theme: "light", themePreference: "system" });
    expect(run("theme=darkish", false)).toEqual({ theme: "light", themePreference: "system" });
  });
});
