import { NextResponse } from "next/server";
import { getDb } from "@/features/auth/db";
import { getCurrentUser } from "@/features/auth/session";
import { randomToken, sha256 } from "@/features/auth/crypto";
import {
  getPasswordResetRetryAfterSeconds,
  PASSWORD_RESET_ADMIN_HOURLY_LIMIT,
  PASSWORD_RESET_GLOBAL_HOURLY_LIMIT,
  PASSWORD_RESET_TARGET_DAILY_LIMIT,
  PASSWORD_RESET_TARGET_HOURLY_LIMIT,
} from "@/features/auth/password-reset";
import { deliverEmail } from "@/features/email/provider";
import { buildPasswordResetEmail } from "@/features/email/templates";

type Target = { id: string; email: string; displayName: string; disabledAt: string | null };
type TargetStats = { count24h: number; countHour: number; secondsSinceLast: number | null };

function redirectTo(request: Request, id: string, params: Record<string, string | number>) {
  const url = new URL(`/admin/members/${id}`, request.url);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const manager = await getCurrentUser();
  if (!manager || manager.role !== "admin") return NextResponse.redirect(new URL("/", request.url), 303);
  const { id } = await params;
  const db = await getDb();
  const target = await db.prepare("SELECT u.id,u.email_normalized email,p.display_name displayName,u.disabled_at disabledAt FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=?").bind(id).first<Target>();
  if (!target) return NextResponse.redirect(new URL("/admin/members", request.url), 303);

  async function block(reason: string, retry = 0) {
    const recentBlock = await db.prepare("SELECT id FROM admin_audit_logs WHERE admin_user_id=? AND action='block_password_reset' AND entity_id=? AND created_at>datetime('now','-60 seconds') LIMIT 1").bind(manager!.id, id).first();
    if (!recentBlock) {
      await db.prepare("INSERT INTO admin_audit_logs(id,admin_user_id,action,entity_type,entity_id,reason,metadata_json) VALUES (?,?,'block_password_reset','user',?,'password_reset_rate_limited',?)")
        .bind(crypto.randomUUID(), manager!.id, id, JSON.stringify({ reason, retry }))
        .run();
    }
    return redirectTo(request, id, { status: "reset-blocked", reason, retry });
  }

  if (target.disabledAt) return block("disabled");

  const [targetStats, adminStats, globalStats] = await Promise.all([
    db.prepare("SELECT COUNT(*) count24h,SUM(CASE WHEN created_at>datetime('now','-1 hour') THEN 1 ELSE 0 END) countHour,CAST((julianday('now')-julianday(MAX(created_at)))*86400 AS INTEGER) secondsSinceLast FROM email_tokens WHERE user_id=? AND purpose='reset_password' AND created_at>datetime('now','-24 hours')").bind(id).first<TargetStats>(),
    db.prepare("SELECT COUNT(*) count FROM admin_audit_logs WHERE admin_user_id=? AND action='send_password_reset' AND created_at>datetime('now','-1 hour')").bind(manager.id).first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) count FROM email_deliveries WHERE template_key='password_reset' AND created_at>datetime('now','-1 hour')").first<{ count: number }>(),
  ]);
  const count24h = Number(targetStats?.count24h ?? 0);
  const countHour = Number(targetStats?.countHour ?? 0);
  const secondsSinceLast = targetStats?.secondsSinceLast === null || targetStats?.secondsSinceLast === undefined ? null : Number(targetStats.secondsSinceLast);
  const retry = getPasswordResetRetryAfterSeconds(count24h, secondsSinceLast);

  if (count24h >= PASSWORD_RESET_TARGET_DAILY_LIMIT) return block("target-day");
  if (countHour >= PASSWORD_RESET_TARGET_HOURLY_LIMIT) return block("target-hour");
  if (Number(adminStats?.count ?? 0) >= PASSWORD_RESET_ADMIN_HOURLY_LIMIT) return block("admin-hour");
  if (Number(globalStats?.count ?? 0) >= PASSWORD_RESET_GLOBAL_HOURLY_LIMIT) return block("global-hour");
  if (retry > 0) return block("cooldown", retry);

  const token = randomToken();
  await db.batch([
    db.prepare("UPDATE email_tokens SET used_at=CURRENT_TIMESTAMP WHERE user_id=? AND purpose='reset_password' AND used_at IS NULL").bind(id),
    db.prepare("INSERT INTO email_tokens(id,user_id,purpose,token_hash,expires_at) VALUES (?,?,'reset_password',?,datetime('now','+1 hour'))").bind(crypto.randomUUID(), id, await sha256(token)),
  ]);
  const resetPath = `/reset-password?token=${encodeURIComponent(token)}`;
  const message = buildPasswordResetEmail({ displayName: target.displayName, resetUrl: new URL(resetPath, request.url).toString() });
  const delivery = await deliverEmail({ db, recipient: target.email, templateKey: "password_reset", developmentUrl: resetPath, ...message });
  await db.prepare("INSERT INTO admin_audit_logs(id,admin_user_id,action,entity_type,entity_id,reason,metadata_json) VALUES (?,?,'send_password_reset','user',?,'manager_sent_password_reset',?)")
    .bind(crypto.randomUUID(), manager.id, id, JSON.stringify({ deliveryMode: delivery.mode, deliveryStatus: delivery.status, recipient: target.email }))
    .run();
  return redirectTo(request, id, { status: delivery.status === "failed" ? "reset-failed" : "reset-sent" });
}
