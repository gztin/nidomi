import { AdminShell } from "@/components/admin/admin-shell";
import { SuccessDialog } from "@/components/admin/success-dialog";
import { requireManager } from "@/features/admin/access";
import { getDb } from "@/features/auth/db";

type Account = {
  email: string;
  displayName: string;
  phone: string | null;
  emailVerifiedAt: string | null;
};

const errorCopy: Record<string, string> = {
  invalid: "請確認暱稱與電話格式。",
};

export default async function AdminAccountPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const manager = await requireManager();
  const { status, error } = await searchParams;
  const account = await (await getDb()).prepare("SELECT u.email_normalized email,u.email_verified_at emailVerifiedAt,p.display_name displayName,p.phone FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=?").bind(manager.id).first<Account>();
  if (!account) return null;

  const success = status === "saved" ? { title: "帳號資料已更新", body: "你的暱稱與電話已儲存。" } : null;

  return <AdminShell name={account.displayName} title="我的帳號" eyebrow="管理員設定">
    {success && <SuccessDialog title={success.title} body={success.body}/>} 
    {error && <div className="status-card status-rejected"><strong>無法更新帳號</strong><p>{errorCopy[error] ?? error}</p></div>}
    <section className="admin-panel admin-settings-card">
      <form className="admin-property-form" action="/api/admin/account" method="post">
        <div className="admin-form-grid">
          <label>暱稱<input name="displayName" required maxLength={80} defaultValue={account.displayName}/></label>
          <label>電話<input name="phone" inputMode="tel" maxLength={30} defaultValue={account.phone ?? ""}/></label>
          <div className="admin-form-wide">
            <strong>登入帳號（Email）</strong>
            <p>{account.email} <span className={`status-pill ${account.emailVerifiedAt ? "status-approved" : "status-pending"}`}>{account.emailVerifiedAt ? "已驗證" : "未驗證"}</span></p>
            <p className="form-note">登入帳號不能自行修改；如需修正，請聯絡另一位管理員協助處理。</p>
          </div>
        </div>
        <div className="admin-submit-bar">
          <p>此頁只能修改目前登入管理員的暱稱與電話。</p>
          <button className="button button-primary" type="submit">儲存帳號資料</button>
        </div>
      </form>
    </section>
  </AdminShell>;
}
