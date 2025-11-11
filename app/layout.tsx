import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "브랜드 비용 대시보드",
  description: "MLB, MLB Kids, Discovery, 공통 브랜드별 비용 분석 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

