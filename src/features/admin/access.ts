import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/features/auth/session";

export async function requireManager(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}

