import { type FigmaLock, type FigmaTarget, groupByFile, isFresh } from "./figma-plan";

const API = "https://api.figma.com/v1";

// Side effects are injected, so the loop is unit-tested without the network.
export interface ExportIO {
  fetch: typeof fetch;
  // Paths are relative to the repo root.
  exists(path: string): boolean;
  write(path: string, data: Uint8Array): void;
  log(message: string): void;
  warn(message: string): void;
  now(): string;
}

export interface ExportResult {
  lock: FigmaLock;
  // Manifest keys written in this run.
  written: string[];
  // True when there was work to do and every request failed (a bad token, no
  // network). One failing node only warns.
  failed: boolean;
}

// Every request gives up after this long, so a stalled connection never hangs the run.
const TIMEOUT_MS = 30_000;

interface NodesResponse {
  err?: string | null;
  lastModified?: string;
  nodes?: Record<string, unknown>;
}

interface ImagesResponse {
  err?: string | null;
  images?: Record<string, string | null>;
}

// For each Figma file: read its lastModified and check the nodes exist, skip
// frames that are fresh in the lock (and on disk), export the rest as 2× PNG
// and download them. Failures warn and leave that frame's file and lock entry
// alone; a failing or malformed file never stops the next one.
export async function exportFrames(targets: FigmaTarget[], lock: FigmaLock, token: string, io: ExportIO): Promise<ExportResult> {
  const next: FigmaLock = { ...lock };
  const written: string[] = [];
  let requests = 0;
  let failures = 0;

  async function api<T extends { err?: string | null }>(path: string): Promise<T> {
    requests++;
    const response = await io.fetch(`${API}${path}`, { headers: { "X-Figma-Token": token }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim());
    return (await response.json()) as T;
  }

  for (const [fileKey, group] of groupByFile(targets)) {
    try {
      const meta = await api<NodesResponse>(`/files/${fileKey}/nodes?ids=${encodeURIComponent(group.map((t) => t.nodeId).join(","))}&depth=1`);
      if (meta.err) io.warn(`warn  ${fileKey}: ${meta.err}`);
      if (!meta.nodes || typeof meta.nodes !== "object" || typeof meta.lastModified !== "string") {
        failures++;
        io.warn(`warn  ${fileKey}: Figma returned no nodes`);
        continue;
      }
      const { lastModified, nodes } = meta;

      const stale = group.filter((target) => {
        if (!nodes?.[target.nodeId]) {
          io.warn(`warn  ${target.key}: node ${target.nodeId} not found in ${fileKey}`);
          return false;
        }
        if (isFresh(target, lock, lastModified) && io.exists(target.out)) {
          io.log(`skip  ${target.key}`);
          return false;
        }
        return true;
      });
      if (stale.length === 0) continue;

      const result = await api<ImagesResponse>(`/images/${fileKey}?ids=${encodeURIComponent(stale.map((t) => t.nodeId).join(","))}&format=png&scale=2`);
      if (result.err) io.warn(`warn  ${fileKey}: ${result.err}`);
      const images = result.images;
      if (!images || typeof images !== "object") {
        failures++;
        io.warn(`warn  ${fileKey}: Figma returned no images`);
        continue;
      }

      for (const target of stale) {
        const url = images?.[target.nodeId];
        if (!url) {
          io.warn(`warn  ${target.key}: Figma returned no image`);
          continue;
        }
        try {
          requests++;
          const response = await io.fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
          if (!response.ok) throw new Error(`${response.status}`);
          io.write(target.out, new Uint8Array(await response.arrayBuffer()));
          next[target.key] = { fileKey, nodeId: target.nodeId, lastModified, exportedAt: io.now() };
          written.push(target.key);
          io.log(`wrote ${target.key}`);
        } catch (error) {
          failures++;
          io.warn(`warn  ${target.key}: download failed (${(error as Error).message})`);
        }
      }
    } catch (error) {
      failures++;
      io.warn(`warn  ${fileKey}: ${(error as Error).message}`);
    }
  }

  return { lock: next, written, failed: requests > 0 && failures === requests };
}
