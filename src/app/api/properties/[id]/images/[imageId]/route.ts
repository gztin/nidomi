import { NextResponse } from "next/server";
import { getDb, getEnv } from "@/features/auth/db";
import { getCurrentUser } from "@/features/auth/session";

type ImageRow = {
  id: string;
  key: string;
  mimeType: string;
  propertyStatus: string;
  ownerId: string;
  isCover: number;
};

async function getImage(propertyId: string, imageId: string) {
  return (await getDb()).prepare(`SELECT i.id,i.r2_object_key key,i.mime_type mimeType,i.is_cover isCover,p.status propertyStatus,p.provider_user_id ownerId
    FROM property_images i JOIN properties p ON p.id=i.property_id
    WHERE i.id=? AND i.property_id=? AND i.deleted_at IS NULL`).bind(imageId, propertyId).first<ImageRow>();
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const { id, imageId } = await params;
  const image = await getImage(id, imageId);
  if (!image) return new NextResponse("Not found", { status: 404 });
  if (image.propertyStatus !== "published") {
    const user = await getCurrentUser();
    if (!user || (user.id !== image.ownerId && user.role !== "admin")) return new NextResponse("Forbidden", { status: 403 });
  }
  const object = await (await getEnv()).PROPERTY_IMAGES.get(image.key);
  if (!object) return new NextResponse("Not found", { status: 404 });
  return new Response(object.body, { headers: {
    "Cache-Control": image.propertyStatus === "published" ? "public, max-age=3600" : "private, no-store",
    "Content-Type": image.mimeType,
    "Content-Disposition": "inline",
    "X-Content-Type-Options": "nosniff",
  } });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
  const { id, imageId } = await params;
  const image = await getImage(id, imageId);
  if (!image || image.ownerId !== user.id) return NextResponse.json({ error: "你沒有這張照片的管理權限。" }, { status: 403 });
  const db = await getDb();
  const statements = [db.prepare("UPDATE property_images SET deleted_at=CURRENT_TIMESTAMP,is_cover=0 WHERE id=? AND property_id=? AND deleted_at IS NULL").bind(imageId, id)];
  if (image.isCover) {
    statements.push(db.prepare(`UPDATE property_images SET is_cover=1 WHERE id=(SELECT id FROM property_images WHERE property_id=? AND id<>? AND deleted_at IS NULL ORDER BY sort_order,id LIMIT 1)`).bind(id, imageId));
  }
  await db.batch(statements);
  try {
    await (await getEnv()).PROPERTY_IMAGES.delete(image.key);
  } catch (error) {
    console.error("Property image R2 cleanup failed", { propertyId: id, imageId, error });
  }
  return NextResponse.json({ ok: true });
}
