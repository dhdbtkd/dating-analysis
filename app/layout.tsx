import type { Metadata } from "next";
import "./globals.css";
import { Inter, Manrope } from 'next/font/google';
import { KakaoInit } from '@/components/KakaoInit';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata: Metadata = {
  title: "알고보면 보이는 나의 연애",
  description: "ECR 척도 기반 성인 애착 유형 측정 + LLM 심층 대화로 나의 연애 패턴을 탐색해보세요.",
  icons: { icon: '/favicon.png' },
  openGraph: {
    title: "알고보면 보이는 나의 연애",
    description: "ECR 척도 기반 성인 애착 유형 측정 + LLM 심층 대화로 나의 연애 패턴을 탐색해보세요.",
    images: [{ url: '/solo_ogimage.png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full ${inter.variable} ${manrope.variable}`}>
      <body className="min-h-[100dvh] flex flex-col relative">
          {children}
          <KakaoInit />
      </body>
    </html>
  );
}
