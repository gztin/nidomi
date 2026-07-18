import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { PasswordField } from "@/components/form/password-field";
import { requireManager } from "@/features/admin/access";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/password-policy";

const errorCopy: Record<string, string> = {
  invalid: "請確認必填欄位、Email 格式與密碼長度。",
  exists: "此 Email 已被使用。",
};

export default async function NewMemberPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const manager = await requireManager();
  const { error } = await searchParams;
  return <AdminShell name={manager.displayName} title="新增會員" eyebrow="會員管理">
    <Link className="policy-back" href="/admin/members">← 返回會員列表</Link>
    {error && <div className="privacy-notice"><strong>{errorCopy[error] ?? error}</strong></div>}
    <section className="admin-panel admin-settings-card">
      <p className="admin-settings-lead">由管理者代建的帳號可直接登入。正式使用前，仍建議由會員補齊條款與隱私權同意流程。</p>
      <form className="admin-property-form" action="/api/admin/members" method="post">
        <div className="admin-form-grid">
          <label>顯示名稱<input name="name" required/></label>
          <label>Email<input name="email" type="email" required/></label>
          <label>電話<input name="phone" inputMode="tel"/></label>
          <PasswordField label="初始密碼" name="password" minLength={MIN_PASSWORD_LENGTH} required/>
          <label className="admin-check admin-form-wide"><input name="emailVerified" type="checkbox" value="on"/>將 Email 視為已驗證</label>
        </div>
        <div className="admin-submit-bar">
          <p>請只在已確認會員身分與聯絡方式時，才勾選 Email 已驗證。</p>
          <button className="button button-primary" type="submit">建立會員</button>
        </div>
      </form>
    </section>
  </AdminShell>;
}
