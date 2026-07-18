import { NextResponse } from "next/server";
import { getDb } from "@/features/auth/db";
import { normalizeEmail, randomToken, sha256, verifyPassword } from "@/features/auth/crypto";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const password = String(form.get("password") ?? "");
  const requested = String(form.get("next") ?? "/");
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
  const db = await getDb();
  const user = await db.prepare("SELECT id,password_hash,role FROM users WHERE email_normalized=? AND disabled_at IS NULL").bind(email).first<{ id: string; password_hash: string; role:"member"|"admin" }>();
  if (!user || !await verifyPassword(password, user.password_hash)) return NextResponse.redirect(new URL(`/login?error=invalid&next=${encodeURIComponent(next)}`, request.url), 303);
  const token = randomToken();
  await db.prepare("INSERT INTO sessions(id,user_id,token_hash,expires_at) VALUES (?,?,?,datetime('now','+30 days'))").bind(crypto.randomUUID(), user.id, await sha256(token)).run();
  const destination = user.role === "admin" ? "/admin" : next;
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.cookies.set("fh_session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 2592000 });
  return response;
}
