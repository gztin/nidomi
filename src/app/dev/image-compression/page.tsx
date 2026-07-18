import Link from "next/link";
import { ImageCompressionTester } from "@/components/dev/image-compression-tester";

export default function ImageCompressionTestPage() {
  return <main className="compression-tool-page">
    <div className="compression-tool-shell">
      <header>
        <Link className="admin-brand" href="/">nidomi</Link>
        <p className="eyebrow">獨立測試工具</p>
        <h1>圖片壓縮測試</h1>
        <p>圖片只會在目前的瀏覽器中處理，不會上傳或保存至伺服器。</p>
      </header>
      <ImageCompressionTester />
    </div>
  </main>;
}
