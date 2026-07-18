import { NextResponse } from "next/server";
import { getDb, getEnv } from "@/features/auth/db";
import { getCurrentUser } from "@/features/auth/session";

const validSides = new Set(["front", "back"]);

type DocumentRow = {
  id: string;
  key: string;
  mimeType: string;
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; side: string }> }) {
  const manager = await getCurrentUser();
  if (!manager || manager.role !== "admin" || !manager.canReviewDocuments) return new NextResponse("Forbidden", { status: 403 });

  const { id, side } = await params;
  if (!validSides.has(side)) return new NextResponse("Not found", { status: 404 });

  const db = await getDb();
  const document = await db.prepare("SELECT id,r2_object_key key,mime_type mimeType FROM identity_documents WHERE submission_id=? AND document_side=? AND deleted_at IS NULL").bind(id, side).first<DocumentRow>();
  if (!document) return new NextResponse("Not found", { status: 404 });

  await db.prepare("INSERT INTO identity_document_access_logs(id,document_id,actor_user_id,action,purpose) VALUES (?,?,?,'preview','admin_member_detail')").bind(crypto.randomUUID(), document.id, manager.id).run();

  const object = await (await getEnv()).PRIVATE_DOCUMENTS.get(document.key);
  if (!object) return new NextResponse("File not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "Content-Type": document.mimeType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
