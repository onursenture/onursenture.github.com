// The Life switch marks a client navigation into /life/ so the boot readout
// types itself in. A direct load never has the flag, so its server HTML is
// final. The flag stores a timestamp and expires after MAX_AGE, so one left
// over from a cancelled navigation cannot trigger typing on a later direct
// load. sessionStorage can throw (privacy modes); then there is no animation.
const KEY = "life-boot";
const MAX_AGE = 3000;

export function markBoot(): void {
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {}
}

function fresh(raw: string | null): boolean {
  const age = Date.now() - Number(raw);
  return raw !== null && age >= 0 && age < MAX_AGE;
}

// Reads the flag without clearing it (for a lazy useState initializer).
export function peekBoot(): boolean {
  try {
    return fresh(sessionStorage.getItem(KEY));
  } catch {
    return false;
  }
}

// Reads and clears the flag.
export function takeBoot(): boolean {
  try {
    const set = fresh(sessionStorage.getItem(KEY));
    sessionStorage.removeItem(KEY);
    return set;
  } catch {
    return false;
  }
}
