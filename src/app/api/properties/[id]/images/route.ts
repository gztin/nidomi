import { NextResponse } from "next/server";
import { getDb, getEnv } from "@/features/auth/db";
import { getCurrentUser } from "@/features/auth/session";
import { readImageDimensions } from "@/features/images/dimensions";
import { canAddPropertyImages, IMAGE_ALLOWED_TYPES, IMAGE_MAX_INPUT_BYTES, PROPERTY_IMAGE_LIMIT } from "@/features/images/policy";

type PropertyRow = { id: string; title: string };
type ImagePosition = { count: number; maxSortOrder: number | null };

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return jsonError("請先登入。", 401);
  const { id } = await params;
  const db = await getDb();
  const property = await db.prepare("SELECT id,title FROM properties WHERE id=? AND provider_user_id=?").bind(id, user.id).first<PropertyRow>();
  if (!property) return jsonError("你沒有這間房源的照片管理權限。", 403);

  const formData = await request.formData();
  const files = formData.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
  if (!files.length) return jsonError("請選擇要上傳的照片。", 400);
  if (files.some((file) => !IMAGE_ALLOWED_TYPES.includes(file.type as (typeof IMAGE_ALLOWED_TYPES)[number]) || file.size > IMAGE_MAX_INPUT_BYTES)) {
    return jsonError("僅接受 JPG、PNG，且每張照片不得超過 5MB。", 400);
  }

  const position = await db.prepare(`SELECT COUNT(*) count,MAX(sort_order) maxSortOrder FROM property_images WHERE property_id=? AND deleted_at IS NULL`)
    .bind(id).first<ImagePosition>();
  const existingCount = Number(position?.count ?? 0);
  if (!canAddPropertyImages(existingCount, files.length)) return jsonError(`每間房源最多上傳 ${PROPERTY_IMAGE_LIMIT} 張照片。`, 409);

  const env = await getEnv();
  const uploadedKeys: string[] = [];
  const rows: Array<{ id: string; key: string; mimeType: string; size: number; width: number; height: number; sortOrder: number; isCover: boolean }> = [];
  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const buffer = await file.arrayBuffer();
      const dimensions = readImageDimensions(buffer, file.type);
      if (!dimensions) throw new Error("INVALID_IMAGE");
      const imageId = crypto.randomUUID();
      const key = `properties/${id}/${imageId}.${file.type === "image/png" ? "png" : "jpg"}`;
      await env.PROPERTY_IMAGES.put(key, buffer, { httpMetadata: { contentType: file.type } });
      uploadedKeys.push(key);
      rows.push({
        id: imageId,
        key,
        mimeType: file.type,
        size: file.size,
        width: dimensions.width,
        height: dimensions.height,
        sortOrder: Number(position?.maxSortOrder ?? -1) + index + 1,
        isCover: existingCount === 0 && index === 0,
      });
    }

    await db.batch(rows.map((row, index) => db.prepare(`INSERT INTO property_images(id,property_id,r2_object_key,mime_type,byte_size,width,height,alt_text,sort_order,is_cover) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .bind(row.id, id, row.key, row.mimeType, row.size, row.width, row.height, `${property.title} 房源照片 ${existingCount + index + 1}`, row.sortOrder, row.isCover ? 1 : 0)));

    return NextResponse.json({ images: rows.map((row) => ({
      id: row.id,
      url: `/api/properties/${id}/images/${row.id}`,
      byteSize: row.size,
      isCover: row.isCover,
    })) });
  } catch (error) {
    await Promise.allSettled(uploadedKeys.map((key) => env.PROPERTY_IMAGES.delete(key)));
    console.error("Property image upload failed", { propertyId: id, error });
    return jsonError(error instanceof Error && error.message === "INVALID_IMAGE" ? "圖片內容無法辨識，請重新選擇。" : "照片上傳失敗，請稍後再試。", 400);
  }
}
