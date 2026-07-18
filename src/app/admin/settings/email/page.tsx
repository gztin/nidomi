import { AdminShell } from "@/components/admin/admin-shell";
import { SuccessDialog } from "@/components/admin/success-dialog";
import { requireManager } from "@/features/admin/access";
import { getDb, getEnv } from "@/features/auth/db";
import { getStoredEmailSettings, maskApiKey } from "@/features/email/settings";

export default async function EmailSettingsPage({ searchParams }: { searchParams: Promise<{ status?: string; reason?: string }> }) {
  const manager = await requireManager();
  const { status, reason } = await searchParams;
  const env = await getEnv();
  const settings = await getStoredEmailSettings(await getDb(), env.SETTINGS_ENCRYPTION_KEY).catch(() => null);
  const successMessage = status === "saved"
    ? { title: "設定已儲存", body: "後續通知信將優先使用這組 Resend 設定。" }
    : status === "api-verified"
      ? { title: "API Key 已驗證並儲存", body: "Resend API Key 可正常連線，寄件設定也已加密保存，現在可以寄送測試信。" }
      : status === "api-verified-limited"
        ? { title: "API Key 已驗證並儲存", body: "這組 API Key 僅有寄信權限，寄件設定已加密保存，請寄送測試信確認完整流程。" }
        : status === "test-sent"
          ? { title: "測試信已送出", body: "請到測試收件信箱確認是否收到 nidomi 測試信。" }
          : null;
  const errorMessage = status === "api-verify-failed"
    ? { title: "API Key 驗證失敗", body: reason ?? "請確認 API Key 是否正確且仍在有效期限內。" }
    : status === "test-failed"
      ? { title: "測試信寄送失敗", body: reason ?? "請確認 API Key、寄件信箱與 Resend 網域設定。" }
      : status === "invalid"
        ? { title: "無法儲存", body: "請確認 API Key 與寄件信箱格式。" }
        : status === "missing-secret"
          ? { title: "缺少加密設定", body: "伺服器尚未設定 SETTINGS_ENCRYPTION_KEY。" }
          : null;

  return <AdminShell name={manager.displayName} title="寄信服務設定" eyebrow="系統設定">
    {successMessage && <SuccessDialog title={successMessage.title} body={successMessage.body}/>} 
    {errorMessage && <SuccessDialog title={errorMessage.title} body={errorMessage.body} tone="error"/>}
    <section className="admin-panel admin-settings-card">
      <h2>Resend</h2>
      <p className="admin-settings-lead">API Key 會加密保存，儲存後不會再次完整顯示。</p>
      <form className="admin-form-grid" action="/api/admin/settings/email" method="post">
        <label className="admin-form-wide">API Key
          <input name="apiKey" type="password" autoComplete="off" placeholder={settings?.apiKey ? `已設定：${maskApiKey(settings.apiKey)}` : "re_..."}/>
          <small>{settings ? "留空可保留目前的 API Key。" : "目前尚未從後台設定 API Key。"}</small>
        </label>
        <label>寄件者名稱<input name="fromName" required maxLength={80} defaultValue={settings?.fromName ?? "nidomi"}/></label>
        <label>寄件信箱<input name="fromEmail" type="email" required defaultValue={settings?.fromEmail ?? "notify@fomoguys.com"}/></label>
        <label className="admin-form-wide">測試收件信箱
          <input name="testRecipient" type="email" placeholder={manager.email} required/>
          <small>寄送測試信時必填；不會儲存成系統設定。</small>
        </label>
        <div className="admin-form-wide admin-actions">
          <button className="button button-primary" type="submit" formNoValidate>儲存寄信設定</button>
          <button className="button button-secondary" type="submit" formAction="/api/admin/settings/email/verify" formNoValidate>驗證並儲存 API Key</button>
          <button className="button button-secondary" type="submit" formAction="/api/admin/settings/email/test" disabled={!settings}>寄送測試信</button>
        </div>
        {!settings && <p className="admin-form-wide form-note">請先完成「驗證並儲存 API Key」，才能寄送測試信。</p>}
      </form>
      {settings && <p className="admin-settings-meta">最後更新：{new Date(settings.updatedAt).toLocaleString("zh-TW")}</p>}
    </section>
  </AdminShell>;
}
