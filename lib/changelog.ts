import { type Era, type Release, releases } from "@/content/changelog";

const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseVersion(version: string): [number, number, number] | null {
  const match = VERSION.exec(version);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

// Negative when a is older than b. Both must be valid versions.
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) throw new Error(`not a version: ${pa ? b : a}`);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

// "2.8.1" → "v2-8-1": the release's id on /changelog/ (dots would need escaping in a selector).
export function anchorOf(version: string): string {
  return `v${version.split(".").join("-")}`;
}

// "2011–2026", "2026" (one year), "since 2026" (the current era).
export function eraSpan(era: Era): string {
  const from = era.from.slice(0, 4);
  if (era.to === null) return `since ${from}`;
  const to = era.to.slice(0, 4);
  return from === to ? from : `${from}–${to}`;
}

export function latestRelease(list: Release[] = releases): Release {
  const [latest] = list;
  if (!latest) throw new Error("the changelog has no releases");
  return latest;
}

function validDate(date: string): boolean {
  if (!DATE.test(date)) return false;
  const time = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(time.getTime()) && time.toISOString().slice(0, 10) === date;
}

// Every rule the changelog breaks, as a sentence; empty when it is valid.
// Releases and eras are newest first.
export function changelogIssues(list: Release[], eraList: Era[], packageVersion: string): string[] {
  const issues: string[] = [];
  const current = eraList[0];

  list.forEach((release, index) => {
    const { version } = release;
    const parsed = parseVersion(version);
    if (!parsed) issues.push(`${version} is not major.minor.patch`);
    if (!validDate(release.date)) issues.push(`${version} has an invalid date ${release.date}`);
    if (!release.title.trim()) issues.push(`${version} has no title`);
    if (release.items.length < 1 || release.items.length > 5) issues.push(`${version} needs 1–5 items, has ${release.items.length}`);
    if (release.items.some((item) => !item.trim())) issues.push(`${version} has an empty item`);
    if (current && parsed && parsed[0] !== current.major) issues.push(`${version} is not in the current era (v${current.major})`);
    if (current && validDate(release.date) && release.date < current.from) {
      issues.push(`${version} is dated before the current era began (${current.from})`);
    }
    const newer = list[index - 1];
    if (newer && parsed && parseVersion(newer.version) && compareVersions(newer.version, version) <= 0) {
      issues.push(`${version} must be older than ${newer.version}`);
    }
    if (newer && validDate(newer.date) && validDate(release.date) && release.date > newer.date) {
      issues.push(`${version} is dated after ${newer.version}`);
    }
  });

  if (current && current.to !== null) issues.push(`the current era (v${current.major}) must have no end`);
  eraList.forEach((era, index) => {
    const newer = eraList[index - 1];
    if (!newer) return;
    if (era.major !== newer.major - 1) issues.push(`v${era.major} must follow v${newer.major} as v${newer.major - 1}`);
    else if (era.to !== newer.from) issues.push(`v${era.major} must end where v${newer.major} begins (${newer.from})`);
  });

  const latest = list[0];
  if (latest && latest.version !== packageVersion) {
    issues.push(`package.json is ${packageVersion}, but the newest release is ${latest.version}`);
  }
  return issues;
}
