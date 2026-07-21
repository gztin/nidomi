import { NextResponse } from "next/server";
import { getDb } from "@/features/auth/db";
import { hashPassword, normalizeEmail, randomToken, sha256 } from "@/features/auth/crypto";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/password-policy";
import { deliverEmail } from "@/features/email/provider";
import { buildVerificationEmail } from "@/features/email/templates";

export async function POST(request: Request) {
  const form = await request.formData(); const name = String(form.get("name") ?? "").trim();
  const email = normalizeEmail(String(form.get("email") ?? "")); const password = String(form.get("password") ?? "");
  const policyVersionIds = {
    terms: "policy-terms-2026-07-3",
    privacy: "policy-privacy-2026-07-3",
    member: "policy-member-2026-07",
  } as const;
  if (!name || !email.includes("@") || password.length < MIN_PASSWORD_LENGTH || form.get("consent") !== "on") return NextResponse.redirect(new URL("/register?error=invalid", request.url), 303);
  const db = await getDb(); const exists = await db.prepare("SELECT id FROM users WHERE email_normalized = ?").bind(email).first();
  if (exists) return NextResponse.redirect(new URL("/register?error=exists", request.url), 303);
  const userId = crypto.randomUUID(); const token = randomToken(); const tokenHash = await sha256(token);
  await db.batch([
    db.prepare("INSERT INTO users (id,email_normalized,password_hash) VALUES (?,?,?)").bind(userId,email,await hashPassword(password)),
    db.prepare("INSERT INTO profiles (user_id,display_name) VALUES (?,?)").bind(userId,name),
    db.prepare("INSERT INTO email_tokens (id,user_id,purpose,token_hash,expires_at) VALUES (?,?,\'verify_email\',?,datetime(\'now\',\'+24 hours\'))").bind(crypto.randomUUID(),userId,tokenHash),
    db.prepare("INSERT INTO user_consents(id,user_id,policy_version_id,source) VALUES (?,?,?,\'registration\')").bind(crypto.randomUUID(),userId,policyVersionIds.terms),
    db.prepare("INSERT INTO user_consents(id,user_id,policy_version_id,source) VALUES (?,?,?,\'registration\')").bind(crypto.randomUUID(),userId,policyVersionIds.privacy),
    db.prepare("INSERT INTO user_consents(id,user_id,policy_version_id,source) VALUES (?,?,?,\'registration\')").bind(crypto.randomUUID(),userId,policyVersionIds.member),
  ]);
  const verificationPath = `/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const verificationUrl = new URL(verificationPath, request.url).toString();
  const message = buildVerificationEmail({ displayName: name, verificationUrl });
  const delivery = await deliverEmail({ db, recipient: email, templateKey: "verify_email", developmentUrl: verificationPath, ...message });
  const query = new URLSearchParams({ email });
  if (delivery.mode === "local") query.set("token", token);
  else query.set(delivery.status === "failed" ? "delivery" : "sent", delivery.status === "failed" ? "failed" : "1");
  return NextResponse.redirect(new URL(`/verify-email?${query}`, request.url), 303);
}
