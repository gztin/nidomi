import { describe, expect, it } from "vitest";
import { canRequestViewing, deriveMemberBadgeLevel } from "../../src/features/member/verification";

describe("member verification rules", () => {
  it("註冊後預設為銅色會員", () => {
    expect(deriveMemberBadgeLevel({ emailVerified: false, identityStatus: "not_submitted", professionalCredentialStatus: "not_submitted" })).toBe("bronze");
  });

  it("Email 與身分審核通過後為綠色會員", () => {
    expect(deriveMemberBadgeLevel({ emailVerified: true, identityStatus: "approved", professionalCredentialStatus: "not_submitted" })).toBe("green");
  });

  it("資料驗證及證照審核皆通過後為金色會員", () => {
    expect(deriveMemberBadgeLevel({ emailVerified: true, identityStatus: "approved", professionalCredentialStatus: "approved" })).toBe("gold");
  });

  it("預約只要求 Email 驗證", () => {
    expect(canRequestViewing({ emailVerified: true })).toBe(true);
    expect(canRequestViewing({ emailVerified: false })).toBe(false);
  });
});
