import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireManager } from "@/features/admin/access";
import { getDb } from "@/features/auth/db";

const PAGE_SIZE = 10;
type PropertyRow = { id:string; title:string; ownerName:string; ownerEmail:string; createdAt:string; reviewStatus:string };
const reviewStatusLabels: Record<string, string> = {
  not_submitted: "尚未送審",
  pending: "審核中",
  approved: "已通過",
  rejected: "未通過",
};

function pageHref(q:string,page:number){const params=new URLSearchParams();if(q)params.set("q",q);if(page>1)params.set("page",String(page));const query=params.toString();return `/admin/properties${query?`?${query}`:""}`}

export default async function AdminPropertiesPage({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}){
  const manager=await requireManager();const params=await searchParams;const q=params.q?.trim()??"";const requested=Math.max(1,Number.parseInt(params.page??"1",10)||1);const db=await getDb();
  const countRow=await db.prepare("SELECT COUNT(*) total FROM properties WHERE (?='' OR title LIKE ?)").bind(q,`%${q}%`).first<{total:number}>();const total=countRow?.total??0;const totalPages=Math.max(1,Math.ceil(total/PAGE_SIZE));const page=Math.min(requested,totalPages);const offset=(page-1)*PAGE_SIZE;
  const rows=(await db.prepare(`SELECT x.id,x.title,p.display_name ownerName,u.email_normalized ownerEmail,x.created_at createdAt,x.listing_review_status reviewStatus FROM properties x JOIN users u ON u.id=x.provider_user_id JOIN profiles p ON p.user_id=u.id WHERE (?='' OR x.title LIKE ?) ORDER BY CASE x.listing_review_status WHEN 'pending' THEN 0 ELSE 1 END,x.created_at DESC,x.id LIMIT ? OFFSET ?`).bind(q,`%${q}%`,PAGE_SIZE,offset).all()).results as unknown as PropertyRow[];
  const windowStart=Math.max(1,Math.min(page-4,totalPages-9));const windowEnd=Math.min(totalPages,windowStart+9);const pageNumbers=Array.from({length:windowEnd-windowStart+1},(_,index)=>windowStart+index);
  return <AdminShell name={manager.displayName} title="房源管理"><div className="admin-toolbar"><form className="admin-search" action="/admin/properties"><input name="q" defaultValue={q} placeholder="輸入房源名稱搜尋"/><button className="admin-icon-button" aria-label="搜尋房源" title="搜尋房源"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg></button>{q&&<Link className="button button-secondary" href="/admin/properties">清除</Link>}</form></div><p className="admin-result-summary">共 {total} 筆房源{q&&`・搜尋「${q}」`}・第 {page} / {totalPages} 頁</p><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>項次</th><th>房源名稱</th><th>持有者</th><th>資料審核</th><th>創建日期</th><th>查看詳情</th></tr></thead><tbody>{rows.map((row,index)=><tr key={row.id}><td>{offset+index+1}</td><td><strong>{row.title}</strong></td><td>{row.ownerName}<small>{row.ownerEmail}</small></td><td><span className={`status-pill status-${row.reviewStatus}`}>{reviewStatusLabels[row.reviewStatus] ?? row.reviewStatus}</span></td><td>{new Date(row.createdAt).toLocaleDateString("zh-TW")}</td><td><Link className="button button-secondary" href={`/admin/properties/${row.id}`}>查看詳情</Link></td></tr>)}</tbody></table>{rows.length===0&&<div className="empty-state"><h2>找不到房源</h2><p>請嘗試其他房源名稱。</p></div>}</div>{totalPages>1&&<nav className="admin-pagination" aria-label="房源列表分頁"><Link aria-disabled={page===1} className={page===1?"is-disabled":""} href={pageHref(q,1)}>第一頁</Link><Link aria-disabled={page===1} className={page===1?"is-disabled":""} href={pageHref(q,Math.max(1,page-1))}>上一頁</Link>{pageNumbers.map(number=><Link aria-current={number===page?"page":undefined} className={number===page?"is-current":""} href={pageHref(q,number)} key={number}>{number}</Link>)}<Link aria-disabled={page===totalPages} className={page===totalPages?"is-disabled":""} href={pageHref(q,Math.min(totalPages,page+1))}>下一頁</Link><Link aria-disabled={page===totalPages} className={page===totalPages?"is-disabled":""} href={pageHref(q,totalPages)}>最後一頁</Link></nav>}</AdminShell>;
}
