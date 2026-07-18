import Link from "next/link";
import type { ReactNode } from "react";

export function AdminShell({ name, title, eyebrow = "店長後台", children }: { name: string; title: string; eyebrow?: string; children: ReactNode }) {
  return <main className="admin-console"><aside className="admin-sidebar"><Link className="admin-brand" href="/admin">nidomi</Link><p>{name}・管理員</p><nav><Link href="/admin">總覽</Link><Link href="/admin/account">我的帳號</Link><Link href="/admin/members">會員管理</Link><Link href="/admin/properties">房源管理</Link><Link href="/admin/listing-tags">標籤管理</Link><Link href="/admin/verifications">身分審核</Link><Link href="/admin/settings/email">系統設定</Link><Link href="/admin/audit">稽核紀錄</Link><Link href="/">查看網站</Link></nav><form action="/api/auth/logout" method="post"><button className="nav-logout" type="submit">登出</button></form></aside><section className="admin-main"><header><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></header>{children}</section></main>;
}
