import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberNavigation } from "@/components/member/member-navigation";
import { getCurrentUser } from "@/features/auth/session";
import { getDb } from "@/features/auth/db";

const statusCopy: Record<string, string> = { pending: "待房源提供者確認", confirmed: "已確認", cancelled: "已取消", expired: "已逾期" };

export default async function RequestsPage(){
  const user=await getCurrentUser();
  if(!user)redirect('/login?next=/requests');
  if(user.role === "admin") redirect("/admin");
  const rows=(await (await getDb()).prepare(`SELECT r.id,r.reference_code code,r.status,r.created_at createdAt,p.title propertyTitle FROM viewing_requests r JOIN properties p ON p.id=r.property_id WHERE r.requester_user_id=? ORDER BY r.created_at DESC`).bind(user.id).all()).results as unknown as {id:string;code:string;status:string;createdAt:string;propertyTitle:string}[];
  return <main className="workflow-page"><div className="workflow-shell">
    <Link className="policy-back" href="/">← 返回首頁</Link><p className="eyebrow">會員中心</p><h1>我的預約</h1>
    <MemberNavigation current="/requests" />
    {rows.length ? <div className="viewing-slots">{rows.map(r=><Link className="viewing-slot" href={`/requests/${r.id}`} key={r.id}><strong>{r.propertyTitle}</strong><span>{r.code}・{statusCopy[r.status] ?? r.status}</span><small>{new Date(r.createdAt).toLocaleString("zh-TW",{timeZone:"Asia/Taipei"})}</small></Link>)}</div> : <div className="empty-state"><h2>目前沒有預約紀錄</h2><p>選擇房源開放的時段後，預約進度會顯示在這裡。</p><Link className="button button-primary" href="/">查看房源</Link></div>}
  </div></main>;
}
