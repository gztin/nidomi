import Link from "next/link";
import { getCurrentUser } from "@/features/auth/session";

export async function SiteHeader() {
  const user=await getCurrentUser();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="nidomi 首頁">
          nidomi
        </Link>
        <nav aria-label="主要導覽">
          <a href="#fees">費用</a>
          <a href="#details">設備與條件</a>
          <a href="#viewing">約看</a>
          <span className="nav-divider" aria-hidden="true" />
          {user?<>{user.role === "member" && <><Link href="/requests">我的預約</Link><Link href="/provider/properties">我的房源</Link></>}<Link href={user.role === "admin" ? "/admin/account" : "/account"}>{user.displayName}</Link><form action="/api/auth/logout" method="post"><button className="nav-logout" type="submit">登出</button></form></>:<Link href="/login">登入</Link>}
        </nav>
      </div>
    </header>
  );
}
