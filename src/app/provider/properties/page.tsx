import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberNavigation } from "@/components/member/member-navigation";
import { getCurrentUser } from "@/features/auth/session";
import { getDb } from "@/features/auth/db";
import { canCreateProperty } from "@/features/member/feature-access";

type PropertyRow = {
  id: string;
  title: string;
  status: string;
  listingReviewStatus: string;
  rightsStatus: string;
  updatedAt: string;
};

const statusCopy: Record<string, string> = { draft: "草稿", published: "已刊登", unpublished: "已下架" };
const reviewCopy: Record<string, string> = { not_submitted: "尚未送審", pending: "審核中", approved: "已通過", rejected: "需修正" };

export default async function MemberPropertiesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/provider/properties");
  if (user.role !== "member") redirect("/admin");
  const { status } = await searchParams;
  const rows = (await (await getDb()).prepare(`SELECT id,title,status,listing_review_status listingReviewStatus,rights_verification_status rightsStatus,updated_at updatedAt FROM properties WHERE provider_user_id=? ORDER BY updated_at DESC`).bind(user.id).all()).results as unknown as PropertyRow[];
  const canCreate = canCreateProperty({ emailVerified: user.emailVerified, identityVerified: user.identityVerified });

  return <main className="workflow-page"><div className="workflow-shell">
    <Link className="policy-back" href="/">← 返回首頁</Link><p className="eyebrow">會員中心</p><h1>我的房源</h1>
    <MemberNavigation current="/provider/properties" />
    {status === "created" && <div className="status-card status-approved"><strong>房源草稿已建立</strong><p>你可以繼續編輯資料及上傳照片。</p></div>}
    {status === "submitted" && <div className="status-card status-pending"><strong>房源已送出審核</strong><p>管理員完成資料檢查後，會更新房源狀態與標章。</p></div>}
    <div className="member-property-toolbar">
      <p>{canCreate ? "身分驗證已通過，可新增與管理自己的房源。" : "完成身分驗證後才能新增房源。"}</p>
      <Link className={`button ${canCreate ? "button-primary" : "button-secondary"}`} href={canCreate ? "/provider/properties/new" : "/account/permissions"}>{canCreate ? "新增房源" : "查看權限說明"}</Link>
    </div>
    {rows.length ? <div className="member-property-list">{rows.map((property) => <article key={property.id}>
      <div><span className="eyebrow">{statusCopy[property.status] ?? property.status}</span><h2>{property.title}</h2><p>房源資料：{reviewCopy[property.listingReviewStatus] ?? property.listingReviewStatus}・出租權利：{reviewCopy[property.rightsStatus] ?? property.rightsStatus}</p><small>更新時間 {new Date(property.updatedAt).toLocaleString("zh-TW",{timeZone:"Asia/Taipei"})}</small></div>
      <div className="admin-actions"><Link className="button button-secondary" href={`/provider/properties/${property.id}/edit`}>編輯房源</Link>{property.listingReviewStatus !== "pending" && property.listingReviewStatus !== "approved" ? <form action={`/api/provider/properties/${property.id}/review`} method="post"><button className="button button-primary" type="submit">送出房源審核</button></form> : null}</div>
    </article>)}</div> : <div className="empty-state"><h2>目前沒有房源</h2><p>身分驗證通過後，可以建立第一筆房源草稿。</p></div>}
  </div></main>;
}
