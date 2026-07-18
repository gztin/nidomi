import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { SuccessDialog } from "@/components/admin/success-dialog";
import { requireManager } from "@/features/admin/access";
import { getDb } from "@/features/auth/db";
import { parseMultilineText } from "@/features/property/form-values";
import { listingTagCategoryLabel } from "@/features/property/listing-tags";
import type { ListingTagCategory } from "@/features/property/listing-tags";
import type { ViewingRequirement } from "@/features/property/types";
import { viewingRequirementCopy } from "@/features/viewing/requirement";

type PropertyDetail = {
  id: string;
  title: string;
  status: string;
  summary: string;
  description: string;
  propertyType: string;
  rentalScope: string;
  monthlyRent: number;
  depositAmount: number;
  layout: string;
  areaPing: number;
  floorLabel: string;
  totalFloors: number;
  hasElevator: number;
  publicLocation: string;
  privateAddress: string;
  availableFrom: string;
  minimumLeaseMonths: number;
  electricityRule: string;
  viewingRequirement: string;
  rentalConditionsText: string;
  knownConditionsText: string;
  nearbyText: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  ownerRole: string;
  ownerName: string;
  ownerEmail: string;
  listingReviewStatus: string;
  rightsStatus: string;
};

type Equipment = { name: string; quantity: number; condition: string; scope: string; note: string | null };
type Slot = { id: string; startAt: string; endAt: string; status: string };
type RequestRow = { code: string; status: string; requester: string; startAt: string; party: number };
type PropertyTag = { category: ListingTagCategory; name: string; sortOrder: number };

const propertyStatusLabels: Record<string, string> = {
  draft: "草稿",
  published: "已刊登",
  unpublished: "已下架",
};
const verificationStatusLabels: Record<string, string> = { not_submitted: "尚未送審", pending: "審核中", approved: "已通過", rejected: "需修正" };

const viewingSlotStatusLabels: Record<string, string> = {
  available: "可預約",
  held: "保留中",
  confirmed: "已確認",
  closed: "已關閉",
};

const viewingRequestStatusLabels: Record<string, string> = {
  pending: "待確認",
  confirmed: "已確認",
  cancelled: "已取消",
  completed: "已完成",
};

const propertySuccessMessages: Record<string, { title: string; body: string }> = {
  created: { title: "建立成功", body: "房源草稿已建立完成。" },
  saved: { title: "儲存成功", body: "房源資料已更新完成。" },
};

function propertyStatusLabel(status: string) {
  return propertyStatusLabels[status] ?? status;
}

function viewingSlotStatusLabel(status: string) {
  return viewingSlotStatusLabels[status] ?? status;
}

function viewingRequestStatusLabel(status: string) {
  return viewingRequestStatusLabels[status] ?? status;
}

function viewingRequirementLabel(requirement: string) {
  return viewingRequirementCopy[requirement as ViewingRequirement]?.label ?? requirement;
}

function equipmentAmount(note: string | null) {
  const value = note?.match(/purchase_amount:(\d+)/)?.[1];
  return value ? `NT$ ${Number(value).toLocaleString()}` : "未填金額";
}

async function getPropertyTags(db: Awaited<ReturnType<typeof getDb>>, propertyId: string) {
  try {
    const result = await db.prepare(`
      SELECT t.category,t.name,t.sort_order sortOrder
      FROM property_listing_tags pt
      JOIN listing_tags t ON t.id=pt.tag_id
      WHERE pt.property_id=? AND t.disabled_at IS NULL
      ORDER BY t.category,t.sort_order,t.name
    `).bind(propertyId).all();
    return result.results as unknown as PropertyTag[];
  } catch {
    return [];
  }
}

function TagGroup({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="property-chip-group">
      <h3>{title}</h3>
      <div className="property-chip-list">
        {items.map((item) => <span className="property-chip" key={item}>{item}</span>)}
      </div>
    </div>
  );
}

