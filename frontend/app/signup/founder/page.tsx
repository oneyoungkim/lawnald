"use client";

import { API_BASE } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FounderSignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        licenseId: "",
        firm: "",
        phone: ""
    });
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!licenseFile) {
            alert("변호사 자격증 사진을 업로드해주세요.");
            setLoading(false);
            return;
        }

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value);
            });
            data.append("licenseImage", licenseFile);

            const res = await fetch(`${API_BASE}/api/auth/signup/lawyer`, {
                method: "POST",
                body: data
            });

            const result = await res.json();

            if (res.ok) {
                setSuccess(true);
                if (result.is_founder) {
                    setTimeout(() => router.push("/"), 3000);
                } else {
                    alert("파운딩 멤버 300명이 마감되었습니다. 일반 변호사로 가입되었습니다.");
                    router.push("/");
                }
            } else {
                alert(`가입 실패: ${result.detail || "오류가 발생했습니다."}`);
            }
        } catch (error) {
            console.error(error);
            alert("서버 오류");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <main className="min-h-screen bg-[#0a0a0f] flex flex-col justify-center items-center p-6 relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6 relative z-10"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="text-7xl"
                    >
                        🎉
                    </motion.div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                            파운딩 멤버 가입 완료!
                        </h1>
                        <p className="text-white/50 text-lg">
                            🔥 HYPE 배지가 부여되었습니다
                        </p>
                    </div>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <div className="px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-300 text-sm font-medium">
                            ✓ 3개월 무료
                        </div>
                        <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-sm font-medium">
                            ✓ 평생 50% 할인
                        </div>
                        <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-sm font-medium">
                            ✓ HYPE 배지
                        </div>
                    </div>
                    <p className="text-white/30 text-sm">3초 후 메인 페이지로 이동합니다...</p>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.015)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

            <div className="max-w-lg w-full relative z-10 py-12 md:py-20">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-violet-600/20 to-blue-500/20 border border-violet-500/20 rounded-full text-xs font-bold text-violet-300 uppercase tracking-wider mb-6">
                        🔥 FOUNDING MEMBER · 선착순 300명
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
                        파운딩 멤버 전용 가입
                    </h1>
                    <p className="text-white/40 text-base leading-relaxed">
                        Lawnald의 첫 300명 변호사에게 드리는<br />특별한 혜택입니다.
                    </p>

                    {/* Benefits */}
                    <div className="flex justify-center gap-3 mt-6 flex-wrap">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                            <span className="text-emerald-400 text-xs">●</span>
                            <span className="text-white/60 text-sm font-medium">3개월 무료</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                            <span className="text-blue-400 text-xs">●</span>
                            <span className="text-white/60 text-sm font-medium">평생 50% 할인</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                            <span className="text-violet-400 text-xs">●</span>
                            <span className="text-white/60 text-sm font-medium">🔥 HYPE 배지</span>
                        </div>
                    </div>
                </motion.div>

                {/* Form Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 md:p-8"
                >
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-1.5">이름</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white/[0.04] border border-white/[0.08] text-white p-3 rounded-xl outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-white/20"
                                placeholder="홍길동"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-1.5">이메일 (아이디)</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-white/[0.04] border border-white/[0.08] text-white p-3 rounded-xl outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-white/20"
                                placeholder="lawyer@example.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-1.5">비밀번호</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-white/[0.04] border border-white/[0.08] text-white p-3 rounded-xl outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-white/20"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        {/* License Section */}
                        <div className="pt-4 border-t border-white/[0.06]">
                            <label className="block text-sm font-medium text-violet-400 mb-3">변호사 인증</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-white/40 mb-1">등록번호</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="예: 12345"
                                        className="w-full bg-violet-500/[0.06] border border-violet-500/[0.15] text-white p-3 rounded-xl outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-white/20 text-sm"
                                        value={formData.licenseId}
                                        onChange={e => setFormData({ ...formData, licenseId: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-white/40 mb-1">자격증 사진</label>
                                    <label className="flex items-center justify-center gap-2 w-full bg-violet-500/[0.06] border border-violet-500/[0.15] border-dashed p-3 rounded-xl cursor-pointer hover:bg-violet-500/[0.1] transition-colors">
                                        <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                        </svg>
                                        <span className="text-xs text-violet-300 font-medium">
                                            {licenseFile ? licenseFile.name.slice(0, 15) + "..." : "업로드"}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            required
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setLicenseFile(e.target.files[0]);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Firm & Phone */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1.5">소속</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/[0.04] border border-white/[0.08] text-white p-3 rounded-xl outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-white/20 text-sm"
                                    placeholder="법률사무소"
                                    value={formData.firm}
                                    onChange={e => setFormData({ ...formData, firm: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1.5">연락처</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="010-0000-0000"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] text-white p-3 rounded-xl outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-white/20 text-sm"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl mt-4 transition-all duration-300 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    가입 진행 중...
                                </span>
                            ) : (
                                "🔥 파운딩 멤버로 가입하기"
                            )}
                        </button>
                    </form>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-8 space-y-2"
                >
                    <p className="text-white/30 text-sm">
                        <Link href="/signup/lawyer" className="text-white/50 hover:text-white underline underline-offset-4 decoration-white/20 transition-colors">
                            일반 변호사 가입
                        </Link>
                        {" · "}
                        <Link href="/signup" className="text-white/50 hover:text-white underline underline-offset-4 decoration-white/20 transition-colors">
                            이전으로
                        </Link>
                    </p>
                </motion.div>
            </div>
        </main>
    );
}
