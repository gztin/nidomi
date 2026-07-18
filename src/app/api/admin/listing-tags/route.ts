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

async function firstSortOrder(db: D1Database, category: string) {
  const row = await db.prepare("SELECT COALESCE(MIN(sort_order),0) minSort FROM listing_tags WHERE category=?").bind(category).first<{ minSort: number }>();
  return (row?.minSort ?? 0) - 10;
}

export async function POST(request: Request) {
  const manager = await getCurrentUser();
  if (!manager || manager.role !== "admin") return NextResponse.redirect(new URL("/", request.url), 303);

  const form = await request.formData();
  const category = text(form, "category");
  const name = text(form, "name");
  if (!isListingTagCategory(category) || !name) return redirectTo(request, "invalid");

  const db = await getDb();
  const sortOrder = await firstSortOrder(db, category);
  try {
    await db.prepare("INSERT INTO listing_tags(id,category,name,slug,sort_order) VALUES (?,?,?,?,?)")
      .bind(crypto.randomUUID(), category, name, normalizeTagSlug(category, name), sortOrder)
      .run();
  } catch {
    return redirectTo(request, "duplicate");
  }

  return redirectTo(request, "created");
}
