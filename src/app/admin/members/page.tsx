import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireManager } from "@/features/admin/access";
import { getDb } from "@/features/auth/db";

type MemberRow = {
  id: string;
  email: string;
  name: string;
  role: "member" | "admin";
  disabledAt: string | null;
};

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const manager = await requireManager();
  const q = (await searchParams).q?.trim() ?? "";
  const db = await getDb();
  const rows = (await db.prepare(`SELECT u.id,u.email_normalized email,p.display_name name,u.role,u.disabled_at disabledAt FROM users u JOIN profiles p ON p.user_id=u.id WHERE (?='' OR u.email_normalized LIKE ? OR p.display_name LIKE ?) ORDER BY u.created_at DESC LIMIT 100`).bind(q, `%${q}%`, `%${q}%`).all()).results as unknown as MemberRow[];

  return (
    <AdminShell name={manager.displayName} title="會員管理">
      <div className="admin-toolbar">
        <form className="admin-search">
          <input name="q" defaultValue={q} placeholder="搜尋姓名或 Email" />
          <button className="button button-primary">搜尋</button>
        </form>
        <Link className="button button-secondary" href="/admin/members/new">新增會員</Link>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>會員名稱</th>
              <th>Email</th>
              <th>帳號狀態</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((member) => (
              <tr key={member.id}>
                <td><strong>{member.name}</strong> <span className={`status-pill ${member.role === "admin" ? "status-pending" : "status-approved"}`}>{member.role === "admin" ? "管理員" : "會員"}</span></td>
                <td>{member.email}</td>
                <td><span className={`status-pill ${member.disabledAt ? "status-rejected" : "status-approved"}`}>{member.disabledAt ? "已停用" : "使用中"}</span></td>
                <td><Link href={`/admin/members/${member.id}`}>查看詳情</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="empty-state">找不到符合條件的會員。</div> : null}
      </div>
    </AdminShell>
  );
}
