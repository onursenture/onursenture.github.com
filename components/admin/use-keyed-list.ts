"use client";

import { useState } from "react";
import { insertAt, move, removeAt, replaceAt } from "@/lib/admin/list";

// crypto.randomUUID throws outside secure contexts (a LAN dev URL), so keys
// come from a counter.
let nextKey = 0;

// Stable React keys for an editable list. Items have no stable identity (Lab
// rows, paragraphs) or one that is being edited (block and image ids), so the
// keys live here and move with their items. Keys are only created in event
// handlers; the render stays pure.
export function useKeyedList<T>(items: T[], onChange: (next: T[]) => void) {
  const [keys, setKeys] = useState<string[]>(() => items.map((_, index) => `initial-${index}`));
  // Defensive: if the list changed length behind our back, pad or trim.
  const current = keys.length === items.length ? keys : items.map((_, index) => keys[index] ?? `extra-${index}`);
  return {
    keys: current,
    move(from: number, to: number) {
      setKeys(move(current, from, to));
      onChange(move(items, from, to));
    },
    // Returns the new item's key, so a caller can open it.
    insert(at: number, item: T): string {
      const key = `key-${Date.now()}-${nextKey++}`;
      setKeys(insertAt(current, at, key));
      onChange(insertAt(items, at, item));
      return key;
    },
    remove(at: number) {
      setKeys(removeAt(current, at));
      onChange(removeAt(items, at));
    },
    update(at: number, item: T) {
      onChange(replaceAt(items, at, item));
    },
  };
}
