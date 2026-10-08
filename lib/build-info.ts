import { formatDate } from "./format";

export interface BuildInfo {
  version: string;
  // YYYY-MM-DD, or "" when unknown.
  date: string;
  // Short SHA, or "" outside Vercel.
  commit: string;
}

export const buildInfo: BuildInfo = {
  version: process.env.NEXT_PUBLIC_BUILD_VERSION ?? "0.0.0",
  date: process.env.NEXT_PUBLIC_BUILD_DATE ?? "",
  commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "",
};

// The parts after the version: "updated Oct 3, 2026", "commit a2c817a"; parts a build lacks are left out.
export function buildMeta(info: BuildInfo = buildInfo): string[] {
  return [info.date ? `updated ${formatDate(info.date)}` : null, info.commit ? `commit ${info.commit}` : null].filter(
    (part): part is string => part !== null,
  );
}

// "v2.0.0 · updated Oct 3, 2026 · commit a2c817a".
export function buildLine(info: BuildInfo = buildInfo): string {
  return [`v${info.version}`, ...buildMeta(info)].join(" · ");
}
