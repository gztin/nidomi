import { NextResponse } from "next/server"; import { getDb } from "@/features/auth/db"; import { sha256 } from "@/features/auth/crypto";
export async function GET(request: Request) {
  const url=new URL(request.url); const token=url.searchParams.get("token") ?? ""; const db=await getDb(); const hash=await sha256(token);
  const row=await db.prepare("SELECT id,user_id FROM email_tokens WHERE token_hash=? AND purpose='verify_email' AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP").bind(hash).first<{id:string;user_id:string}>();
  if(!row) return NextResponse.redirect(new URL("/verify-email?status=invalid",request.url));
  await db.batch([db.prepare("UPDATE users SET email_verified_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.user_id),db.prepare("UPDATE email_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.id)]);
  return NextResponse.redirect(new URL("/login?verified=1",request.url));
}
