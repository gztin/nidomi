import { describe, expect, it } from "vitest";
import { canCreateProperty, propertyAccessMessage } from "../../src/features/member/feature-access";

describe("member feature access", () => {
  it("only allows identity-verified members to create properties", () => {
    expect(canCreateProperty({ emailVerified: true, identityVerified: true })).toBe(true);
    expect(canCreateProperty({ emailVerified: true, identityVerified: false })).toBe(false);
    expect(canCreateProperty({ emailVerified: false, identityVerified: true })).toBe(false);
  });

  it("explains the next required verification step", () => {
    expect(propertyAccessMessage({ emailVerified: false, identityVerified: false })).toContain("Email");
    expect(propertyAccessMessage({ emailVerified: true, identityVerified: false })).toContain("身分驗證");
  });
});
