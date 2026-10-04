import { describe, expect, it } from "vitest";
import { adminGithubId, signSession, verifySession } from "@/lib/auth/session";

const secret = "s".repeat(40);
const other = "o".repeat(40);
const now = new Date("2026-10-04T10:00:00.000Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

describe("session", () => {
  it("accepts a session signed for the admin", async () => {
    const token = await signSession("123", { secret, now });
    expect(await verifySession(token, { adminId: "123", secret, now: days(1) })).toBe(true);
  });

  it("rejects another GitHub user, another secret, an expired token and no token", async () => {
    const token = await signSession("123", { secret, now });
    expect(await verifySession(token, { adminId: "999", secret, now })).toBe(false);
    expect(await verifySession(token, { adminId: "123", secret: other, now })).toBe(false);
    expect(await verifySession(token, { adminId: "123", secret, now: days(31) })).toBe(false);
    expect(await verifySession(undefined, { adminId: "123", secret, now })).toBe(false);
    expect(await verifySession("not.a.jwt", { adminId: "123", secret, now })).toBe(false);
  });

  it("ignores whitespace around the admin id", async () => {
    const token = await signSession("123", { secret, now });
    expect(await verifySession(token, { adminId: " 123\n", secret, now })).toBe(true);
    expect(await verifySession(token, { adminId: "  ", secret, now })).toBe(false);
    expect(adminGithubId(" 123\n")).toBe("123");
    expect(adminGithubId("")).toBeUndefined();
  });

  it("never accepts anything without an admin id or a long enough secret", async () => {
    const token = await signSession("123", { secret, now });
    expect(await verifySession(token, { adminId: "", secret, now })).toBe(false);
    await expect(signSession("123", { secret: "short", now })).rejects.toThrow("AUTH_SECRET");
    expect(await verifySession(token, { adminId: "123", secret: "short", now })).toBe(false);
  });
});
