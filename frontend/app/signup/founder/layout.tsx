import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "🔥 파운딩 멤버 모집 | Lawnald",
    description: "Lawnald 파운딩 멤버 선착순 300명 모집 중! 3개월 완전 무료 + 평생 50% 할인 + HYPE 배지 영구 부여. 지금 바로 가입하세요.",
    openGraph: {
        title: "🔥 파운딩 멤버 모집 — 선착순 300명",
        description: "3개월 무료 · 평생 50% 할인 · HYPE 배지 영구 부여. Lawnald의 첫 번째 변호사가 되어주세요.",
        url: "https://www.lawnald.com/signup/founder",
        siteName: "Lawnald",
        images: [
            {
                url: "https://www.lawnald.com/og-founder.png",
                width: 1200,
                height: 630,
                alt: "Lawnald 파운딩 멤버 모집",
            },
        ],
        locale: "ko_KR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "🔥 파운딩 멤버 모집 — 선착순 300명 | Lawnald",
        description: "3개월 무료 · 평생 50% 할인 · HYPE 배지 영구 부여",
        images: ["https://www.lawnald.com/og-founder.png"],
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function FounderSignupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
