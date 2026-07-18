import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberNavigation } from "@/components/member/member-navigation";
import { VerificationEmblem } from "@/components/member/verification-emblem";
import { getCurrentUser } from "@/features/auth/session";
import { getDb } from "@/features/auth/db";
import { identityStatusLabel, type IdentitySubmissionStatus } from "@/features/identity/submission-status";
import { canCreateProperty, propertyAccessMessage } from "@/features/member/feature-access";

export default async function MemberPermissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/permissions");
  if (user.role === "admin") redirect("/admin/account");

  const submission = await (await getDb()).prepare("SELECT status FROM identity_verification_submissions WHERE user_id=? ORDER BY submitted_at DESC,version_number DESC LIMIT 1").bind(user.id).first<{ status: IdentitySubmissionStatus }>();
  const identityLabel = identityStatusLabel(submission?.status ?? null, user.identityVerified);
  const canCreate = canCreateProperty({ emailVerified: user.emailVerified, identityVerified: user.identityVerified });

  return <main className="workflow-page"><div className="workflow-shell">
    <Link className="policy-back" href="/">← 返回首頁</Link>
    <p className="eyebrow">會員中心</p>
    <h1>身分與功能權限</h1>
    <p className="workflow-lead">不同驗證狀態會開放不同功能。驗證只代表指定資料已依平台流程確認，不代表付款能力、履約能力或交易安全保證。</p>
    <MemberNavigation current="/account/permissions" />

    <section className="permission-current">
      <div><span>Email 驗證</span><strong>{user.emailVerified ? "已驗證" : "未驗證"}</strong></div>
      <div><span>身分驗證</span><strong>{identityLabel}</strong></div>
      <p>{propertyAccessMessage({ emailVerified: user.emailVerified, identityVerified: user.identityVerified })}</p>
      {!user.identityVerified && <Link className="button button-primary" href="/account/verification">{submission?.status === "pending" ? "查看或更新驗證資料" : "前往身分驗證"}</Link>}
      {canCreate && <Link className="button button-primary" href="/provider/properties/new">新增房源</Link>}
    </section>

    <section className="permission-badge-guide">
      <h2>徽章與對應權限</h2>
      <div className="permission-badge-table-wrap">
        <table className="permission-badge-table">
          <thead><tr><th scope="col">徽章</th><th scope="col">說明資訊</th></tr></thead>
          <tbody>
            <tr><td><VerificationEmblem variant="gray" label="普通會員" /></td><td><strong>普通會員</strong><p>完成註冊後取得。可瀏覽公開房源，並管理自己的基本資料。</p></td></tr>
            <tr><td><VerificationEmblem variant="green" label="認證會員" /></td><td><strong>認證會員</strong><p>Email 與身分資料審核通過後取得。可提出約看預約、建立及管理自己的房源。</p></td></tr>
            <tr><td><VerificationEmblem variant="blue" label="證照會員" /></td><td><strong>證照會員</strong><p>完成會員認證，且專業證照文件通過平台審核後取得。徽章只代表指定證照資料已完成審核。</p></td></tr>
            <tr><td><VerificationEmblem variant="gold" label="房源已審核" /></td><td><strong>房源已審核</strong><p>房源主要資料與公開內容通過平台審核後取得；這是房源徽章，不等同所有權或出租權利驗證。</p></td></tr>
          </tbody>
        </table>
      </div>
      <p className="badge-disclaimer">徽章僅表示對應資料已依平台流程完成審核，不代表付款能力、履約能力、所有權或交易安全保證。</p>
    </section>
  </div></main>;
}
