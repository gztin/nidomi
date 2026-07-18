import { NextResponse } from "next/server";
import { getDb, getEnv } from "@/features/auth/db";
import { getCurrentUser } from "@/features/auth/session";
import { getStoredEmailSettings } from "@/features/email/settings";

type ResendResponse = { id?: string; message?: string; name?: string };

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function redirectTo(request: Request, status: string, reason?: string) {
  const url = new URL("/admin/settings/email", request.url);
  url.searchParams.set("status", status);
  if (reason) url.searchParams.set("reason", reason.slice(0, 180));
  return NextResponse.redirect(url, 303);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character);
}

export async function POST(request: Request) {
  const manager = await getCurrentUser();
  if (!manager || manager.role !== "admin") return NextResponse.redirect(new URL("/", request.url), 303);

  const form = await request.formData();
  const testRecipient = String(form.get("testRecipient") ?? "").trim().toLowerCase();

  if (!testRecipient) return redirectTo(request, "test-failed", "請填寫測試收件信箱。");
  if (!isEmail(testRecipient)) return redirectTo(request, "test-failed", "請確認測試收件信箱格式。");

  const db = await getDb();
  const env = await getEnv();
  const secret = env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (!secret) return redirectTo(request, "missing-secret");
  const settings = await getStoredEmailSettings(db, secret).catch(() => null);
  const apiKey = settings?.apiKey?.trim() ?? "";
  if (!settings || !apiKey.startsWith("re_")) return redirectTo(request, "test-failed", "請先完成 API Key 驗證與儲存。");
  const { fromName, fromEmail } = settings;

  const deliveryId = crypto.randomUUID();
  await db.prepare("INSERT INTO email_deliveries(id,recipient_email_snapshot,template_key,status) VALUES (?,?,'admin_email_test','queued')").bind(deliveryId, testRecipient).run();

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "nidomi-email-settings/1.0",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [testRecipient],
        subject: "nidomi 寄信服務測試",
        text: `這是一封 nidomi 後台寄信服務測試信。\n\n寄件設定：${fromName} <${fromEmail}>`,
        html: `<p>這是一封 nidomi 後台寄信服務測試信。</p><p>寄件設定：${escapeHtml(fromName)} &lt;${escapeHtml(fromEmail)}&gt;</p>`,
      }),
    });
    const result = await response.json().catch(() => ({})) as ResendResponse;
    if (!response.ok) throw new Error(result.message ?? result.name ?? `Resend HTTP ${response.status}`);

    await db.prepare("UPDATE email_deliveries SET status='sent',sent_at=CURRENT_TIMESTAMP,provider_message_id=? WHERE id=?").bind(result.id ?? null, deliveryId).run();
    await db.prepare("INSERT INTO admin_audit_logs(id,admin_user_id,action,entity_type,entity_id,reason,metadata_json) VALUES (?,?,'test_email_settings','system_setting','resend','manager_tested_email_settings',?)").bind(crypto.randomUUID(), manager.id, JSON.stringify({ fromName, fromEmail, testRecipient, settingsSource: "stored" })).run();
    return redirectTo(request, "test-sent");
  } catch (error) {
    const failureCode = error instanceof Error ? error.message.slice(0, 200) : "EMAIL_TEST_FAILED";
    await db.prepare("UPDATE email_deliveries SET status='failed',failed_at=CURRENT_TIMESTAMP,failure_code=? WHERE id=?").bind(failureCode, deliveryId).run();
    return redirectTo(request, "test-failed", failureCode);
  }
}
