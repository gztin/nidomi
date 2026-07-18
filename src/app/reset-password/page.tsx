import Link from "next/link";
import { PasswordField } from "@/components/form/password-field";
import { MIN_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH_LABEL } from "@/features/auth/password-policy";

const errorCopy: Record<string, string> = {
  invalid: "重設連結可能已過期、已使用或不正確，請聯絡管理員重新寄送。",
  password: `請確認兩次密碼相同，且密碼${MIN_PASSWORD_LENGTH_LABEL}。`,
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; status?: string; error?: string }> }) {
  const { token = "", status, error } = await searchParams;
  const success = status === "success";
  return <main className="workflow-page"><div className="workflow-shell">
    <Link className="policy-back" href="/login">← 返回登入</Link>
    <p className="eyebrow">帳號安全</p>
    <h1>{success ? "密碼已更新" : "設定新密碼"}</h1>
    {success ? <><p className="workflow-lead">所有舊的登入狀態已失效，請使用新密碼重新登入。</p><Link className="button button-primary" href="/login">前往登入</Link></> : <>
      <p className="workflow-lead">重設連結只能使用一次，並會在寄出 1 小時後失效。</p>
      {error && <div className="status-card status-rejected"><strong>無法重設密碼</strong><p>{errorCopy[error] ?? error}</p></div>}
      <form className="verification-form" action="/api/auth/reset-password" method="post">
        <input type="hidden" name="token" value={token}/>
        <PasswordField label="新密碼" name="password" minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" required/>
        <PasswordField label="確認新密碼" name="confirmPassword" minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" required/>
        <button className="button button-primary" type="submit">更新密碼</button>
      </form>
    </>}
  </div></main>;
}
