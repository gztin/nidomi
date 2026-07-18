import { NextResponse } from "next/server";
import { getDb } from "@/features/auth/db";
import { hashPassword, sha256 } from "@/features/auth/crypto";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/password-policy";

function redirectTo(request: Request, query: string) {
  return NextResponse.redirect(new URL(`/reset-password?${query}`, request.url), 303);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");
  const encodedToken = encodeURIComponent(token);
  if (!token || password.length < MIN_PASSWORD_LENGTH || password !== confirmPassword) return redirectTo(request, `error=password&token=${encodedToken}`);

  const db = await getDb();
  const row = await db.prepare("SELECT id,user_id userId FROM email_tokens WHERE token_hash=? AND purpose='reset_password' AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP").bind(await sha256(token)).first<{ id: string; userId: string }>();
  if (!row) return redirectTo(request, "error=invalid");

  await db.batch([
    db.prepare("UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(await hashPassword(password), row.userId),
    db.prepare("UPDATE email_tokens SET used_at=CURRENT_TIMESTAMP WHERE user_id=? AND purpose='reset_password' AND used_at IS NULL").bind(row.userId),
    db.prepare("UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL").bind(row.userId),
  ]);
  const response = redirectTo(request, "status=success");
  response.cookies.set("fh_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
