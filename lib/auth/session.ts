import { SignJWT, jwtVerify } from "jose";

// The admin session (Sprint 7 spec §4.2): an HS256 JWT whose subject is the
// GitHub user id, valid 30 days, signed with AUTH_SECRET.
export const SESSION_DAYS = 30;
const MIN_SECRET = 32;

function key(secret: string | undefined): Uint8Array {
  if (!secret || secret.length < MIN_SECRET) throw new Error(`AUTH_SECRET must be set to at least ${MIN_SECRET} characters`);
  return new TextEncoder().encode(secret);
}

export async function signSession(githubId: string, options: { secret?: string; now?: Date } = {}): Promise<string> {
  const signingKey = key(options.secret ?? process.env.AUTH_SECRET);
  const issuedAt = Math.floor((options.now ?? new Date()).getTime() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(githubId)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_DAYS * 86_400)
    .sign(signingKey);
}

// ADMIN_GITHUB_ID without stray whitespace (a pasted env value often ends in
// a newline); undefined when unset or blank.
export function adminGithubId(value = process.env.ADMIN_GITHUB_ID): string | undefined {
  return value?.trim() || undefined;
}

// True only for an unexpired session signed with AUTH_SECRET for ADMIN_GITHUB_ID.
export async function verifySession(
  token: string | undefined,
  options: { adminId?: string; secret?: string; now?: Date } = {},
): Promise<boolean> {
  const adminId = adminGithubId(options.adminId ?? process.env.ADMIN_GITHUB_ID);
  if (!token || !adminId) return false;
  try {
    const { payload } = await jwtVerify(token, key(options.secret ?? process.env.AUTH_SECRET), {
      algorithms: ["HS256"],
      currentDate: options.now,
    });
    return payload.sub === adminId;
  } catch {
    return false;
  }
}
