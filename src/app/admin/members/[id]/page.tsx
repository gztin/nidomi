import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { SuccessDialog } from "@/components/admin/success-dialog";
import { requireManager } from "@/features/admin/access";
import { getDb } from "@/features/auth/db";

type Member = {
  id: string;
  email: string;
  name: string;
  role: "member" | "admin";
  phone: string | null;
  createdAt: string;
  emailVerified: string | null;
  identityVerified: string | null;
  disabledAt: string | null;
};
type IdentitySubmission = { id: string; status: string; documentCount: number; hasFront: number; hasBack: number; maskedIdentityNumber: string | null };
type Property = { id: string; title: string; status: string; slug: string };
type Request = { id: string; code: string; status: string; phone: string; party: number; startAt: string; direction: string; meeting: string | null };

function identityStatusLabel(submission: IdentitySubmission | null, identityVerified: string | null) {
  if (identityVerified) return "已驗證";
  if (!submission) return "未驗證";
  const labels: Record<string, string> = { pending: "待審核", changes_requested: "需補件", rejected: "已拒絕", revoked: "已撤銷", approved: "已驗證" };
  return labels[submission.status] ?? submission.status;
}

export default async function MemberDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string; reason?: string; retry?: string }> }) {
  const manager = await requireManager();
  const { id } = await params;
  const { status, reason, retry } = await searchParams;
  const db = await getDb();
  const member = await db.prepare(`SELECT u.id,u.email_normalized email,p.display_name name,u.role,p.phone,u.created_at createdAt,u.email_verified_at emailVerified,u.identity_verified_at identityVerified,u.disabled_at disabledAt FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=?`).bind(id).first<Member>();
  if (!member) notFound();

  const submission = await db.prepare(`SELECT s.id,s.status,s.identity_number_masked maskedIdentityNumber,(SELECT COUNT(*) FROM identity_documents d WHERE d.submission_id=s.id AND d.deleted_at IS NULL) documentCount,EXISTS(SELECT 1 FROM identity_documents d WHERE d.submission_id=s.id AND d.document_side='front' AND d.deleted_at IS NULL) hasFront,EXISTS(SELECT 1 FROM identity_documents d WHERE d.submission_id=s.id AND d.document_side='back' AND d.deleted_at IS NULL) hasBack FROM identity_verification_submissions s WHERE s.user_id=? ORDER BY s.submitted_at DESC,s.version_number DESC LIMIT 1`).bind(id).first<IdentitySubmission>();
  const properties = (await db.prepare("SELECT id,title,status,slug FROM properties WHERE provider_user_id=? ORDER BY created_at DESC").bind(id).all()).results as unknown as Property[];
  const requests = (await db.prepare(`SELECT r.id,r.reference_code code,r.status,r.phone_snapshot phone,r.party_size party,s.start_at startAt,'tenant' direction,r.meeting_location meeting FROM viewing_requests r JOIN viewing_slots s ON s.id=r.viewing_slot_id WHERE r.requester_user_id=? UNION ALL SELECT r.id,r.reference_code,r.status,r.phone_snapshot,r.party_size,s.start_at,'provider',r.meeting_location FROM viewing_requests r JOIN viewing_slots s ON s.id=r.viewing_slot_id JOIN properties p ON p.id=r.property_id WHERE p.provider_user_id=? ORDER BY startAt DESC`).bind(id, id).all()).results as unknown as Request[];
  const resetBlockCopy: Record<string, string> = {
    disabled: "帳號目前已停權，請先恢復帳號後再寄送重設信。",
    "target-day": "此帳號已達每日 10 封的寄送上限，請於 24 小時後再試。",
    "target-hour": "此帳號已達每小時 5 封的寄送上限，請稍後再試。",
    "admin-hour": "你已達每小時 20 封的管理員寄送上限，請稍後再試。",
    "global-hour": "系統已達每小時 100 封的寄送上限，請稍後再試。",
    cooldown: `請等待 ${Math.max(1, Number(retry ?? 0))} 秒後再寄送。`,
  };
  return (
    <AdminShell name={manager.displayName} title={member.name} eyebrow="帳號詳情">
      {status === "reset-sent" && <SuccessDialog title="密碼重設信已建立" body="請會員前往信箱，於 1 小時內使用重設連結設定新密碼。"/>}
      {status === "reset-failed" && <div className="status-card status-rejected"><strong>密碼重設信寄送失敗</strong><p>請確認寄信服務設定後再試；本次重設連結不會顯示給管理員。</p></div>}
      {status === "reset-blocked" && <div className="status-card status-pending"><strong>目前不能寄送重設信</strong><p>{resetBlockCopy[reason ?? ""] ?? "請稍後再試。"}</p></div>}
      <Link className="policy-back" href="/admin/members">← 返回帳號列表</Link>
      <section className="admin-panel">
        <h2>基本資料</h2>
        <dl className="fee-list admin-member-meta">
          <div>
            <dt>Email</dt>
            <dd>{member.email} <span className={`status-pill ${member.emailVerified ? "status-approved" : "status-pending"}`}>{member.emailVerified ? "已驗證" : "未驗證"}</span></dd>
          </div>
          <div><dt>帳號類型</dt><dd>{member.role === "admin" ? "管理員" : "會員"}</dd></div>
          <div><dt>身分證字號</dt><dd>{submission?.maskedIdentityNumber ?? "待補登"}</dd></div>
          <div><dt>電話</dt><dd>{member.phone ?? "未提供"}</dd></div>
          <div>
            <dt>身分驗證</dt>
            <dd>
              <span className={`status-pill ${member.identityVerified ? "status-approved" : "status-pending"}`}>{identityStatusLabel(submission, member.identityVerified)}</span>
              {submission && submission.documentCount > 0 && manager.canReviewDocuments ? (
                <div className="inline-actions">
                  {submission.hasFront ? <Link className="button button-secondary" href={`/api/admin/verifications/${submission.id}/documents/front`} target="_blank">查看正面</Link> : null}
                  {submission.hasBack ? <Link className="button button-secondary" href={`/api/admin/verifications/${submission.id}/documents/back`} target="_blank">查看反面</Link> : null}
                  <Link className="button button-secondary" href={`/admin/verifications/${submission.id}`}>審核紀錄</Link>
                </div>
              ) : null}
            </dd>
          </div>
          <div><dt>註冊日期</dt><dd>{new Date(member.createdAt).toLocaleString("zh-TW")}</dd></div>
          <div><dt>帳號狀態</dt><dd>{member.disabledAt ? `已停權（${new Date(member.disabledAt).toLocaleString("zh-TW")}）` : "使用中"}</dd></div>
          <div>
            <dt>重設密碼</dt>
            <dd>
              <form className="inline-status-form" action={`/api/admin/members/${id}/password-reset`} method="post">
                <button className="button button-primary" type="submit" disabled={Boolean(member.disabledAt)}>重設密碼</button>
              </form>
            </dd>
          </div>
          {member.role === "member" ? (
            <div>
              <dt>停權設定</dt>
              <dd>
                <form className="inline-status-form" action={`/api/admin/members/${id}/status`} method="post">
                  <button className={`button ${member.disabledAt ? "button-secondary" : "button-danger"}`} name="action" value={member.disabledAt ? "enable" : "disable"}>{member.disabledAt ? "恢復會員" : "停用會員"}</button>
                </form>
              </dd>
            </div>
          ) : null}
        </dl>
        {id === manager.id ? <div className="admin-actions"><Link className="button button-secondary" href="/admin/account">編輯我的帳號</Link></div> : null}
      </section>

      <section className="admin-panel">
        <h2>會員房源</h2>
        {properties.length ? properties.map((p) => <div className="admin-list-row" key={p.id}><strong>{p.title}</strong><span>{p.status}</span></div>) : <p>尚無房源。</p>}
      </section>

      <section className="admin-panel">
        <h2>預約紀錄</h2>
        {requests.length ? requests.map((r) => <div className="admin-list-row" key={`${r.direction}-${r.id}`}><div><strong>{r.code}・{r.direction === "tenant" ? "租客預約" : "房東收到"}</strong><small>{new Date(r.startAt).toLocaleString("zh-TW")}・{r.party} 人・{r.phone}</small></div><span>{r.status}</span></div>) : <p>尚無預約。</p>}
      </section>
    </AdminShell>
  );
}
