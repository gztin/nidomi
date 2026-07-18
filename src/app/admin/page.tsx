import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireManager } from "@/features/admin/access";
import { getDb } from "@/features/auth/db";

export default async function AdminPage() {
  const manager = await requireManager();
  const db = await getDb();
  const stats = await db.prepare(`SELECT
    (SELECT COUNT(*) FROM users WHERE role='member') members,
    (SELECT COUNT(*) FROM users WHERE role='member' AND email_verified_at IS NOT NULL) emailVerified,
    (SELECT COUNT(*) FROM identity_verification_submissions WHERE status='pending') pendingReviews,
    (SELECT COUNT(*) FROM properties) properties,
    (SELECT COUNT(*) FROM viewing_requests WHERE status IN ('pending','confirmed')) activeRequests
  `).first<{members:number;emailVerified:number;pendingReviews:number;properties:number;activeRequests:number}>();
  const cards = [{label:"會員總數",value:stats?.members??0,href:"/admin/members"},{label:"Email 已驗證",value:stats?.emailVerified??0,href:"/admin/members"},{label:"待審核會員",value:stats?.pendingReviews??0,href:"/admin/verifications"},{label:"房源",value:stats?.properties??0,href:"/admin/properties"},{label:"進行中預約",value:stats?.activeRequests??0}];
  return <AdminShell name={manager.displayName} title="管理總覽"><div className="admin-stat-grid">{cards.map(card=>card.href?<Link className="admin-stat" href={card.href} key={card.label}><span>{card.label}</span><strong>{card.value}</strong></Link>:<div className="admin-stat" key={card.label}><span>{card.label}</span><strong>{card.value}</strong></div>)}</div><section className="admin-panel"><h2>待辦事項</h2><p>優先處理會員身分審核與異常帳號。房源及預約完整管理會在下一階段加入。</p><div className="admin-actions"><Link className="button button-primary" href="/admin/members">查看會員</Link><Link className="button button-secondary" href="/admin/verifications">處理身分審核</Link></div></section></AdminShell>;
}
