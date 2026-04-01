import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "당신도 몰랐던 나의 연애 패턴",
  description: "ECR 척도 기반 성인 애착 유형 측정 + LLM 심층 대화로 나의 연애 패턴을 탐색해보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col relative">{children}</body>
    </html>
  );
}
