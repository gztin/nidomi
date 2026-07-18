import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/session";
import { getDb } from "@/features/auth/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), 303);
  if (user.role !== "member" || !user.emailVerified || !user.identityVerified) return NextResponse.redirect(new URL("/account/permissions?required=property", request.url), 303);
  const { id } = await params;
  const db = await getDb();
  const property = await db.prepare(`SELECT p.id,p.listing_review_status reviewStatus,(SELECT COUNT(*) FROM property_images i WHERE i.property_id=p.id AND i.deleted_at IS NULL) imageCount FROM properties p WHERE p.id=? AND p.provider_user_id=?`).bind(id,user.id).first<{id:string;reviewStatus:string;imageCount:number}>();
  if (!property) return NextResponse.redirect(new URL("/provider/properties", request.url),303);
  if (property.imageCount < 1) return NextResponse.redirect(new URL(`/provider/properties/${id}/edit?error=image`,request.url),303);
  if (property.reviewStatus === "pending" || property.reviewStatus === "approved") return NextResponse.redirect(new URL("/provider/properties",request.url),303);
  await db.batch([
    db.prepare("UPDATE properties SET listing_review_status='pending',updated_at=CURRENT_TIMESTAMP WHERE id=? AND provider_user_id=?").bind(id,user.id),
    db.prepare("INSERT INTO property_verification_events(id,property_id,verification_type,from_status,to_status,actor_user_id,note) VALUES (?,?,'listing',?,'pending',?,'member_submitted')").bind(crypto.randomUUID(),id,property.reviewStatus,user.id),
  ]);
  return NextResponse.redirect(new URL("/provider/properties?status=submitted",request.url),303);
}
