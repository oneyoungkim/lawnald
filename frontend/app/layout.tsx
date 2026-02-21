import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SecurityGuard from "./components/SecurityGuard";


const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://lawnald.com"),
  title: "로날드 | AI 변호사 매칭",
  description: "유사 사건 경험과 실제 사건 기록을 기준으로 변호사를 추천합니다.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "로날드 | AI 변호사 매칭",
    description: "유사 사건 경험과 실제 사건 기록을 기준으로 변호사를 추천합니다.",
    url: "https://lawnald.com",
    siteName: "로날드 (Lawnald)",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "로날드 | AI 변호사 매칭",
    description: "유사 사건 경험과 실제 사건 기록을 기준으로 변호사를 추천합니다.",
  },
  icons: {
    icon: "/icon-v2.png",
    shortcut: "/icon-v2.png",
    apple: "/icon-v2.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/icon-v2.png",
    },
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200;300;400;500;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`antialiased bg-background text-foreground font-sans selection:bg-point/30 selection:text-foreground`}
      >{children}<SecurityGuard /></body>
    </html>
  );
}
