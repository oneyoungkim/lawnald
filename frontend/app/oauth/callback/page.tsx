"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CallbackContent() {
    const params = useSearchParams();

    useEffect(() => {
        // Google OAuth implicit flow: access_token is in the URL hash
        const hash = window.location.hash.substring(1);
        const urlParams = new URLSearchParams(hash);
        const accessToken = urlParams.get("access_token");

        if (accessToken) {
            // Google access token 으로 프로필 조회
            fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
                .then(res => res.json())
                .then(profile => {
                    if (window.opener) {
                        window.opener.postMessage({
                            type: "GOOGLE_LOGIN_SUCCESS",
                            data: {
                                sub: profile.sub,
                                name: profile.name || profile.email?.split("@")[0] || "Google 사용자",
                                email: profile.email || null,
                            }
                        }, "*");
                        window.close();
                    }
                })
                .catch(() => {
                    if (window.opener) {
                        window.opener.postMessage({ type: "GOOGLE_LOGIN_CANCEL" }, "*");
                        window.close();
                    }
                });
        } else {
            // 에러 또는 취소
            const error = params.get("error");
            if (error && window.opener) {
                window.opener.postMessage({ type: "GOOGLE_LOGIN_CANCEL" }, "*");
                window.close();
            }
        }
    }, [params]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <span className="animate-spin inline-block rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4" />
                <p className="text-sm text-gray-500">로그인 처리 중...</p>
            </div>
        </div>
    );
}

export default function OAuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <span className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-400" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
