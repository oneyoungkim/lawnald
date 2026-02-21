import { Metadata } from "next";

export const metadata: Metadata = {
    title: "로그인 | 로날드",
    description: "로날드에 로그인하여 AI 변호사 매칭 서비스를 이용하세요.",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
