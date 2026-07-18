import { NextResponse } from "next/server";
import { requireManager } from "@/features/admin/access";
import { getDb } from "@/features/auth/db";
import { hashPassword, normalizeEmail } from "@/features/auth/crypto";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/password-policy";

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function POST(request: Request) {
  const manager = await requireManager();
  const form = await request.formData();
  const name = text(form, "name");
  const email = normalizeEmail(text(form, "email"));
  const phone = text(form, "phone");
  const password = String(form.get("password") ?? "");
  if (!name || !email.includes("@") || password.length < MIN_PASSWORD_LENGTH) return NextResponse.redirect(new URL("/admin/members/new?error=invalid", request.url), 303);

  const db = await getDb();
  const exists = await db.prepare("SELECT id FROM users WHERE email_normalized=?").bind(email).first();
  if (exists) return NextResponse.redirect(new URL("/admin/members/new?error=exists", request.url), 303);

  const id = crypto.randomUUID();
  const emailVerified = form.get("emailVerified") === "on";
  await db.batch([
    db.prepare("INSERT INTO users(id,email_normalized,password_hash,email_verified_at,role) VALUES (?,?,?,?,'member')").bind(id, email, await hashPassword(password), emailVerified ? new Date().toISOString() : null),
    db.prepare("INSERT INTO profiles(user_id,display_name,phone) VALUES (?,?,?)").bind(id, name, phone || null),
    db.prepare("INSERT INTO admin_audit_logs(id,admin_user_id,action,entity_type,entity_id,reason,metadata_json) VALUES (?,?,'create_member','user',?,'manager_created_member',?)").bind(crypto.randomUUID(), manager.id, id, JSON.stringify({ email, emailVerified })),
  ]);

  return NextResponse.redirect(new URL(`/admin/members/${id}`, request.url), 303);
}
