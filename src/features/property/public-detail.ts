import { demoProperty } from "@/data/demo-property";
import { getDb } from "@/features/auth/db";
import { parseMultilineText } from "@/features/property/form-values";
import { deriveMemberBadgeLevel } from "@/features/member/verification";
import type { PropertyDetail, ViewingRequirement, ViewingSlotStatus } from "@/features/property/types";

type PublicPropertyRow = {
  id: string;
  title: string;
  publicLocation: string;
  monthlyRent: number;
  depositAmount: number;
  propertyType: string;
  layout: string;
  areaPing: number;
  floorLabel: string;
  totalFloors: number;
  availableFrom: string;
  minimumLeaseMonths: number;
  viewingRequirement: ViewingRequirement;
  providerName: string;
  emailVerifiedAt: string | null;
  identityVerifiedAt: string | null;
  summary: string;
  rentalConditionsText: string;
  knownConditionsText: string;
  nearbyText: string;
  listingReviewStatus: string;
  rightsStatus: string;
};

type FeeRow = { name: string; amount: number | null; rule: string | null; cycle: string };
type EquipmentRow = { name: string; quantity: number };
type ServiceRow = { name: string; sortOrder: number };
type SlotRow = { id: string; startAt: string; endAt: string; status: ViewingSlotStatus };
type ImageRow = { id: string; alt: string; sortOrder: number };

const feeCycleLabels: Record<string, string> = {
  monthly: "每月",
  billing_period: "每期帳單",
  other: "依房源說明",
};

function feeCycleLabel(cycle: string) {
  return feeCycleLabels[cycle] ?? cycle;
}

async function getPropertyServices(db: D1Database, propertyId: string) {
  try {
    const result = await db.prepare(`
      SELECT t.name,t.sort_order sortOrder
      FROM property_listing_tags pt
      JOIN listing_tags t ON t.id=pt.tag_id
      WHERE pt.property_id=? AND t.category='service' AND t.disabled_at IS NULL
      ORDER BY t.sort_order,t.name
    `).bind(propertyId).all();
    return result.results as unknown as ServiceRow[];
  } catch {
    return [];
  }
}

export async function getHomepageProperty(): Promise<PropertyDetail> {
  try {
    const db = await getDb();
    const property = await db.prepare(`
      SELECT
        x.id,
        x.title,
        x.public_location publicLocation,
        x.monthly_rent monthlyRent,
        x.deposit_amount depositAmount,
        x.property_type propertyType,
        x.layout,
        x.area_ping areaPing,
        x.floor_label floorLabel,
        x.total_floors totalFloors,
        x.available_from availableFrom,
        x.minimum_lease_months minimumLeaseMonths,
        x.viewing_requirement viewingRequirement,
        p.display_name providerName,
        u.email_verified_at emailVerifiedAt,
        u.identity_verified_at identityVerifiedAt,
        x.summary,
        x.rental_conditions_text rentalConditionsText,
        x.known_conditions_text knownConditionsText,
        x.nearby_text nearbyText,
        x.listing_review_status listingReviewStatus,
        x.rights_verification_status rightsStatus
      FROM properties x
      JOIN users u ON u.id=x.provider_user_id
      JOIN profiles p ON p.user_id=u.id
      WHERE x.status='published'
      ORDER BY CASE WHEN x.id='property-demo-001' THEN 0 ELSE 1 END, x.published_at DESC, x.created_at DESC
      LIMIT 1
    `).first<PublicPropertyRow>();

    if (!property) return demoProperty;

    const [feesResult, equipmentResult, services, slotsResult, imagesResult] = await Promise.all([
      db.prepare("SELECT name,amount,calculation_rule rule,billing_cycle cycle FROM property_fees WHERE property_id=? ORDER BY name").bind(property.id).all(),
      db.prepare("SELECT name,quantity FROM property_equipment WHERE property_id=? ORDER BY name").bind(property.id).all(),
      getPropertyServices(db, property.id),
      db.prepare("SELECT id,start_at startAt,end_at endAt,status FROM viewing_slots WHERE property_id=? ORDER BY start_at").bind(property.id).all(),
      db.prepare("SELECT id,alt_text alt,sort_order sortOrder FROM property_images WHERE property_id=? AND deleted_at IS NULL ORDER BY is_cover DESC,sort_order,id").bind(property.id).all(),
    ]);

    const fees = feesResult.results as unknown as FeeRow[];
    const equipment = equipmentResult.results as unknown as EquipmentRow[];
    const slots = slotsResult.results as unknown as SlotRow[];
    const images = imagesResult.results as unknown as ImageRow[];
    const floorLabel = property.floorLabel.includes("共") ? property.floorLabel : `${property.floorLabel}／共 ${property.totalFloors} 樓`;

    return {
      ...demoProperty,
      id: property.id,
      title: property.title,
      publicLocation: property.publicLocation,
      monthlyRent: property.monthlyRent,
      depositAmount: property.depositAmount,
      propertyType: property.propertyType,
      layout: property.layout,
      areaPing: property.areaPing,
      floorLabel,
      availableFrom: property.availableFrom,
      minimumLeaseMonths: property.minimumLeaseMonths,
      viewingRequirement: property.viewingRequirement,
      provider: {
        displayName: property.providerName,
        memberBadge: deriveMemberBadgeLevel({
          emailVerified: Boolean(property.emailVerifiedAt),
          identityStatus: property.identityVerifiedAt ? "approved" : "not_submitted",
          professionalCredentialStatus: "not_submitted",
        }),
      },
      verification: {
        identityVerified: Boolean(property.identityVerifiedAt),
        listingReviewed: property.listingReviewStatus === "approved",
        rentalRightsVerified: property.rightsStatus === "approved",
      },
      summary: property.summary,
      fees: fees.map((fee) => ({
        name: fee.name,
        value: fee.amount !== null ? `${feeCycleLabel(fee.cycle)} NT$ ${fee.amount.toLocaleString()}` : fee.rule ?? "",
        note: fee.amount !== null ? "由承租人負擔" : feeCycleLabel(fee.cycle),
      })),
      equipment: equipment.map((item) => item.quantity > 1 ? `${item.name} ${item.quantity} 個` : item.name),
      conditions: parseMultilineText(property.rentalConditionsText),
      services: services.map((service: ServiceRow) => service.name),
      knownConditions: parseMultilineText(property.knownConditionsText),
      nearby: parseMultilineText(property.nearbyText),
      viewingSlots: slots,
      images: images.length ? images.map((image) => ({ src: `/api/properties/${property.id}/images/${image.id}`, alt: image.alt })) : demoProperty.images,
    };
  } catch {
    return demoProperty;
  }
}
