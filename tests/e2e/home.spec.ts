import { expect, test } from "@playwright/test";

test("房源首頁顯示核心資訊且不公開完整門牌", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("採光一房一廳");
  await expect(page.getByText("專業資格會員", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "標章說明" }).click();
  await expect(page.getByRole("heading", { name: "會員標章說明" })).toBeVisible();
  await expect(page.getByText("一般會員", { exact: true })).toBeVisible();
  await expect(page.getByText("資料驗證會員", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "預約看房" })).toBeVisible();
  await expect(page.getByText("台北市中山區測試路 1 號 5 樓")).toHaveCount(0);
});
