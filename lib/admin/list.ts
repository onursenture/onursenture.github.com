// Immutable list edits for the admin editors.

export function move<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function insertAt<T>(list: readonly T[], index: number, item: T): T[] {
  return [...list.slice(0, index), item, ...list.slice(index)];
}

export function removeAt<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

export function replaceAt<T>(list: readonly T[], index: number, item: T): T[] {
  return list.map((current, i) => (i === index ? item : current));
}

// Optional text fields store undefined, never "".
export function optional(text: string): string | undefined {
  return text.trim() ? text : undefined;
}
