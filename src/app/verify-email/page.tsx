import Link from "next/link";

type SearchParams = { token?: string; status?: string; email?: string; resent?: string; sent?: string; delivery?: string };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const p = await searchParams;
  const invalid = p.status === "invalid";
  const failed = p.delivery === "failed";
  const sent = p.sent === "1" && !p.token;
  const lead = invalid
    ? "連結可能已過期、已使用或不正確，請重新寄送驗證信。"
    : failed
      ? "帳號已建立，但驗證信目前寄送失敗。請稍後再試；你的註冊資料不會因此遺失。"
      : sent
        ? "驗證信已寄出，請前往信箱開啟連結。若沒有收到，也請檢查垃圾郵件匣。"
        : p.resent
          ? "新的本機驗證信已建立。"
          : "本機開發模式會在此提供驗證入口；正式環境只會透過通知信寄送。";

  return <main className="workflow-page"><div className="workflow-shell"><p className="eyebrow">Email 驗證</p><h1>{invalid ? "驗證連結已失效" : "請驗證你的 Email"}</h1><p className="workflow-lead">{lead}</p>{p.token && <Link className="button button-primary" href={`/api/auth/verify-email?token=${encodeURIComponent(p.token)}`}>完成 Email 驗證</Link>}<form className="verification-form" action="/api/auth/resend-verification" method="post" style={{ marginTop: 28 }}><label>驗證信箱<input name="email" type="email" defaultValue={p.email ?? ""} required /></label><button className="button button-secondary" type="submit">重新寄送驗證信</button><p className="form-note">每 60 秒最多寄送一次；新連結建立後，舊連結立即失效。</p></form></div></main>;
}
