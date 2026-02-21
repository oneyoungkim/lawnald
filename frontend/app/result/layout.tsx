import { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI 변호사 추천 결과 | 로날드",
    description:
        "AI가 분석한 당신의 사건에 가장 적합한 변호사 추천 결과를 확인하세요.",
    openGraph: {
        title: "AI 변호사 추천 결과 | 로날드",
        description:
            "AI가 분석한 사건에 가장 적합한 변호사를 추천합니다.",
    },
};

export default function ResultLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
