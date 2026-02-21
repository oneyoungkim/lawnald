"use client";

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

    const [loginType, setLoginType] = useState<"client" | "lawyer">("client");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let url = "http://localhost:8000/api/auth/client/login";
            let body = { email: formData.email, password: formData.password };

            // If Lawyer tab, use Lawyer Login (which transparently handles Admin)
            if (loginType === "lawyer") {
                url = "http://localhost:8000/api/auth/login";
            }

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();

                // Role Logic based on Backend Response
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
                    // Client Login
                    localStorage.setItem("client_user", JSON.stringify(data.user));
                    alert(`환영합니다, ${data.user.name}님!`);
                    router.push("/");
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
                        <Image
                            src="/logo.png"
                            alt="Lawnald Logo"
                            fill
                            className="object-contain grayscale"
                        />
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
                        아직 계정이 없으신가요? <Link href="/signup/client" className="text-[#007aff] hover:underline ml-1">회원가입</Link>
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
