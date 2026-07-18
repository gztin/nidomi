import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/session";
import { getDb } from "@/features/auth/db";
import { composeFloorLabel, composeLayout } from "@/features/property/form-values";
import type { ListingTag } from "@/features/property/listing-tags";

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function parseFees(form: FormData) {
  const names = form.getAll("feeName").map((value) => String(value).trim());
  const modes = form.getAll("feeBillingMode").map((value) => String(value));
  const amounts = form.getAll("feeAmount").map((value) => String(value).trim());
  return names.map((name, index) => {
    const billingMode = modes[index] === "fixed" ? "fixed" : "bill";
    const amount = billingMode === "fixed" ? Number(amounts[index] ?? "") : null;
    return {
      id: crypto.randomUUID(),
      feeType: `custom_${index + 1}`,
      name,
      amount,
      calculationRule: billingMode === "bill" ? "依帳單繳費" : null,
      billingCycle: billingMode === "bill" ? "billing_period" : "monthly",
    };
  }).filter((fee) => fee.name);
}

function parseEquipment(form: FormData) {
  const names = form.getAll("equipmentName").map((value) => String(value).trim());
  const amounts = form.getAll("equipmentAmount").map((value) => String(value).trim());
  return names.map((name, index) => {
    const amountText = amounts[index] ?? "";
    const amount = amountText ? Number(amountText) : null;
    return { id: crypto.randomUUID(), equipmentType: `item_${index + 1}`, name, amount };
  }).filter((item) => item.name);
}

function parseRentalConditions(form: FormData) {
  const conditions = form.getAll("rentalCondition").map((value) => String(value).trim()).filter(Boolean);
  return conditions.length ? conditions.join("\n") : text(form, "rentalConditionsText");
}

function parseListingTagIds(form: FormData) {
  return Array.from(new Set(form.getAll("listingTagId").map((value) => String(value).trim()).filter(Boolean)));
}

async function getSelectedListingTags(db: D1Database, ids: string[]) {
  if (!ids.length) return [];
  try {
    const placeholders = ids.map(() => "?").join(",");
    const result = await db.prepare(`
      SELECT id,category,name,slug,sort_order sortOrder,disabled_at disabledAt
      FROM listing_tags
      WHERE id IN (${placeholders}) AND disabled_at IS NULL
    `).bind(...ids).all();
    return result.results as unknown as ListingTag[];
  } catch {
    return [];
  }
}

