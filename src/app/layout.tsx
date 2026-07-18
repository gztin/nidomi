import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "nidomi｜透明、好預約的租屋體驗",
  description: "查看完整租屋費用、設備與條件，線上選擇房源提供者開放的約看時段。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
