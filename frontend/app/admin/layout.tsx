"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    // /admin 로그인 페이지는 보호하지 않음
    const isLoginPage = pathname === "/admin";

    useEffect(() => {
        if (isLoginPage) {
            setAuthorized(true);
            setChecking(false);
            return;
        }

        const token = localStorage.getItem("admin_token");
        if (!token) {
            router.replace("/admin");
            return;
        }

        // 토큰 서버 검증
        fetch("http://localhost:8000/api/admin/blog/auth/verify", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) {
                    setAuthorized(true);
                } else {
                    localStorage.removeItem("admin_token");
                    localStorage.removeItem("admin_user");
                    router.replace("/admin");
                }
            })
            .catch(() => {
                // 서버 연결 실패 시에도 토큰이 있으면 일단 허용
                setAuthorized(true);
            })
            .finally(() => setChecking(false));
    }, [pathname, isLoginPage, router]);

    if (checking && !isLoginPage) {
        return (
            <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-white/30 text-sm">인증 확인 중...</span>
                </div>
            </div>
        );
    }

    if (!authorized && !isLoginPage) {
        return null;
    }

    return <>{children}</>;
}
