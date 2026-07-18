import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/session";
import { getDb } from "@/features/auth/db";
import { hashPassword, normalizeEmail } from "@/features/auth/crypto";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/password-policy";
import { STAFF_NOTICE_VERSION, isPropertyOwner } from "@/features/property/staff-access";

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function redirectTo(request: Request, status: string) {
  return NextResponse.redirect(new URL(`/provider/staff?status=${status}`, request.url), 303);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/provider/staff", request.url), 303);
  const form = await request.formData();
  const intent = text(form, "intent");
  const propertyId = text(form, "propertyId");
  if (!propertyId) return redirectTo(request, "invalid");
  const db = await getDb();
  if (!(await isPropertyOwner(db, user.id, propertyId))) return redirectTo(request, "forbidden");
  const permissionLevel = text(form, "permissionLevel");
  if (intent !== "remove" && !["booking", "manage"].includes(permissionLevel)) return redirectTo(request, "invalid");

  if (intent === "remove") {
    const staffUserId = text(form, "staffUserId");
    if (!staffUserId) return redirectTo(request, "invalid");
    await db.prepare("UPDATE property_staff SET disabled_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE property_id=? AND staff_user_id=?").bind(propertyId, staffUserId).run();
    return redirectTo(request, "removed");
  }

  if (text(form, "noticeAccepted") !== STAFF_NOTICE_VERSION) return redirectTo(request, "invalid");
  let staffUserId = text(form, "staffUserId");
  if (intent === "assign") {
    if (!staffUserId) return redirectTo(request, "invalid");
    const staff = await db.prepare("SELECT user_id userId FROM staff_accounts WHERE owner_user_id=? AND user_id=? AND disabled_at IS NULL").bind(user.id, staffUserId).first<{ userId: string }>();
    if (!staff) return redirectTo(request, "not_found");
  } else if (intent === "create") {
    const staffName = text(form, "staffName");
    const staffEmail = normalizeEmail(text(form, "staffEmail"));
    const staffPhone = text(form, "staffPhone");
    const staffPassword = String(form.get("staffPassword") ?? "");
    if (!staffName || !staffEmail.includes("@") || staffPassword.length < MIN_PASSWORD_LENGTH) return redirectTo(request, "invalid");
    const exists = await db.prepare("SELECT id FROM users WHERE email_normalized=?").bind(staffEmail).first<{ id: string }>();
    if (exists) return redirectTo(request, "exists");
    staffUserId = crypto.randomUUID();
    await db.batch([
      db.prepare("INSERT INTO users(id,email_normalized,password_hash,email_verified_at,role) VALUES (?,?,?,?, 'member')").bind(staffUserId, staffEmail, await hashPassword(staffPassword), null),
      db.prepare("INSERT INTO profiles(user_id,display_name,phone) VALUES (?,?,?)").bind(staffUserId, staffName, staffPhone || null),
      db.prepare("INSERT INTO staff_accounts(user_id,owner_user_id) VALUES (?,?)").bind(staffUserId, user.id),
    ]);
  } else {
    return redirectTo(request, "invalid");
  }
  if (staffUserId === user.id) return redirectTo(request, "owner");

  await db.prepare(`
    INSERT INTO property_staff(property_id,staff_user_id,permission_level,notice_version,notice_accepted_at,created_by_user_id)
    VALUES (?,?,?,?,CURRENT_TIMESTAMP,?)
    ON CONFLICT(property_id,staff_user_id) DO UPDATE SET
      permission_level=excluded.permission_level,
      notice_version=excluded.notice_version,
      notice_accepted_at=CURRENT_TIMESTAMP,
      created_by_user_id=excluded.created_by_user_id,
      updated_at=CURRENT_TIMESTAMP,
      disabled_at=NULL
  `).bind(propertyId, staffUserId, permissionLevel, STAFF_NOTICE_VERSION, user.id).run();

  return redirectTo(request, intent === "create" ? "created" : "added");
}
