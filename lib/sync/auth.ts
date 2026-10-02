import { timingSafeEqual } from "node:crypto";

// True when the Authorization header is "Bearer <secret>". An unset secret
// never authorizes, so a missing env var can't open the endpoint.
export function isAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
