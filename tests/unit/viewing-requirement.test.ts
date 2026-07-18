import { describe, expect, it } from "vitest";
import { meetsViewingRequirement } from "../../src/features/viewing/requirement";

const base = { professionalCredentialStatus: "not_submitted" as const };

describe("viewing requirement", () => {
  it("基本門檻只要求 Email 驗證", () => {
    expect(meetsViewingRequirement("email_verified", { ...base, emailVerified: true, identityStatus: "not_submitted" })).toBe(true);
  });
  it("身分門檻要求 Email 與身分審核皆通過", () => {
    expect(meetsViewingRequirement("identity_verified", { ...base, emailVerified: true, identityStatus: "pending" })).toBe(false);
    expect(meetsViewingRequirement("identity_verified", { ...base, emailVerified: true, identityStatus: "approved" })).toBe(true);
  });
});
