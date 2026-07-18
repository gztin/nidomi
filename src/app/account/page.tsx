import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberAccountForm } from "@/components/member/member-account-form";
import { getDb } from "@/features/auth/db";
import { getCurrentUser } from "@/features/auth/session";
import { canUploadIdentity, identityStatusLabel, identityUploadLabel, type IdentitySubmissionStatus } from "@/features/identity/submission-status";
import { MemberNavigation } from "@/components/member/member-navigation";

type Account = {
  email: string;
  displayName: string;
  phone: string | null;
  emailVerifiedAt: string | null;
  identityVerifiedAt: string | null;
  createdAt: string;
};

const errorCopy: Record<string, string> = {
  invalid: "請確認顯示暱稱與聯絡電話格式。",
};

export default async function MemberAccountPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  if (user.role === "admin") redirect("/admin/account");
  const { status, error } = await searchParams;
  const db = await getDb();
  const [account, submission] = await Promise.all([
    db.prepare("SELECT u.email_normalized email,u.email_verified_at emailVerifiedAt,u.identity_verified_at identityVerifiedAt,u.created_at createdAt,p.display_name displayName,p.phone FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=?").bind(user.id).first<Account>(),
    db.prepare("SELECT status FROM identity_verification_submissions WHERE user_id=? ORDER BY submitted_at DESC,version_number DESC LIMIT 1").bind(user.id).first<{ status: IdentitySubmissionStatus }>(),
  ]);
  if (!account) redirect("/");
  const submissionStatus = submission?.status ?? null;
  const identityVerified = Boolean(account.identityVerifiedAt);

  return <main className="workflow-page">
    <div className="workflow-shell">
      <Link className="policy-back" href="/">← 返回首頁</Link>
      <p className="eyebrow">會員帳號</p>
      <h1>我的資料</h1>
      <p className="workflow-lead">你可以修改自己的顯示暱稱與聯絡電話；登入 Email 與驗證資料不能自行修改。</p>
      <MemberNavigation current="/account" />
      {status === "saved" && <div className="status-card status-approved"><strong>會員資料已更新</strong><p>新的暱稱與聯絡電話已儲存。</p></div>}
      {error && <div className="status-card status-rejected"><strong>無法更新會員資料</strong><p>{errorCopy[error] ?? errorCopy.invalid}</p></div>}
      <MemberAccountForm
        displayName={account.displayName}
        phone={account.phone ?? ""}
        email={account.email}
        emailStatus={account.emailVerifiedAt ? "已驗證" : "未驗證"}
        identityStatus={identityStatusLabel(submissionStatus, identityVerified)}
        accountStatus="使用中"
        registeredAt={new Date(account.createdAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}
      />
      {canUploadIdentity(submissionStatus, identityVerified) && <div className="admin-actions"><Link className={`button ${submissionStatus ? "button-primary" : "button-secondary"}`} href="/account/verification">{identityUploadLabel(submissionStatus)}</Link></div>}
    </div>
  </main>;
}
