import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireManager } from "@/features/admin/access";
import { getDb, getEnv } from "@/features/auth/db";
import { revealIdentityNumber } from "@/features/identity/identity-number";

type Submission = {
  id: string;
  userId: string;
  status: string;
  submittedAt: string;
  name: string;
  email: string;
  documentCount: number;
  maskedIdentityNumber: string | null;
  ciphertext: string | null;
  iv: string | null;
};

const errorCopy: Record<string, string> = {
  required: "請選擇審核理由；要求補件或拒絕時也必須填寫補充說明。",
  "identity-number-required": "這筆舊資料沒有身分證字號，請會員重新提交後再通過審核。",
  duplicate: "此身分證字號已由另一個帳號完成驗證，不能再次通過。請依人工流程確認帳號歸屬。",
};

export default async function VerificationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const manager = await requireManager();
  const { id } = await params;
  const { error } = await searchParams;
  const db = await getDb();
  const row = await db.prepare(`SELECT s.id,s.user_id userId,s.status,s.submitted_at submittedAt,p.display_name name,u.email_normalized email,s.identity_number_masked maskedIdentityNumber,s.identity_number_ciphertext ciphertext,s.identity_number_iv iv,(SELECT COUNT(*) FROM identity_documents d WHERE d.submission_id=s.id AND d.deleted_at IS NULL) documentCount FROM identity_verification_submissions s JOIN users u ON u.id=s.user_id JOIN profiles p ON p.user_id=u.id WHERE s.id=?`).bind(id).first<Submission>();
  if (!row) notFound();

  const revealAllowed = (await cookies()).get(`fh_identity_${id}`)?.value === "1";
  let fullIdentityNumber: string | null = null;
  if (revealAllowed && row.ciphertext && row.iv) {
    const secret = (await getEnv()).IDENTITY_DATA_ENCRYPTION_KEY?.trim();
    if (secret) fullIdentityNumber = await revealIdentityNumber(row.ciphertext, row.iv, secret).catch(() => null);
  }

  return <AdminShell name={manager.displayName} title="處理身分審核">
    <Link href="/admin/verifications">← 返回審核列表</Link>
    {error && <div className="status-card status-rejected"><strong>無法完成審核</strong><p>{errorCopy[error] ?? errorCopy.required}</p></div>}
    <section className="admin-panel">
      <div className="review-heading">
        <div><strong>{row.name}</strong><p>{row.email}</p></div>
        <span className={`status-pill status-${row.status}`}>{row.status}</span>
      </div>
      <dl className="fee-list admin-member-meta">
        <div>
          <dt>身分證字號</dt>
          <dd>
            <strong>{fullIdentityNumber ?? row.maskedIdentityNumber ?? "待補登"}</strong>
            {!fullIdentityNumber && row.ciphertext && manager.canReviewDocuments ? <form className="inline-status-form" action={`/api/admin/verifications/${id}/reveal-identity-number`} method="post"><button className="button button-secondary" type="submit">查看完整字號</button></form> : null}
          </dd>
        </div>
      </dl>
      <div className="controlled-preview"><strong>受控文件區</strong><p>已提交 {row.documentCount} 份文件。請比對身分證字號與證件正反面；查看完整字號及影像都會留下稽核紀錄。</p></div>
      {row.documentCount > 0 && manager.canReviewDocuments ? <div className="inline-actions"><Link className="button button-secondary" href={`/api/admin/verifications/${id}/documents/front`} target="_blank">查看正面</Link><Link className="button button-secondary" href={`/api/admin/verifications/${id}/documents/back`} target="_blank">查看反面</Link></div> : null}
      {row.status === "pending" ? <form className="sensitive-form" action={`/api/admin/verifications/${id}/review`} method="post">
        <label>審核理由代碼<select name="reasonCode" required><option value="identity_match">資料一致</option><option value="document_unclear">文件不清楚</option><option value="information_mismatch">資料不一致</option><option value="suspected_fraud">疑似偽造</option></select></label>
        <label>補充說明<textarea name="reasonDetail" rows={4}/></label>
        <div className="review-actions"><button className="button button-primary" name="decision" value="approved">通過</button><button className="button button-secondary" name="decision" value="changes_requested">要求補件</button><button className="button button-danger" name="decision" value="rejected">拒絕</button></div>
      </form> : <p>此申請已完成處理。</p>}
    </section>
  </AdminShell>;
}
