import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/session";
import { getDb, getEnv } from "@/features/auth/db";
import { encryptApiKey, getStoredEmailSettings } from "@/features/email/settings";

export async function POST(request: Request) {
  const manager = await getCurrentUser();
  if (!manager || manager.role !== "admin") return NextResponse.redirect(new URL("/", request.url), 303);

  const form = await request.formData();
  const enteredApiKey = String(form.get("apiKey") ?? "").trim();
  const fromName = String(form.get("fromName") ?? "").trim();
  const fromEmail = String(form.get("fromEmail") ?? "").trim().toLowerCase();
  const env = await getEnv();
  const secret = env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (!secret) return NextResponse.redirect(new URL("/admin/settings/email?status=missing-secret", request.url), 303);

  const db = await getDb();
  const current = await getStoredEmailSettings(db, secret).catch(() => null);
  const apiKey = enteredApiKey || current?.apiKey || "";
  if (!apiKey.startsWith("re_") || !fromName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    return NextResponse.redirect(new URL("/admin/settings/email?status=invalid", request.url), 303);
  }

  const encrypted = await encryptApiKey(apiKey, secret);
  await db.batch([
    db.prepare("INSERT INTO email_provider_settings(provider,api_key_ciphertext,api_key_iv,from_name,from_email,updated_by_user_id) VALUES ('resend',?,?,?,?,?) ON CONFLICT(provider) DO UPDATE SET api_key_ciphertext=excluded.api_key_ciphertext,api_key_iv=excluded.api_key_iv,from_name=excluded.from_name,from_email=excluded.from_email,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP")
      .bind(encrypted.ciphertext, encrypted.iv, fromName, fromEmail, manager.id),
    db.prepare("INSERT INTO admin_audit_logs(id,admin_user_id,action,entity_type,entity_id,reason,metadata_json) VALUES (?,?,'update_email_settings','system_setting','resend','manager_updated_email_settings',?)")
      .bind(crypto.randomUUID(), manager.id, JSON.stringify({ fromName, fromEmail, apiKeyChanged: Boolean(enteredApiKey) })),
  ]);
  return NextResponse.redirect(new URL("/admin/settings/email?status=saved", request.url), 303);
}
