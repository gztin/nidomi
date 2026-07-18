import Link from "next/link";

type AuthTab = "login" | "register";

export function AuthTabs({ active, next = "/" }: { active: AuthTab; next?: string }) {
  const loginHref = next && next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <nav className="auth-tabs" aria-label="帳號操作">
      <Link id="auth-login-tab" className={active === "login" ? "is-active" : undefined} href={loginHref} aria-current={active === "login" ? "page" : undefined}>
        登入
      </Link>
      <Link id="auth-register-tab" className={active === "register" ? "is-active" : undefined} href="/register" aria-current={active === "register" ? "page" : undefined}>
        註冊
      </Link>
    </nav>
  );
}
