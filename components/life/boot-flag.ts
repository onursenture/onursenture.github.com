// The Life switch marks a client navigation into /life/ so the boot readout
// types itself in. A direct load never has the flag, so its server HTML is
// final. sessionStorage can throw (privacy modes); then there is no
// animation.
const KEY = "life-boot";

export function markBoot(): void {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
}

// Reads the flag without clearing it (for a lazy useState initializer).
export function peekBoot(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

// Reads and clears the flag.
export function takeBoot(): boolean {
  try {
    const set = sessionStorage.getItem(KEY) === "1";
    sessionStorage.removeItem(KEY);
    return set;
  } catch {
    return false;
  }
}