async function hasListingTagTables(db: D1Database) {
  try {
    await db.prepare("SELECT 1 FROM property_listing_tags LIMIT 1").first();
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/provider/properties/new", request.url), 303);
  if (user.role !== "member") return NextResponse.redirect(new URL("/admin", request.url), 303);
  if (!user.emailVerified || !user.identityVerified) return NextResponse.redirect(new URL("/account/permissions?required=property", request.url), 303);

  const form = await request.formData();
  const db = await getDb();
  const bedroomsText = text(form, "bedrooms");
  const livingRoomsText = text(form, "livingRooms");
  const bathroomsText = text(form, "bathrooms");
  const floorNumberText = text(form, "floorNumber");
  const bedrooms = Number(bedroomsText);
  const livingRooms = Number(livingRoomsText);
  const bathrooms = Number(bathroomsText);
  const floorNumber = Number(floorNumberText);
  const selectedListingTagIds = parseListingTagIds(form);
  const selectedListingTags = await getSelectedListingTags(db, selectedListingTagIds);
  const canSyncListingTags = await hasListingTagTables(db);
  const selectedItemTags = selectedListingTags.filter((tag) => tag.category === "item");
  const selectedRuleTags = selectedListingTags.filter((tag) => tag.category === "rule");
  const equipment = selectedItemTags.length
    ? selectedItemTags.map((tag, index) => ({ id: crypto.randomUUID(), equipmentType: tag.slug || `item_${index + 1}`, name: tag.name, amount: null }))
    : parseEquipment(form);
  const fees = parseFees(form);

  const values = {
    title: text(form, "title"),
    summary: text(form, "summary"),
    description: text(form, "description"),
    propertyType: text(form, "propertyType"),
    rentalScope: text(form, "rentalScope"),
    monthlyRent: Number(text(form, "monthlyRent")),
    depositAmount: Number(text(form, "depositAmount")),
    paymentCycle: text(form, "paymentCycle"),
    paymentDueRule: text(form, "paymentDueRule"),
    layout: composeLayout(bedrooms, livingRooms, bathrooms),
    areaPing: Number(text(form, "areaPing")),
    floorLabel: composeFloorLabel(floorNumber),
    totalFloors: Number(text(form, "totalFloors")),
    hasElevator: form.get("hasElevator") === "on" ? 1 : 0,
    publicLocation: text(form, "publicLocation"),
    privateAddress: text(form, "privateAddress"),
    availableFrom: text(form, "availableFrom"),
    minimumLeaseMonths: Number(text(form, "minimumLeaseMonths")),
    electricityBillingType: text(form, "electricityBillingType"),
    electricityRule: text(form, "electricityRule"),
    electricityInformationMethod: text(form, "electricityInformationMethod"),
    viewingRequirement: text(form, "viewingRequirement"),
    rentalConditionsText: selectedRuleTags.length ? selectedRuleTags.map((tag) => tag.name).join("\n") : parseRentalConditions(form),
    knownConditionsText: text(form, "knownConditionsText"),
    nearbyText: text(form, "nearbyText"),
  };

  const required = [values.title, values.summary, values.description, values.propertyType, values.rentalScope, values.paymentCycle, values.paymentDueRule, bedroomsText, livingRoomsText, bathroomsText, floorNumberText, values.publicLocation, values.privateAddress, values.availableFrom, values.electricityBillingType, values.electricityRule, values.electricityInformationMethod];
  if (required.some((value) => !value) || bedrooms < 0 || livingRooms < 0 || bathrooms < 0 || floorNumber <= 0 || floorNumber > values.totalFloors || values.monthlyRent <= 0 || values.depositAmount < 0 || values.areaPing <= 0 || values.totalFloors <= 0 || values.minimumLeaseMonths <= 0 || !["metered", "non_metered", "included"].includes(values.electricityBillingType) || !["email_verified", "identity_verified"].includes(values.viewingRequirement)) return NextResponse.redirect(new URL("/provider/properties/new?error=invalid", request.url), 303);
  if (values.depositAmount > values.monthlyRent * 2) return NextResponse.redirect(new URL("/provider/properties/new?error=deposit", request.url), 303);

  const id = crypto.randomUUID();
  const slug = `property-${id.slice(0, 8)}`;
  if (fees.some((fee) => fee.amount !== null && fee.amount <= 0)) return NextResponse.redirect(new URL("/provider/properties/new?error=invalid", request.url), 303);
  if (equipment.some((item) => item.amount !== null && item.amount <= 0)) return NextResponse.redirect(new URL("/provider/properties/new?error=invalid", request.url), 303);

  const snapshot = { ...values, id, slug, status: "draft", equipment, fees };
  const statements = [
    db.prepare(`INSERT INTO properties(id,provider_user_id,slug,status,title,summary,description,property_type,rental_scope,monthly_rent,deposit_amount,payment_cycle,payment_due_rule,layout,area_ping,floor_label,total_floors,has_elevator,public_location,private_address,available_from,minimum_lease_months,electricity_billing_type,electricity_calculation_rule,electricity_information_method,listing_rules_version,viewing_requirement,rental_conditions_text,known_conditions_text,nearby_text) VALUES (?,?,?,'draft',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'PROPERTY-2026-07-1',?,?,?,?)`).bind(id, user.id, slug, values.title, values.summary, values.description, values.propertyType, values.rentalScope, values.monthlyRent, values.depositAmount, values.paymentCycle, values.paymentDueRule, values.layout, values.areaPing, values.floorLabel, values.totalFloors, values.hasElevator, values.publicLocation, values.privateAddress, values.availableFrom, values.minimumLeaseMonths, values.electricityBillingType, values.electricityRule, values.electricityInformationMethod, values.viewingRequirement, values.rentalConditionsText, values.knownConditionsText, values.nearbyText),
    ...(canSyncListingTags ? selectedListingTags.map((tag) => db.prepare("INSERT INTO property_listing_tags(property_id,tag_id) VALUES (?,?)").bind(id, tag.id)) : []),
    ...fees.map((fee) => db.prepare("INSERT INTO property_fees(id,property_id,fee_type,name,amount,calculation_rule,billing_cycle,paid_by) VALUES (?,?,?,?,?,?,?, 'tenant')").bind(fee.id, id, fee.feeType, fee.name, fee.amount, fee.calculationRule, fee.billingCycle)),
    ...equipment.map((item) => db.prepare("INSERT INTO property_equipment(id,property_id,equipment_type,name,quantity,condition,usage_scope,note) VALUES (?,?,?,?,1,'可使用','private',?)").bind(item.id, id, item.equipmentType, item.name, item.amount === null ? null : `purchase_amount:${item.amount}`)),
    db.prepare("INSERT INTO property_versions(id,property_id,version_number,snapshot_json,changed_by_user_id,change_reason) VALUES (?,?,1,?,?, 'member_created_draft')").bind(crypto.randomUUID(), id, JSON.stringify(snapshot), user.id),
  ];

  await db.batch(statements);
  return NextResponse.redirect(new URL(`/provider/properties?status=created`, request.url), 303);
}
