"use client";

import { API_BASE } from "@/lib/api";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${API_BASE}/api/admin/blog/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem("admin_token", data.token);
                localStorage.setItem("admin_user", data.username);
                router.push("/admin/dashboard");
            } else {
                setError(data.detail || "로그인에 실패했습니다");
            }
        } catch {
            setError("서버 연결에 실패했습니다");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#070b14] flex items-center justify-center px-6 font-sans">
            {/* Background gradient orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/[0.07] rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/[0.05] rounded-full blur-[120px]" />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.08)]">
                        <img src="/logo.png" alt="Lawnald" className="w-9 h-9" />
                    </div>
                    <h1 className="text-2xl font-bold text-white font-serif tracking-tight">
                        Lawnald Admin
                    </h1>
                    <p className="text-sm text-white/30 mt-2">관리자 전용 콘솔</p>
                </div>

                {/* Login Card */}
                <form
                    onSubmit={handleLogin}
                    className="bg-white/[0.03] rounded-[24px] border border-white/[0.08] p-8 backdrop-blur-sm space-y-5"
                >
                    <div>
                        <label className="block mb-2 text-xs font-bold text-white/40 uppercase tracking-widest">
                            아이디
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => { setUsername(e.target.value); setError(""); }}
                            placeholder="관리자 아이디"
                            autoFocus
                            autoComplete="username"
                            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/15 outline-none focus:border-blue-500/40 focus:bg-white/[0.08] transition-all"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-xs font-bold text-white/40 uppercase tracking-widest">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(""); }}
                            placeholder="비밀번호"
                            autoComplete="current-password"
                            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/15 outline-none focus:border-blue-500/40 focus:bg-white/[0.08] transition-all"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-xs">
                            <span>⚠</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !username || !password}
                        className="w-full py-3.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(59,130,246,0.2)]"
                    >
                        {loading ? "인증 중..." : "로그인"}
                    </button>
                </form>

                {/* Footer */}
                <div className="text-center mt-8">
                    <a href="/" className="text-xs text-white/20 hover:text-white/40 transition-colors">
                        ← 홈으로 돌아가기
                    </a>
                </div>
            </div>
        </main>
    );
}