export default async function AdminPropertyDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const manager = await requireManager();
  const { id } = await params;
  const { status } = await searchParams;
  const db = await getDb();
  const property = await db.prepare(`
    SELECT
      x.id,
      x.title,
      x.status,
      x.summary,
      x.description,
      x.property_type propertyType,
      x.rental_scope rentalScope,
      x.monthly_rent monthlyRent,
      x.deposit_amount depositAmount,
      x.layout,
      x.area_ping areaPing,
      x.floor_label floorLabel,
      x.total_floors totalFloors,
      x.has_elevator hasElevator,
      x.public_location publicLocation,
      x.private_address privateAddress,
      x.available_from availableFrom,
      x.minimum_lease_months minimumLeaseMonths,
      x.electricity_calculation_rule electricityRule,
      x.viewing_requirement viewingRequirement,
      x.rental_conditions_text rentalConditionsText,
      x.known_conditions_text knownConditionsText,
      x.nearby_text nearbyText,
      x.created_at createdAt,
      x.updated_at updatedAt,
      x.listing_review_status listingReviewStatus,
      x.rights_verification_status rightsStatus,
      u.id ownerId,
      u.role ownerRole,
      p.display_name ownerName,
      u.email_normalized ownerEmail
    FROM properties x
    JOIN users u ON u.id=x.provider_user_id
    JOIN profiles p ON p.user_id=u.id
    WHERE x.id=?
  `).bind(id).first<PropertyDetail>();
  if (!property) notFound();

  const [equipmentResult, slotsResult, requestsResult, propertyTags] = await Promise.all([
    db.prepare("SELECT name,quantity,condition,usage_scope scope,note FROM property_equipment WHERE property_id=? ORDER BY name").bind(id).all(),
    db.prepare("SELECT id,start_at startAt,end_at endAt,status FROM viewing_slots WHERE property_id=? ORDER BY start_at").bind(id).all(),
    db.prepare("SELECT r.reference_code code,r.status,p.display_name requester,s.start_at startAt,r.party_size party FROM viewing_requests r JOIN profiles p ON p.user_id=r.requester_user_id JOIN viewing_slots s ON s.id=r.viewing_slot_id WHERE r.property_id=? ORDER BY r.created_at DESC").bind(id).all(),
    getPropertyTags(db, id),
  ]);
  const equipment = equipmentResult.results as unknown as Equipment[];
  const slots = slotsResult.results as unknown as Slot[];
  const requests = requestsResult.results as unknown as RequestRow[];

  await db.prepare("INSERT INTO admin_audit_logs(id,admin_user_id,action,entity_type,entity_id,reason) VALUES (?,?,'view_property_detail','property',?,'property_management')").bind(crypto.randomUUID(), manager.id, id).run();

  const floorText = property.floorLabel.includes("共") ? property.floorLabel : `${property.floorLabel}／共 ${property.totalFloors} 樓`;
  const successMessage = status ? propertySuccessMessages[status] : null;
  const rentalConditions = parseMultilineText(property.rentalConditionsText);
  const knownConditions = parseMultilineText(property.knownConditionsText);
  const nearby = parseMultilineText(property.nearbyText);
  const tagsByCategory = {
    item: propertyTags.filter((tag: PropertyTag) => tag.category === "item").map((tag: PropertyTag) => tag.name),
    rule: propertyTags.filter((tag: PropertyTag) => tag.category === "rule").map((tag: PropertyTag) => tag.name),
    service: propertyTags.filter((tag: PropertyTag) => tag.category === "service").map((tag: PropertyTag) => tag.name),
  };
  const equipmentChips = tagsByCategory.item;

  return (
    <AdminShell name={manager.displayName} title={property.title} eyebrow="房源詳情">
      {successMessage && <SuccessDialog title={successMessage.title} body={successMessage.body}/>}
      <div className="admin-toolbar">
        <Link href="/admin/properties">← 返回房源列表</Link>
      </div>

      <div className="admin-detail-grid">
        <section className="admin-panel admin-panel-wide">
          <h2>房源驗證與標章</h2>
          <dl className="fee-list">
            <div><dt>房源資料審核</dt><dd>{verificationStatusLabels[property.listingReviewStatus] ?? property.listingReviewStatus}</dd></div>
            <div><dt>出租權利驗證</dt><dd>{verificationStatusLabels[property.rightsStatus] ?? property.rightsStatus}</dd></div>
          </dl>
          <div className="admin-actions">
            {property.listingReviewStatus === "pending" && <>
              <form action={`/api/admin/properties/${property.id}/verification`} method="post"><input type="hidden" name="verificationType" value="listing"/><button className="button button-primary" name="decision" value="approved">通過房源資料</button></form>
              <form action={`/api/admin/properties/${property.id}/verification`} method="post"><input type="hidden" name="verificationType" value="listing"/><button className="button button-danger" name="decision" value="rejected">退回房源資料</button></form>
            </>}
            {property.rightsStatus !== "approved" ? <form action={`/api/admin/properties/${property.id}/verification`} method="post"><input type="hidden" name="verificationType" value="rights"/><button className="button button-secondary" name="decision" value="approved">核發出租權利標章</button></form> : <form action={`/api/admin/properties/${property.id}/verification`} method="post"><input type="hidden" name="verificationType" value="rights"/><button className="button button-danger" name="decision" value="rejected">撤銷出租權利標章</button></form>}
          </div>
          <p className="form-note">出租權利標章僅能在確認所有權或合法出租授權資料後核發；所有操作都會留下稽核紀錄。</p>
        </section>
        <section className="admin-panel">
          <h2>房源資料</h2>
          <dl className="fee-list">
            <div><dt>狀態</dt><dd>{propertyStatusLabel(property.status)}</dd></div>
            <div>
              <dt>持有者</dt>
              <dd>
                {property.ownerRole === "member" ? <Link href={`/admin/members/${property.ownerId}`}>{property.ownerName}</Link> : <strong>{property.ownerName}</strong>}
                <small>{property.ownerEmail}</small>
              </dd>
            </div>
            <div><dt>租金／押金</dt><dd>NT$ {property.monthlyRent.toLocaleString()}／NT$ {property.depositAmount.toLocaleString()}</dd></div>
            <div><dt>房型／坪數</dt><dd>{property.layout}・{property.areaPing} 坪</dd></div>
            <div><dt>樓層</dt><dd>{floorText}・{property.hasElevator ? "有電梯" : "無電梯"}</dd></div>
            <div><dt>租賃範圍</dt><dd>{property.rentalScope}</dd></div>
            <div><dt>最短租期</dt><dd>{property.minimumLeaseMonths} 個月</dd></div>
          </dl>
        </section>

        <section className="admin-panel">
          <h2>位置與刊登</h2>
          <dl className="fee-list">
            <div><dt>公開地區</dt><dd>{property.publicLocation}</dd></div>
            <div><dt>完整地址</dt><dd>{property.privateAddress}</dd></div>
            <div><dt>可入住日</dt><dd>{property.availableFrom}</dd></div>
            <div><dt>預約門檻</dt><dd>{viewingRequirementLabel(property.viewingRequirement)}</dd></div>
            <div><dt>建立時間</dt><dd>{new Date(property.createdAt).toLocaleString("zh-TW")}</dd></div>
            <div><dt>更新時間</dt><dd>{new Date(property.updatedAt).toLocaleString("zh-TW")}</dd></div>
          </dl>
        </section>
      </div>

      <section className="admin-panel">
        <h2>房源說明</h2>
        <p><strong>{property.summary}</strong></p>
        <p>{property.description}</p>
        <p>電費：{property.electricityRule}</p>
      </section>

      <section className="admin-panel">
        <h2>設備、費用與服務</h2>
        {equipmentChips.length || tagsByCategory.service.length ? (
          <div className="property-chip-groups">
            <TagGroup title={listingTagCategoryLabel("item")} items={equipmentChips}/>
            <TagGroup title={listingTagCategoryLabel("service")} items={tagsByCategory.service}/>
          </div>
        ) : <p>尚未設定設備或服務標籤。</p>}
      </section>

      <section className="admin-panel">
        <h2>資產清單</h2>
        {equipment.length ? equipment.map((item, index) => (
          <div className="admin-list-row" key={`${item.name}-${index}`}>
            <strong>{item.name} × {item.quantity}</strong>
            <span>{equipmentAmount(item.note)}・{item.condition}</span>
          </div>
        )) : <p>尚未建立資產清單。</p>}
      </section>

      <div className="admin-detail-grid">
        <section className="admin-panel">
          <h2>租屋條件</h2>
          {rentalConditions.length ? rentalConditions.map((item) => <div className="admin-list-row" key={item}><strong>{item}</strong></div>) : <p>未設定租屋條件。</p>}
        </section>
        <section className="admin-panel">
          <h2>周邊資訊</h2>
          {nearby.length ? nearby.map((item) => <div className="admin-list-row" key={item}><strong>{item}</strong></div>) : <p>未設定周邊資訊。</p>}
        </section>
      </div>

      <section className="admin-panel">
        <h2>注意事項</h2>
        {knownConditions.length ? knownConditions.map((item) => <div className="admin-list-row" key={item}><strong>{item}</strong></div>) : <p>未設定注意事項。</p>}
      </section>

      <section className="admin-panel">
        <h2>可預約時段</h2>
        {slots.length ? slots.map((slot) => (
          <div className="admin-list-row" key={slot.id}>
            <strong>{new Date(slot.startAt).toLocaleString("zh-TW")}－{new Date(slot.endAt).toLocaleTimeString("zh-TW")}</strong>
            <span>{viewingSlotStatusLabel(slot.status)}</span>
          </div>
        )) : <p>尚未設定可預約時段。</p>}
      </section>

      <section className="admin-panel">
        <h2>預約紀錄</h2>
        {requests.length ? requests.map((request) => (
          <div className="admin-list-row" key={request.code}>
            <div>
              <strong>{request.code}・{request.requester}</strong>
              <small>{new Date(request.startAt).toLocaleString("zh-TW")}・{request.party} 人</small>
            </div>
            <span>{viewingRequestStatusLabel(request.status)}</span>
          </div>
        )) : <p>此房源尚無預約。</p>}
      </section>
    </AdminShell>
  );
}
