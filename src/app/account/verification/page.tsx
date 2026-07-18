import Link from "next/link";
import { IdentityVerificationForm } from "@/components/member/identity-verification-form-demo";
import { IdentitySubmissionManager } from "@/components/member/identity-submission-manager";
import { getDb } from "@/features/auth/db";
import { getCurrentUser } from "@/features/auth/session";
import { canUploadIdentity, identityStatusLabel, type IdentitySubmissionStatus } from "@/features/identity/submission-status";
import { redirect } from "next/navigation";

const errorCopy: Record<string, string> = {
  invalid: "請確認身分證字號、正反面文件及同意事項。",
  identity: "身分證字號格式或檢查碼不正確。",
  file: "證件限 JPG、PNG，每張原始圖片最多 5MB；長邊至少 960px、短邊至少 600px。",
  active: "你已有待審核或已通過的身分驗證資料。",
  email: "請先完成 Email 驗證。",
  config: "身分資料加密服務尚未完成設定，請聯絡管理員。",
  upload: "資料未能送出，請稍後再試。",
};

export default async function AccountVerificationPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const user=await getCurrentUser();if(!user)redirect("/login?next=/account/verification");if(user.role==="admin")redirect("/admin");
  const { status, error } = await searchParams;
  const submission = await (await getDb()).prepare(`SELECT s.id,s.status,s.identity_number_masked maskedIdentityNumber,s.submitted_at submittedAt,
    EXISTS(SELECT 1 FROM identity_documents d WHERE d.submission_id=s.id AND d.document_side='front' AND d.deleted_at IS NULL) hasFront,
    EXISTS(SELECT 1 FROM identity_documents d WHERE d.submission_id=s.id AND d.document_side='back' AND d.deleted_at IS NULL) hasBack,
    (SELECT d.mime_type FROM identity_documents d WHERE d.submission_id=s.id AND d.document_side='front' AND d.deleted_at IS NULL) frontMimeType,
    (SELECT d.mime_type FROM identity_documents d WHERE d.submission_id=s.id AND d.document_side='back' AND d.deleted_at IS NULL) backMimeType
    FROM identity_verification_submissions s WHERE s.user_id=? ORDER BY s.submitted_at DESC,s.version_number DESC LIMIT 1`).bind(user.id).first<{ id: string; status: IdentitySubmissionStatus; maskedIdentityNumber: string | null; submittedAt: string; hasFront: number; hasBack: number; frontMimeType: string | null; backMimeType: string | null }>();
  const submissionStatus = submission?.status ?? null;
  const mayUpload = canUploadIdentity(submissionStatus, user.identityVerified);
  return (
    <main className="workflow-page">
      <div className="workflow-shell">
        <Link className="policy-back" href="/">← 返回房源</Link>
        <p className="eyebrow">會員資料驗證</p>
        <h1>取得綠色會員標章</h1>
        <p className="workflow-lead">完成 Email 驗證並提交身分資料，經管理員審核通過後，即可取得綠色「認證會員」徽章。</p>
        {status === "submitted" && <div className="status-card status-pending"><strong>已送出，等待管理員審核</strong><p>審核結果與補件通知會寄到你的驗證信箱。</p></div>}
        {error && <div className="status-card status-rejected"><strong>無法送出身分驗證</strong><p>{errorCopy[error] ?? errorCopy.invalid}</p></div>}
        {status !== "submitted" && submissionStatus && <div className={`status-card ${submissionStatus === "approved" ? "status-approved" : "status-pending"}`}><strong>目前狀態：{identityStatusLabel(submissionStatus, user.identityVerified)}</strong><p>{mayUpload ? "你可以重新上傳資料；送出後將以最新版本進行審核。" : "身分驗證已通過，不需要再次上傳資料。"}</p></div>}
        <div className="privacy-notice"><strong>上傳前請先確認</strong><ul><li>文件不會顯示在公開頁。</li><li>僅本人與具審核權限的管理員可查看。</li><li>請勿上傳與驗證無關的銀行或第三人資料。</li></ul></div>
        {submission ? <IdentitySubmissionManager
          submissionId={submission.id}
          maskedIdentityNumber={submission.maskedIdentityNumber ?? ""}
          submittedAt={new Date(submission.submittedAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}
          statusLabel={identityStatusLabel(submissionStatus, user.identityVerified)}
          mayUpload={mayUpload}
          hasFront={Boolean(submission.hasFront)}
          hasBack={Boolean(submission.hasBack)}
          frontMimeType={submission.frontMimeType}
          backMimeType={submission.backMimeType}
        /> : mayUpload && <IdentityVerificationForm />}
      </div>
    </main>
  );
}
