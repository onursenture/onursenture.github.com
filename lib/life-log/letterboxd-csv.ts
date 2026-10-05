import { httpUrl } from "../sources/http";
import { type FilmEntry, filmRows, normaliseTitle } from "./films";
import type { LifeLogRow } from "./types";

// RFC 4180: quoted fields may hold commas, newlines and doubled quotes. A
// leading BOM is dropped; CRLF and LF both end a record.
export function parseCsv(text: string): Record<string, string>[] {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let quoted = false;
  const input = text.replace(/^﻿/, "");
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      record.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else field += char;
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  const [header, ...rows] = records.filter((r) => r.some((cell) => cell !== ""));
  if (!header) return [];
  return rows.map((cells) => Object.fromEntries(header.map((name, i) => [name.trim(), cells[i] ?? ""])));
}

const year = (value: string) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
};

// Letterboxd's export: diary.csv has one row per diary entry (Watched Date
// is the day watched; Date is when it was logged), watched.csv one row per
// film marked watched. A watched film without any diary entry is "undated".
export function exportRows(diaryCsv: string, watchedCsv: string): LifeLogRow[] {
  const diary: FilmEntry[] = parseCsv(diaryCsv)
    .map((row) => ({
      title: row.Name ?? "",
      year: year(row.Year ?? ""),
      link: httpUrl(row["Letterboxd URI"]),
      rewatch: row.Rewatch === "Yes",
      watchedOn: (row["Watched Date"] || row.Date || "").trim() || null,
    }))
    .filter((entry) => entry.title && entry.watchedOn)
    // Oldest first, stable, so a same-day pair gets the counter in log order.
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => (a.entry.watchedOn! < b.entry.watchedOn! ? -1 : a.entry.watchedOn! > b.entry.watchedOn! ? 1 : a.index - b.index))
    .map(({ entry }) => entry);

  const inDiary = new Set(diary.map((e) => `${normaliseTitle(e.title)}|${e.year ?? ""}`));
  const undated: FilmEntry[] = parseCsv(watchedCsv)
    .map((row) => ({
      title: row.Name ?? "",
      year: year(row.Year ?? ""),
      link: httpUrl(row["Letterboxd URI"]),
      rewatch: false,
      watchedOn: null,
    }))
    .filter((entry) => entry.title && !inDiary.has(`${normaliseTitle(entry.title)}|${entry.year ?? ""}`));

  return filmRows([...diary, ...undated]);
}
