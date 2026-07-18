import { describe, expect, it } from "vitest";
import { identityDataUseNotice } from "../../src/content/identity-data-use-notice";

describe("identity data use notice", () => {
  it("uses the policy version accepted by the upload API", () => {
    expect(identityDataUseNotice.version).toBe("identity-notice-2026-07-17-v2");
  });

  it("covers the essential data-use explanation topics", () => {
    expect(identityDataUseNotice.markdown).toContain("我們會取得哪些資料");
    expect(identityDataUseNotice.markdown).toContain("資料會用來做什麼");
    expect(identityDataUseNotice.markdown).toContain("哪些人或服務可以處理資料");
    expect(identityDataUseNotice.markdown).toContain("你可以選擇不提供");
    expect(identityDataUseNotice.markdown).toContain("你可以行使的權利");
  });

  it("shows the platform contact without the launch reminder", () => {
    expect(identityDataUseNotice.markdown).toContain("資料收集者：nidomi 平台");
    expect(identityDataUseNotice.markdown).toContain("聯絡信箱：nidomi.service@gmail.com");
    expect(identityDataUseNotice.markdown).not.toContain("正式公開營運前");
  });
});
