import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/session";
import { getDb } from "@/features/auth/db";

const decisions = new Set(["approved", "changes_requested", "rejected"]);

function redirectTo(request: Request, id: string, error?: string) {
  return NextResponse.redirect(new URL(`/admin/verifications/${id}${error ? `?error=${error}` : ""}`, request.url), 303);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const manager = await getCurrentUser();
  if (!manager || manager.role !== "admin" || !manager.canReviewDocuments) return NextResponse.redirect(new URL("/", request.url), 303);
  const { id } = await params;
  const form = await request.formData();
  const decision = String(form.get("decision"));
  const reasonCode = String(form.get("reasonCode") ?? "").trim();
  const reasonDetail = String(form.get("reasonDetail") ?? "").trim();
  if (!decisions.has(decision) || !reasonCode || (decision !== "approved" && !reasonDetail)) return redirectTo(request, id, "required");

  const db = await getDb();
  const submission = await db.prepare("SELECT user_id userId,identity_number_lookup_hmac lookupHmac FROM identity_verification_submissions WHERE id=? AND status='pending'").bind(id).first<{ userId: string; lookupHmac: string | null }>();
  if (!submission) return redirectTo(request, id);

  const statements = [];
  if (decision === "approved") {
    if (!submission.lookupHmac) return redirectTo(request, id, "identity-number-required");
    const existing = await db.prepare("SELECT user_id userId FROM identity_verified_claims WHERE identity_number_lookup_hmac=?").bind(submission.lookupHmac).first<{ userId: string }>();
    if (existing && existing.userId !== submission.userId) return redirectTo(request, id, "duplicate");
    statements.push(existing
      ? db.prepare("UPDATE identity_verified_claims SET submission_id=? WHERE user_id=?").bind(id, submission.userId)
      : db.prepare("INSERT INTO identity_verified_claims(user_id,submission_id,identity_number_lookup_hmac) VALUES (?,?,?)").bind(submission.userId, id, submission.lookupHmac));
  }

  statements.push(
    db.prepare("UPDATE identity_verification_submissions SET status=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(decision, id),
    db.prepare("INSERT INTO identity_verification_reviews(id,submission_id,reviewer_user_id,decision,reason_code,reason_detail) VALUES (?,?,?,?,?,?)").bind(crypto.randomUUID(), id, manager.id, decision, reasonCode, reasonDetail || null),
    db.prepare(decision === "approved" ? "UPDATE users SET identity_verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?" : "UPDATE users SET identity_verified_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(submission.userId),
    db.prepare("INSERT INTO admin_audit_logs(id,admin_user_id,action,entity_type,entity_id,reason,metadata_json) VALUES (?,?,'review_identity_submission','identity_submission',?,?,?)").bind(crypto.randomUUID(), manager.id, id, reasonCode, JSON.stringify({ decision, reasonDetail })),
  );

  try {
    await db.batch(statements);
    return redirectTo(request, id);
  } catch (error) {
    console.error("Identity review failed", { id, error });
    return redirectTo(request, id, decision === "approved" ? "duplicate" : "required");
  }
}
