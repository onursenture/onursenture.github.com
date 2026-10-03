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

// For each Figma file: read its lastModified and check the nodes exist, skip
// frames that are fresh in the lock (and on disk), export the rest as 2× PNG
// and download them. Failures warn and leave that frame's file and lock entry
// alone.
export async function exportFrames(targets: FigmaTarget[], lock: FigmaLock, token: string, io: ExportIO): Promise<ExportResult> {
  const next: FigmaLock = { ...lock };
  const written: string[] = [];
  let requests = 0;
  let failures = 0;

  async function api<T>(path: string): Promise<T> {
    requests++;
    const response = await io.fetch(`${API}${path}`, { headers: { "X-Figma-Token": token } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim());
    return (await response.json()) as T;
  }

  for (const [fileKey, group] of groupByFile(targets)) {
    let meta: { lastModified: string; nodes: Record<string, unknown> };
    try {
      meta = await api(`/files/${fileKey}/nodes?ids=${encodeURIComponent(group.map((t) => t.nodeId).join(","))}&depth=1`);
    } catch (error) {
      failures++;
      io.warn(`warn  ${fileKey}: ${(error as Error).message}`);
      continue;
    }

    const stale = group.filter((target) => {
      if (!meta.nodes[target.nodeId]) {
        io.warn(`warn  ${target.key}: node ${target.nodeId} not found in ${fileKey}`);
        return false;
      }
      if (isFresh(target, lock, meta.lastModified) && io.exists(target.out)) {
        io.log(`skip  ${target.key}`);
        return false;
      }
      return true;
    });
    if (stale.length === 0) continue;

    let images: Record<string, string | null>;
    try {
      const result = await api<{ err: string | null; images: Record<string, string | null> }>(
        `/images/${fileKey}?ids=${encodeURIComponent(stale.map((t) => t.nodeId).join(","))}&format=png&scale=2`,
      );
      images = result.images;
    } catch (error) {
      failures++;
      io.warn(`warn  ${fileKey}: export failed (${(error as Error).message})`);
      continue;
    }

    for (const target of stale) {
      const url = images[target.nodeId];
      if (!url) {
        io.warn(`warn  ${target.key}: Figma returned no image`);
        continue;
      }
      try {
        requests++;
        const response = await io.fetch(url);
        if (!response.ok) throw new Error(`${response.status}`);
        io.write(target.out, new Uint8Array(await response.arrayBuffer()));
        next[target.key] = { fileKey, nodeId: target.nodeId, lastModified: meta.lastModified, exportedAt: io.now() };
        written.push(target.key);
        io.log(`wrote ${target.key}`);
      } catch (error) {
        failures++;
        io.warn(`warn  ${target.key}: download failed (${(error as Error).message})`);
      }
    }
  }

  return { lock: next, written, failed: requests > 0 && failures === requests };
}
