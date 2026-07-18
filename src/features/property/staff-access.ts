import { getDb } from "@/features/auth/db";

export const STAFF_NOTICE_VERSION = "STAFF-DELEGATION-2026-07-1";

export async function canManagePropertyBookings(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: string,
  propertyId: string,
) {
  const row = await db.prepare(`
    SELECT x.id
    FROM properties x
    WHERE x.id=?
      AND (
        x.provider_user_id=?
        OR EXISTS (
          SELECT 1
          FROM property_staff ps
          WHERE ps.property_id=x.id
            AND ps.staff_user_id=?
            AND ps.disabled_at IS NULL
            AND ps.permission_level IN ('booking','manage')
        )
      )
  `).bind(propertyId, userId, userId).first<{ id: string }>();
  return Boolean(row);
}

export async function isPropertyOwner(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: string,
  propertyId: string,
) {
  const row = await db.prepare("SELECT id FROM properties WHERE id=? AND provider_user_id=?").bind(propertyId, userId).first<{ id: string }>();
  return Boolean(row);
}
