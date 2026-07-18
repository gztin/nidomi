import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <strong>nidomi</strong>
          <p>讓房源資訊與約看流程更透明。</p>
        </div>
        <nav aria-label="政策文件">
          <Link href="/terms">服務條款</Link>
          <Link href="/privacy">隱私權政策</Link>
          <Link href="/member-rules">會員規則</Link>
        </nav>
      </div>
    </footer>
  );
}
