// AT Protocol record keys (TIDs): 53 bits of microseconds since the epoch and
// a 10-bit clock id, as 13 characters of sortable base32. A note's TID is its
// URL and, later, its Bluesky record key.

const ALPHABET = "234567abcdefghijklmnopqrstuvwxyz";
export const TID_PATTERN = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/;

export function tidFromTime(ms: number, offsetMicros = 0, clockId = 0): string {
  if (!Number.isInteger(ms) || ms < 0) throw new Error(`bad TID time ${ms}`);
  if (!Number.isInteger(clockId) || clockId < 0 || clockId > 1023) throw new Error(`bad TID clock id ${clockId}`);
  let value = ((BigInt(ms) * BigInt(1000) + BigInt(offsetMicros)) << BigInt(10)) | BigInt(clockId);
  let out = "";
  for (let i = 0; i < 13; i++) {
    out = ALPHABET[Number(value & BigInt(31))] + out;
    value >>= BigInt(5);
  }
  return out;
}

// The millisecond a TID was made at.
export function tidTime(tid: string): number {
  let value = BigInt(0);
  for (const char of tid) value = (value << BigInt(5)) | BigInt(ALPHABET.indexOf(char));
  return Number((value >> BigInt(10)) / BigInt(1000));
}

export function randomClockId(): number {
  return Math.floor(Math.random() * 1024);
}
