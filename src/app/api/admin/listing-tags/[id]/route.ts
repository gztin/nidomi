import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/session";
import { getDb } from "@/features/auth/db";
import { isListingTagCategory, normalizeTagSlug } from "@/features/property/listing-tags";

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function redirectTo(request: Request, status: string) {
  return NextResponse.redirect(new URL(`/admin/listing-tags?status=${status}`, request.url), 303);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const manager = await getCurrentUser();
  if (!manager || manager.role !== "admin") return NextResponse.redirect(new URL("/", request.url), 303);

  const { id } = await params;
  const form = await request.formData();
  const intent = text(form, "intent");
  const db = await getDb();

  if (intent === "delete") {
    await db.batch([
      db.prepare("DELETE FROM property_listing_tags WHERE tag_id=?").bind(id),
      db.prepare("DELETE FROM listing_tags WHERE id=?").bind(id),
    ]);
    return redirectTo(request, "deleted");
  }

  if (intent === "toggle") {
    const tag = await db.prepare("SELECT disabled_at disabledAt FROM listing_tags WHERE id=?").bind(id).first<{ disabledAt: string | null }>();
    await db.prepare("UPDATE listing_tags SET disabled_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(tag?.disabledAt ? null : new Date().toISOString(), id)
      .run();
    return redirectTo(request, tag?.disabledAt ? "enabled" : "disabled");
  }

  const category = text(form, "category");
  const name = text(form, "name");
  if (!isListingTagCategory(category) || !name) return redirectTo(request, "invalid");

  try {
    await db.prepare("UPDATE listing_tags SET category=?,name=?,slug=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(category, name, normalizeTagSlug(category, name), id)
      .run();
  } catch {
    return redirectTo(request, "duplicate");
  }

  return redirectTo(request, "saved");
}
