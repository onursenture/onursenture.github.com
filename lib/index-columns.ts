// Which optional columns of a list carry data. A column no entry fills is not
// rendered at all (no empty grid track, no header); it comes back by itself
// once any entry gets a value. Keys keep the order they are asked in.
export function visibleColumns<T, K extends keyof T>(entries: readonly T[], keys: readonly K[]): K[] {
  return keys.filter((key) =>
    entries.some((entry) => {
      const value = entry[key];
      if (value === undefined || value === null) return false;
      return typeof value === "string" ? value.trim() !== "" : true;
    }),
  );
}
