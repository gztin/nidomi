export type ListingTagCategory = "rule" | "item" | "service";

export type ListingTag = {
  id: string;
  category: ListingTagCategory;
  name: string;
  slug: string;
  sortOrder: number;
  disabledAt: string | null;
};

const categoryLabels: Record<ListingTagCategory, string> = {
  rule: "租屋條件",
  item: "租屋設備",
  service: "服務項目",
};

export function listingTagCategoryLabel(category: string) {
  return categoryLabels[category as ListingTagCategory] ?? category;
}

export function isListingTagCategory(category: string): category is ListingTagCategory {
  return category === "rule" || category === "item" || category === "service";
}

export function normalizeTagSlug(category: ListingTagCategory, name: string) {
  const ascii = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const readable = name.trim().replace(/\s+/g, "-");
  return ascii ? `${category}-${ascii}` : `${category}-${readable}`;
}

export async function getActiveListingTags(db: D1Database) {
  try {
    const result = await db.prepare(`
      SELECT id,category,name,slug,sort_order sortOrder,disabled_at disabledAt
      FROM listing_tags
      WHERE disabled_at IS NULL
      ORDER BY category,sort_order,name
    `).all();
    return result.results as unknown as ListingTag[];
  } catch {
    return [];
  }
}

export async function getManageableListingTags(db: D1Database) {
  try {
    const result = await db.prepare(`
      SELECT id,category,name,slug,sort_order sortOrder,disabled_at disabledAt
      FROM listing_tags
      ORDER BY category,disabled_at IS NOT NULL,sort_order,name
    `).all();
    return result.results as unknown as ListingTag[];
  } catch {
    return [];
  }
}

export async function getSelectedListingTagIds(db: D1Database, propertyId: string) {
  try {
    const result = await db.prepare("SELECT tag_id tagId FROM property_listing_tags WHERE property_id=?").bind(propertyId).all();
    return (result.results as unknown as { tagId: string }[]).map((row) => row.tagId);
  } catch {
    return [];
  }
}

export async function getListingTagsForPropertyForm(db: D1Database, propertyId?: string) {
  if (!propertyId) return getActiveListingTags(db);
  try {
    const result = await db.prepare(`
      SELECT DISTINCT t.id,t.category,t.name,t.slug,t.sort_order sortOrder,t.disabled_at disabledAt
      FROM listing_tags t
      LEFT JOIN property_listing_tags pt ON pt.tag_id=t.id AND pt.property_id=?
      WHERE t.disabled_at IS NULL
      ORDER BY t.category,t.disabled_at IS NOT NULL,t.sort_order,t.name
    `).bind(propertyId).all();
    return result.results as unknown as ListingTag[];
  } catch {
    return [];
  }
}
