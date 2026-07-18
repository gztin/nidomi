import { NextResponse } from "next/server";
import { getDb, getEnv } from "@/features/auth/db";
import { getCurrentUser } from "@/features/auth/session";
import { encryptApiKey, getStoredEmailSettings } from "@/features/email/settings";

type ResendError = { message?: string; name?: string };

function redirectTo(request: Request, status: string, reason?: string) {
  const url = new URL("/admin/settings/email", request.url);
  url.searchParams.set("status", status);
  if (reason) url.searchParams.set("reason", reason.slice(0, 180));
  return NextResponse.redirect(url, 303);
}

function isSendingOnlyResponse(status: number, message: string) {
  const normalized = message.toLowerCase();
  return status === 401 && normalized.includes("restricted") && normalized.includes("send");
}

export async function POST(request: Request) {
  const manager = await getCurrentUser();
  if (!manager || manager.role !== "admin") return NextResponse.redirect(new URL("/", request.url), 303);

  const form = await request.formData();
  const enteredApiKey = String(form.get("apiKey") ?? "").trim();
  const fromName = String(form.get("fromName") ?? "").trim();
  const fromEmail = String(form.get("fromEmail") ?? "").trim().toLowerCase();
  const db = await getDb();
  const env = await getEnv();
  const secret = env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (!secret) return redirectTo(request, "missing-secret");
  let apiKey = enteredApiKey;

  if (!apiKey) {
    apiKey = (await getStoredEmailSettings(db, secret).catch(() => null))?.apiKey?.trim() ?? "";
  }
  if (!apiKey.startsWith("re_") || !fromName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    return redirectTo(request, "api-verify-failed", "請輸入有效的 Resend API Key、寄件者名稱與寄件信箱。");
  }

  try {
    const response = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "User-Agent": "nidomi-email-settings/1.0",
      },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({})) as ResendError;
    const message = result.message ?? result.name ?? `Resend HTTP ${response.status}`;
    const sendingOnly = isSendingOnlyResponse(response.status, message);

    if (!response.ok && !sendingOnly) return redirectTo(request, "api-verify-failed", message);

    const encrypted = await encryptApiKey(apiKey, secret);
    await db.batch([
      db.prepare("INSERT INTO email_provider_settings(provider,api_key_ciphertext,api_key_iv,from_name,from_email,updated_by_user_id) VALUES ('resend',?,?,?,?,?) ON CONFLICT(provider) DO UPDATE SET api_key_ciphertext=excluded.api_key_ciphertext,api_key_iv=excluded.api_key_iv,from_name=excluded.from_name,from_email=excluded.from_email,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP")
        .bind(encrypted.ciphertext, encrypted.iv, fromName, fromEmail, manager.id),
      db.prepare("INSERT INTO admin_audit_logs(id,admin_user_id,action,entity_type,entity_id,reason,metadata_json) VALUES (?,?,'verify_email_settings','system_setting','resend','manager_verified_and_saved_email_settings',?)")
        .bind(crypto.randomUUID(), manager.id, JSON.stringify({ apiKeyEntered: Boolean(enteredApiKey), accessScope: sendingOnly ? "sending_only" : "full", fromName, fromEmail })),
    ]);
    return redirectTo(request, sendingOnly ? "api-verified-limited" : "api-verified");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "無法連線至 Resend。";
    return redirectTo(request, "api-verify-failed", reason);
  }
}
