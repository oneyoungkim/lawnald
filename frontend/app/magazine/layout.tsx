import { Metadata } from "next";

export const metadata: Metadata = {
    title: "법률 매거진 | 로날드",
    description:
        "전문 변호사가 직접 작성한 승소사례와 법률칼럼. 실제 판결에 기반한 법률 인사이트를 확인하세요.",
    openGraph: {
        title: "법률 매거진 | 로날드",
        description:
            "전문 변호사가 직접 기록한 승소의 과정을 읽어보세요.",
        url: "https://lawnald.com/magazine",
    },
};

export default function MagazineLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
