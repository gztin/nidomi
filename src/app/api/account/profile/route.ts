import { NextResponse } from "next/server";
import { getDb } from "@/features/auth/db";
import { getCurrentUser } from "@/features/auth/session";

function redirectTo(request: Request, query: string) {
  return NextResponse.redirect(new URL(`/account?${query}`, request.url), 303);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/account", request.url), 303);
  if (user.role !== "member") return NextResponse.redirect(new URL("/admin/account", request.url), 303);

  const form = await request.formData();
  const displayName = String(form.get("displayName") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  if (!displayName || displayName.length > 80 || phone.length > 30) return redirectTo(request, "error=invalid");

  await (await getDb()).prepare("UPDATE profiles SET display_name=?,phone=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(displayName, phone || null, user.id).run();
  return redirectTo(request, "status=saved");
}
