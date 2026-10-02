import { describe, expect, it } from "vitest";
import { isAuthorized } from "@/lib/sync/auth";

describe("isAuthorized", () => {
  it("accepts the matching bearer token", () => {
    expect(isAuthorized("Bearer s3cret", "s3cret")).toBe(true);
  });

  it("rejects wrong, missing, or malformed tokens", () => {
    expect(isAuthorized("Bearer nope!!", "s3cret")).toBe(false);
    expect(isAuthorized("Bearer s3cre", "s3cret")).toBe(false);
    expect(isAuthorized(null, "s3cret")).toBe(false);
    expect(isAuthorized("s3cret", "s3cret")).toBe(false);
  });

  it("never authorizes when the secret is unset", () => {
    expect(isAuthorized("Bearer ", undefined)).toBe(false);
    expect(isAuthorized("Bearer ", "")).toBe(false);
  });
});
