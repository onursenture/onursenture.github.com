// The resume email never sits in the static HTML as one string (basic scraper
// protection, Sprint 8 spec §3.1): the server passes it base64-encoded and
// renders it in pieces; the client turns it into a mailto: link.

export function encodeEmail(address: string): string {
  return Buffer.from(address, "utf8").toString("base64");
}

export function decodeEmail(code: string): string {
  return new TextDecoder().decode(Uint8Array.from(atob(code), (char) => char.charCodeAt(0)));
}

export function emailPieces(address: string): string[] {
  return address.split(/([@.])/).filter(Boolean);
}
