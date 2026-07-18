import { NextResponse } from "next/server";
import { getDb } from "@/features/auth/db";
import { normalizeEmail, randomToken, sha256 } from "@/features/auth/crypto";
import { deliverEmail } from "@/features/email/provider";
import { buildVerificationEmail } from "@/features/email/templates";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const db = await getDb();
  const user = await db.prepare("SELECT u.id,u.email_verified_at verified,p.display_name displayName FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.email_normalized=?").bind(email).first<{id:string;verified:string|null;displayName:string|null}>();
  if (!user || user.verified) return NextResponse.redirect(new URL("/verify-email?sent=1", request.url), 303);
  const recent = await db.prepare("SELECT id FROM email_tokens WHERE user_id=? AND purpose='verify_email' AND created_at>datetime('now','-60 seconds')").bind(user.id).first();
  if (recent) return NextResponse.redirect(new URL(`/verify-email?sent=1&email=${encodeURIComponent(email)}`, request.url), 303);

  const token = randomToken();
  await db.batch([
    db.prepare("UPDATE email_tokens SET used_at=CURRENT_TIMESTAMP WHERE user_id=? AND purpose='verify_email' AND used_at IS NULL").bind(user.id),
    db.prepare("INSERT INTO email_tokens(id,user_id,purpose,token_hash,expires_at) VALUES (?,?,'verify_email',?,datetime('now','+24 hours'))").bind(crypto.randomUUID(), user.id, await sha256(token)),
  ]);

  const verificationPath = `/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const message = buildVerificationEmail({ displayName: user.displayName ?? undefined, verificationUrl: new URL(verificationPath, request.url).toString() });
  const delivery = await deliverEmail({ db, recipient: email, templateKey: "verify_email", developmentUrl: verificationPath, ...message });
  const query = new URLSearchParams({ email, resent: "1" });
  if (delivery.mode === "local") query.set("token", token);
  else query.set(delivery.status === "failed" ? "delivery" : "sent", delivery.status === "failed" ? "failed" : "1");
  return NextResponse.redirect(new URL(`/verify-email?${query}`, request.url), 303);
}
