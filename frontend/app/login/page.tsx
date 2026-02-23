"use client";

import { API_BASE } from "@/lib/api";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<string | null>(null);
    const [loginType, setLoginType] = useState<"client" | "lawyer">("client");

    // ── 백엔드에 소셜 유저 등록/로그인 ──
    const registerSocialUser = async (provider: string, socialId: string, name: string, email: string | null) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/social/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider, social_id: socialId, name, email })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("client_user", JSON.stringify(data.user));
                alert(data.is_new
                    ? `환영합니다, ${data.user.name}님! 가입이 완료되었습니다.`
                    : `다시 오셨군요, ${data.user.name}님!`
                );
                router.push("/client/dashboard");
            } else {
                alert("소셜 로그인에 실패했습니다.");
            }
        } catch {
            alert("서버에 연결할 수 없습니다.");
        } finally {
            setSocialLoading(null);
        }
    };


    // ── 구글 로그인 (OAuth 팝업) ──
    const handleGoogleLogin = () => {
        setSocialLoading("google");

        const clientId = "535513893786-poqbcj7sbjetv41i0n0mspu5fkmtgp78";
        const redirectUri = encodeURIComponent(window.location.origin + "/oauth/callback");
        const scope = encodeURIComponent("openid email profile");
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}.apps.googleusercontent.com&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=select_account`;

        const w = 500, h = 600;
        const left = window.screenX + (window.outerWidth - w) / 2;
        const top = window.screenY + (window.outerHeight - h) / 2;
        const popup = window.open(authUrl, "google_login", `width=${w},height=${h},left=${left},top=${top}`);

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === "GOOGLE_LOGIN_SUCCESS") {
                window.removeEventListener("message", handleMessage);
                const { name, email, sub } = event.data.data;
                registerSocialUser("google", sub, name, email);
            } else if (event.data?.type === "GOOGLE_LOGIN_CANCEL") {
                window.removeEventListener("message", handleMessage);
                setSocialLoading(null);
            }
        };

        window.addEventListener("message", handleMessage);

        const checkClosed = setInterval(() => {
            if (!popup || popup.closed) {
                clearInterval(checkClosed);
                window.removeEventListener("message", handleMessage);
                setSocialLoading(null);
            }
        }, 500);
    };

    // ── 이메일/비밀번호 로그인 ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let url = `${API_BASE}/api/auth/client/login`;
            const body = { email: formData.email, password: formData.password };

            if (loginType === "lawyer") {
                url = `${API_BASE}/api/auth/login`;
            }

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();

                if (data.redirect_to === "/admin/dashboard") {
                    localStorage.setItem("admin_user", JSON.stringify(data.user));
                    localStorage.setItem("admin_token", data.token);
                    router.push("/admin/dashboard");
                } else if (data.redirect_to === "/lawyer/dashboard") {
                    localStorage.setItem("lawyer_user", JSON.stringify(data.lawyer));
                    alert(`환영합니다, ${data.lawyer.name} 변호사님!`);
                    if (!data.lawyer.verified) {
                        alert("현재 가입 심사 중입니다. 프로필이 검색 결과에 노출되지 않을 수 있습니다.");
                    }
                    router.push("/lawyer/dashboard");
                } else {
                    localStorage.setItem("client_user", JSON.stringify(data.user));
                    alert(`환영합니다, ${data.user.name}님!`);
                    router.push("/client/dashboard");
                }
            } else {
                alert("로그인 실패: 이메일 또는 비밀번호를 확인해주세요.");
            }
        } catch (error) {
            console.error(error);
            alert("서버 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background flex flex-col justify-center items-center p-6 font-sans">
            <div className="max-w-md w-full bg-white p-10 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-point/10">
                <div className="mb-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 relative mb-4 opacity-90">
                        <Image src="/logo.png" alt="Lawnald Logo" fill className="object-contain grayscale" />
                    </div>
                    <h1 className="text-2xl font-bold text-main mb-2 tracking-tight font-serif italic">
                        {loginType === "client" ? "의뢰인 로그인" : "변호사 로그인"}
                    </h1>
                </div>

                {/* Login Type Toggle */}
                <div className="flex p-1 bg-white border border-point/20 rounded-xl mb-8">
                    <button
                        onClick={() => setLoginType("client")}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${loginType === "client"
                            ? "bg-main text-white shadow-md shadow-main/20"
                            : "text-zinc-400 hover:text-main"
                            }`}
                    >
                        의뢰인
                    </button>
                    <button
                        onClick={() => setLoginType("lawyer")}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${loginType === "lawyer"
                            ? "bg-main text-white shadow-md shadow-main/20"
                            : "text-zinc-400 hover:text-main"
                            }`}
                    >
                        변호사
                    </button>
                </div>

                {/* 소셜 로그인 — 의뢰인 탭만 */}
                {loginType === "client" && (
                    <>
                        <div className="space-y-3 mb-6">

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={!!socialLoading}
                                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                            >
                                {socialLoading === "google" ? (
                                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-600" />
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 48 48">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                    </svg>
                                )}
                                Google로 로그인
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 h-px bg-zinc-200" />
                            <span className="text-xs text-zinc-400 font-medium">또는</span>
                            <div className="flex-1 h-px bg-zinc-200" />
                        </div>
                    </>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-2 ml-1">
                            {loginType === "client" ? "이메일" : "변호사 이메일 / 아이디"}
                        </label>
                        <input
                            type={loginType === "client" ? "email" : "text"}
                            required
                            className="w-full bg-white text-main p-4 rounded-2xl outline-none transition-all border border-point/20 focus:ring-2 focus:ring-point/20 focus:border-point placeholder:text-zinc-300 font-medium"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder={loginType === "client" ? "client@example.com" : "name@example.com"}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-2 ml-1">비밀번호</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-white text-main p-4 rounded-2xl outline-none transition-all border border-point/20 focus:ring-2 focus:ring-point/20 focus:border-point placeholder:text-zinc-300 font-medium"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-main text-white font-semibold text-sm py-4 rounded-2xl mt-4 hover:bg-main/90 active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg shadow-main/20"
                    >
                        {loading && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>}
                        로그인하기
                    </button>
                </form>

                {loginType === "client" && (
                    <div className="text-center mt-8 text-sm text-[#86868b] font-medium">
                        아직 계정이 없으신가요? <Link href="/signup" className="text-[#007aff] hover:underline ml-1">회원가입</Link>
                    </div>
                )}

                {loginType === "lawyer" && (
                    <div className="text-center mt-8 text-sm text-[#86868b] font-medium">
                        변호사 계정이 없으신가요? <Link href="/signup" className="text-[#007aff] hover:underline ml-1">변호사 가입신청</Link>
                    </div>
                )}

                <div className="text-center mt-4">
                    <Link href="/" className="text-xs text-[#86868b]/70 hover:text-[#86868b] transition-colors">메인으로 돌아가기</Link>
                </div>
            </div>
        </main>
    );
}
