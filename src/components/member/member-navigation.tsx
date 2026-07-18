import Link from "next/link";

const items = [
  { href: "/account", label: "我的資料" },
  { href: "/requests", label: "我的預約" },
  { href: "/provider/properties", label: "我的房源" },
  { href: "/account/permissions", label: "身分與權限" },
];

export function MemberNavigation({ current }: { current: string }) {
  return <nav className="member-navigation" aria-label="會員中心">
    {items.map((item) => <Link className={current === item.href ? "is-current" : ""} aria-current={current === item.href ? "page" : undefined} href={item.href} key={item.href}>{item.label}</Link>)}
  </nav>;
}
