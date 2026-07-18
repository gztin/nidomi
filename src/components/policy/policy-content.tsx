import type { ReactNode } from "react";

export function PolicyContent({ markdown }: { markdown: string }) {
  const hiddenMetadata = ["- 文件版本：", "- 更新日期：", "- 生效日期：", "- 營運者：", "- 地址：", "- 客服／法律通知信箱："];
  const lines = markdown.split("\n").filter((line) => !hiddenMetadata.some((prefix) => line.trim().startsWith(prefix)));
  const nodes: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => { if (bullets.length) { nodes.push(<ul key={`ul-${nodes.length}`}>{bullets.map((item) => <li key={item}>{item}</li>)}</ul>); bullets = []; } };
  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    if (line.startsWith("- ")) { bullets.push(line.slice(2)); return; }
    flush();
    if (line.startsWith("### ")) nodes.push(<h3 key={nodes.length}>{line.slice(4)}</h3>);
    else if (line.startsWith("## ")) nodes.push(<h2 key={nodes.length}>{line.slice(3)}</h2>);
    else if (line.startsWith("# ")) nodes.push(<h1 key={nodes.length}>{line.slice(2)}</h1>);
    else if (line.startsWith("> ")) nodes.push(<aside key={nodes.length}>{line.slice(2)}</aside>);
    else nodes.push(<p key={nodes.length}>{line}</p>);
  });
  flush();
  return <article className="policy-document">{nodes}</article>;
}
