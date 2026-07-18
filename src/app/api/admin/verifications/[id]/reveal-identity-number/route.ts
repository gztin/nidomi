import { NextResponse } from "next/server";
import { getDb } from "@/features/auth/db";
import { getCurrentUser } from "@/features/auth/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const manager = await getCurrentUser();
  if (!manager || manager.role !== "admin" || !manager.canReviewDocuments) return NextResponse.redirect(new URL("/", request.url), 303);
  const { id } = await params;
  const db = await getDb();
  const submission = await db.prepare("SELECT id FROM identity_verification_submissions WHERE id=? AND identity_number_ciphertext IS NOT NULL").bind(id).first();
  if (!submission) return NextResponse.redirect(new URL(`/admin/verifications/${id}`, request.url), 303);
  await db.prepare("INSERT INTO admin_audit_logs(id,admin_user_id,action,entity_type,entity_id,reason) VALUES (?,?,'reveal_identity_number','identity_submission',?,'identity_review')").bind(crypto.randomUUID(), manager.id, id).run();
  const response = NextResponse.redirect(new URL(`/admin/verifications/${id}`, request.url), 303);
  response.cookies.set(`fh_identity_${id}`, "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: `/admin/verifications/${id}`, maxAge: 300 });
  return response;
}
