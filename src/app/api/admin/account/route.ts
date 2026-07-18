import { NextResponse } from "next/server";
import { getDb } from "@/features/auth/db";
import { getCurrentUser } from "@/features/auth/session";

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function redirectTo(request: Request, query: string) {
  return NextResponse.redirect(new URL(`/admin/account?${query}`, request.url), 303);
}

export async function POST(request: Request) {
  const manager = await getCurrentUser();
  if (!manager || manager.role !== "admin") return NextResponse.redirect(new URL("/", request.url), 303);
  const form = await request.formData();
  const displayName = text(form, "displayName");
  const phone = text(form, "phone");
  if (!displayName || displayName.length > 80 || phone.length > 30) return redirectTo(request, "error=invalid");

  const db = await getDb();
  await db.batch([
    db.prepare("UPDATE profiles SET display_name=?,phone=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(displayName, phone || null, manager.id),
    db.prepare("INSERT INTO admin_audit_logs(id,admin_user_id,action,entity_type,entity_id,reason,metadata_json) VALUES (?,?,'update_own_account','user',?,'manager_updated_own_profile',?)").bind(crypto.randomUUID(), manager.id, manager.id, JSON.stringify({ fields: ["displayName", "phone"] })),
  ]);
  return redirectTo(request, "status=saved");
}
