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
  const user = await getCurrentUser();
  if (!user || user.role !== "member") return new NextResponse("Forbidden", { status: 403 });

  const { id, side } = await params;
  if (!validSides.has(side)) return new NextResponse("Not found", { status: 404 });

  const db = await getDb();
  const document = await db.prepare(`SELECT d.id,d.r2_object_key key,d.mime_type mimeType
    FROM identity_documents d
    JOIN identity_verification_submissions s ON s.id=d.submission_id
    WHERE d.submission_id=? AND d.document_side=? AND d.deleted_at IS NULL AND s.user_id=?`)
    .bind(id, side, user.id).first<DocumentRow>();
  if (!document) return new NextResponse("Not found", { status: 404 });

  const object = await (await getEnv()).PRIVATE_DOCUMENTS.get(document.key);
  if (!object) return new NextResponse("File not found", { status: 404 });

  await db.prepare("INSERT INTO identity_document_access_logs(id,document_id,actor_user_id,action,purpose) VALUES (?,?,?,'preview','member_own_verification')")
    .bind(crypto.randomUUID(), document.id, user.id).run();

  return new Response(object.body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "Content-Type": document.mimeType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
