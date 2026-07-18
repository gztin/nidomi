import Link from "next/link";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { RegistrationForm } from "@/components/member/registration-form";

export default function RegisterPage() {
  return (
    <main className="workflow-page">
      <div className="workflow-shell">
        <Link className="policy-back" href="/">← 返回首頁</Link>
        <p className="eyebrow">會員帳號</p>
        <h1>建立帳號</h1>
        <section className="auth-tabs-card">
          <AuthTabs active="register" />
          <RegistrationForm />
        </section>
      </div>
    </main>
  );
}
