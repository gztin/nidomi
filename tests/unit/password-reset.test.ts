import { describe, expect, it } from "vitest";
import { getPasswordResetCooldownSeconds, getPasswordResetRetryAfterSeconds } from "../../src/features/auth/password-reset";

describe("password reset rate limiting", () => {
  it("uses exponential backoff and caps at 960 seconds", () => {
    expect([0, 1, 2, 3, 4, 5, 8].map(getPasswordResetCooldownSeconds)).toEqual([0, 60, 120, 240, 480, 960, 960]);
  });

  it("returns only the remaining cooldown", () => {
    expect(getPasswordResetRetryAfterSeconds(3, 100)).toBe(140);
    expect(getPasswordResetRetryAfterSeconds(3, 240)).toBe(0);
    expect(getPasswordResetRetryAfterSeconds(0, null)).toBe(0);
  });
});
