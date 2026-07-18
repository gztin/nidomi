import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/session";
import { getDb } from "@/features/auth/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const manager = await getCurrentUser();
  if (!manager || manager.role !== "admin") return NextResponse.redirect(new URL("/",request.url),303);
  const { id } = await params;
  const form = await request.formData();
  const verificationType = String(form.get("verificationType"));
  const decision = String(form.get("decision"));
  if (!['listing','rights'].includes(verificationType) || !['approved','rejected'].includes(decision)) return NextResponse.redirect(new URL(`/admin/properties/${id}`,request.url),303);
  const db = await getDb();
  const property = await db.prepare("SELECT listing_review_status listingStatus,rights_verification_status rightsStatus FROM properties WHERE id=?").bind(id).first<{listingStatus:string;rightsStatus:string}>();
  if (!property) return NextResponse.redirect(new URL("/admin/properties",request.url),303);
  const fromStatus = verificationType === "listing" ? property.listingStatus : property.rightsStatus;
  if (verificationType === "listing") {
    await db.batch([
      db.prepare(`UPDATE properties SET listing_review_status=?,listing_reviewed_at=CURRENT_TIMESTAMP,status=CASE WHEN ?='approved' THEN 'published' ELSE 'draft' END,published_at=CASE WHEN ?='approved' THEN COALESCE(published_at,CURRENT_TIMESTAMP) ELSE published_at END,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(decision,decision,decision,id),
      db.prepare("INSERT INTO property_verification_events(id,property_id,verification_type,from_status,to_status,actor_user_id,note) VALUES (?,?,'listing',?,?,?,'admin_review')").bind(crypto.randomUUID(),id,fromStatus,decision,manager.id),
    ]);
  } else {
    await db.batch([
      db.prepare("UPDATE properties SET rights_verification_status=?,rights_verified_at=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE NULL END,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(decision,decision,id),
      db.prepare("INSERT INTO property_verification_events(id,property_id,verification_type,from_status,to_status,actor_user_id,note) VALUES (?,?,'rights',?,?,?,'admin_review')").bind(crypto.randomUUID(),id,fromStatus,decision,manager.id),
    ]);
  }
  await db.prepare("INSERT INTO admin_audit_logs(id,admin_user_id,action,entity_type,entity_id,reason,metadata_json) VALUES (?,?,'review_property_verification','property',?,'property_verification',?)").bind(crypto.randomUUID(),manager.id,id,JSON.stringify({verificationType,decision,fromStatus})).run();
  return NextResponse.redirect(new URL(`/admin/properties/${id}`,request.url),303);
}
