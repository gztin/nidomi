import Link from "next/link";
import { redirect } from "next/navigation";
import { PropertyForm } from "@/components/admin/property-form";
import { MemberNavigation } from "@/components/member/member-navigation";
import { getCurrentUser } from "@/features/auth/session";
import { getDb } from "@/features/auth/db";
import { getActiveListingTags } from "@/features/property/listing-tags";
import { canCreateProperty } from "@/features/member/feature-access";

export default async function NewMemberPropertyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/provider/properties/new");
  if (user.role !== "member") redirect("/admin");
  if (!canCreateProperty({ emailVerified: user.emailVerified, identityVerified: user.identityVerified })) redirect("/account/permissions?required=property");
  const { error } = await searchParams;
  const listingTags = await getActiveListingTags(await getDb());

  return <main className="workflow-page"><div className="workflow-shell workflow-shell-wide">
    <Link className="policy-back" href="/provider/properties">← 返回我的房源</Link>
    <p className="eyebrow">房源管理</p><h1>新增房源</h1>
    <p className="workflow-lead">持有者固定為目前登入會員。建立後會先保存為草稿，不會直接公開。</p>
    <MemberNavigation current="/provider/properties" />
    {error && <div className="status-card status-rejected"><strong>無法建立房源</strong><p>{error === "deposit" ? "押金不得超過兩個月租金。" : "請確認所有必填欄位與數值格式。"}</p></div>}
    <PropertyForm action="/api/provider/properties" mode="create" submitLabel="建立房源草稿" listingTags={listingTags}/>
  </div></main>;
}
