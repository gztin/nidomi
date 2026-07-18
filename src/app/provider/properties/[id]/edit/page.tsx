import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PropertyForm, type PropertyFormValues } from "@/components/admin/property-form";
import { MemberNavigation } from "@/components/member/member-navigation";
import { getCurrentUser } from "@/features/auth/session";
import { getDb } from "@/features/auth/db";
import { parseMultilineText } from "@/features/property/form-values";
import { getListingTagsForPropertyForm, getSelectedListingTagIds, type ListingTag } from "@/features/property/listing-tags";
import { canCreateProperty } from "@/features/member/feature-access";

type EditableProperty = PropertyFormValues & { id: string };
type EditableFee = { name: string; amount: number | null };
type EditableEquipment = { name: string; note: string | null };

function parseEquipmentAmount(note: string | null) {
  const value = note?.match(/purchase_amount:(\d+)/)?.[1];
  return value ? Number(value) : undefined;
}

function deriveSelectedTagIds(tags: ListingTag[], equipment: EditableEquipment[], rentalConditionsText?: string) {
  const equipmentNames = new Set(equipment.map((item) => item.name));
  const ruleNames = new Set(parseMultilineText(rentalConditionsText ?? ""));
  return tags.filter((tag) => (tag.category === "item" && equipmentNames.has(tag.name)) || (tag.category === "rule" && ruleNames.has(tag.name))).map((tag) => tag.id);
}

export default async function MemberEditPropertyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; status?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "member") redirect("/admin");
  if (!canCreateProperty({ emailVerified: user.emailVerified, identityVerified: user.identityVerified })) redirect("/account/permissions?required=property");
  const { id } = await params;
  const { error, status } = await searchParams;
  const db = await getDb();
  const property = await db.prepare(`SELECT id,title,summary,description,property_type propertyType,rental_scope rentalScope,monthly_rent monthlyRent,deposit_amount depositAmount,payment_cycle paymentCycle,payment_due_rule paymentDueRule,layout,area_ping areaPing,floor_label floorLabel,total_floors totalFloors,has_elevator hasElevator,public_location publicLocation,private_address privateAddress,available_from availableFrom,minimum_lease_months minimumLeaseMonths,electricity_billing_type electricityBillingType,electricity_calculation_rule electricityRule,electricity_information_method electricityInformationMethod,viewing_requirement viewingRequirement,rental_conditions_text rentalConditionsText,known_conditions_text knownConditionsText,nearby_text nearbyText FROM properties WHERE id=? AND provider_user_id=?`).bind(id,user.id).first<EditableProperty>();
  if (!property) notFound();

  const [feesResult,equipmentResult,listingTags,savedTagIds,imagesResult] = await Promise.all([
    db.prepare("SELECT name,amount FROM property_fees WHERE property_id=? ORDER BY name").bind(id).all(),
    db.prepare("SELECT name,note FROM property_equipment WHERE property_id=? ORDER BY name").bind(id).all(),
    getListingTagsForPropertyForm(db,id),
    getSelectedListingTagIds(db,id),
    db.prepare("SELECT id,byte_size byteSize,is_cover isCover FROM property_images WHERE property_id=? AND deleted_at IS NULL ORDER BY is_cover DESC,sort_order,id").bind(id).all(),
  ]);
  const fees=feesResult.results as unknown as EditableFee[];
  const equipment=equipmentResult.results as unknown as EditableEquipment[];
  const images=(imagesResult.results as unknown as Array<{id:string;byteSize:number;isCover:number}>).map((image)=>({id:image.id,byteSize:image.byteSize,isCover:image.isCover===1,url:`/api/properties/${id}/images/${image.id}`}));
  const selectedListingTagIds=savedTagIds.length?savedTagIds:deriveSelectedTagIds(listingTags,equipment,property.rentalConditionsText);
  const values={...property,fees:fees.map((fee)=>({name:fee.name,billingMode:fee.amount===null?"bill" as const:"fixed" as const,amount:fee.amount??undefined})),equipment:equipment.map((item)=>({name:item.name,amount:parseEquipmentAmount(item.note)})),selectedListingTagIds};

  return <main className="workflow-page"><div className="workflow-shell workflow-shell-wide">
    <Link className="policy-back" href="/provider/properties">← 返回我的房源</Link><p className="eyebrow">房源管理</p><h1>編輯：{property.title}</h1>
    <MemberNavigation current="/provider/properties" />
    {status === "saved" && <div className="status-card status-approved"><strong>房源資料已儲存</strong><p>修改公開內容後，房源資料標章需要重新送審。</p></div>}
    {error && <div className="status-card status-rejected"><strong>無法完成操作</strong><p>{error === "deposit" ? "押金不得超過兩個月租金。" : error === "image" ? "送出審核前至少需要上傳一張房源照片。" : "請確認所有必填欄位與數值格式。"}</p></div>}
    <PropertyForm action={`/api/provider/properties/${id}`} mode="edit" submitLabel="儲存房源資料" values={values} listingTags={listingTags} propertyId={id} images={images}/>
  </div></main>;
}
