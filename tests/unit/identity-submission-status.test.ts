import { describe, expect, it } from "vitest";
import { canUploadIdentity, identityStatusLabel, identityUploadLabel } from "../../src/features/identity/submission-status";

describe("identity submission status", () => {
  it.each([
    [null, false, "未驗證"],
    ["pending", false, "審核中"],
    ["changes_requested", false, "需補件"],
    ["rejected", false, "未通過"],
    ["approved", false, "已驗證"],
    ["revoked", false, "未驗證"],
  ] as const)("maps %s to %s", (status, verified, label) => {
    expect(identityStatusLabel(status, verified)).toBe(label);
  });

  it("prioritizes the verified user flag", () => {
    expect(identityStatusLabel("pending", true)).toBe("已驗證");
  });

  it("allows replacement unless identity verification is approved", () => {
    expect(canUploadIdentity("pending", false)).toBe(true);
    expect(canUploadIdentity("changes_requested", false)).toBe(true);
    expect(canUploadIdentity("approved", false)).toBe(false);
    expect(canUploadIdentity(null, true)).toBe(false);
  });

  it("uses the reupload label after any submission", () => {
    expect(identityUploadLabel(null)).toBe("前往身分驗證");
    expect(identityUploadLabel("pending")).toBe("重新上傳資料");
  });
});
