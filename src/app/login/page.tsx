import Link from "next/link";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { PasswordField } from "@/components/form/password-field";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;

  return (
    <main className="workflow-page">
      <div className="workflow-shell">
        <Link className="policy-back" href="/">← 返回首頁</Link>
        <p className="eyebrow">會員帳號</p>
        <h1>歡迎回來</h1>
        <section className="auth-tabs-card">
          <AuthTabs active="login" next={next} />
          <form id="auth-login-panel" className="verification-form auth-form" action="/api/auth/login" method="post" role="tabpanel" aria-labelledby="auth-login-tab">
            <input type="hidden" name="next" value={next} />
            <label>Email<input name="email" type="email" required /></label>
            <PasswordField label="密碼" name="password" required />
            <button className="button button-primary" type="submit">登入</button>
          </form>
        </section>
      </div>
    </main>
  );
}
