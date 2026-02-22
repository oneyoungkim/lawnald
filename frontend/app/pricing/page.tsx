"use client";

import { API_BASE } from "@/lib/api";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STANDARD_PRICE = 200000;
const FOUNDER_PRICE = 100000;

export default function PricingPage() {
    const router = useRouter();
    const [lawyerId, setLawyerId] = useState<string | null>(null);
    const [activating, setActivating] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [contentCount, setContentCount] = useState<number>(0);

    const [founderData, setFounderData] = useState<{
        remaining_slots: number;
        total_lawyers: number;
        founder_limit: number;
        is_open: boolean;
    } | null>(null);

    // 로그인 상태 확인
    useEffect(() => {
        try {
            const stored = localStorage.getItem("lawyer");
            if (stored) {
                const parsed = JSON.parse(stored);
                setLawyerId(parsed.id || null);
                // 콘텐츠 수 세기
                const items = parsed.content_items || [];
                setContentCount(items.length);
            }
        } catch { /* not logged in */ }
    }, []);

    useEffect(() => {
        fetch("${API_BASE}/api/billing/founder-count")
            .then((res) => res.json())
            .then(setFounderData)
            .catch(() =>
                setFounderData({
                    remaining_slots: 287,
                    total_lawyers: 13,
                    founder_limit: 300,
                    is_open: true,
                })
            );
    }, []);

    const remaining = founderData?.remaining_slots ?? 0;
    const total = founderData?.total_lawyers ?? 0;
    const progress = founderData
        ? ((founderData.founder_limit - remaining) / founderData.founder_limit) * 100
        : 0;

    // 구독 활성화 핸들러
    const handleActivate = async (plan: "founder" | "standard") => {
        if (!lawyerId) {
            router.push("/signup/lawyer");
            return;
        }

        setActivating(true);
        try {
            const endpoint = plan === "founder" ? "activate-founder" : "activate-standard";
            const res = await fetch(`${API_BASE}/api/billing/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lawyer_id: lawyerId }),
            });
            const data = await res.json();

            if (res.ok) {
                setSuccessMessage(data.message);
                // 3초 후 대시보드로 이동
                setTimeout(() => router.push("/lawyer/dashboard"), 2500);
            } else {
                alert(data.detail || "활성화에 실패했습니다");
            }
        } catch {
            alert("서버 연결에 실패했습니다");
        } finally {
            setActivating(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-800">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link
                        href="/"
                        className="font-serif italic font-black text-xl text-[#1d1d1f] dark:text-white"
                    >
                        Lawnald.
                    </Link>
                    {lawyerId ? (
                        <Link
                            href="/lawyer/dashboard"
                            className="text-sm font-semibold text-white bg-[#1d1d1f] dark:bg-white dark:text-black px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                        >
                            대시보드로 돌아가기
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="text-sm font-semibold text-white bg-[#1d1d1f] dark:bg-white dark:text-black px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                        >
                            로그인
                        </Link>
                    )}
                </div>
            </header>

            {/* 활성화 성공 토스트 */}
            {successMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-[#1d1d1f] text-white px-8 py-4 rounded-2xl shadow-2xl animate-[slideDown_0.3s_ease-out] flex items-center gap-3">
                    <span className="text-2xl">🎉</span>
                    <div>
                        <div className="font-bold text-sm">{successMessage}</div>
                        <div className="text-xs text-white/60 mt-0.5">잠시 후 대시보드로 이동합니다...</div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-6 py-20">
                {/* Hero */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 px-4 py-2 rounded-full text-sm font-bold mb-6 animate-pulse">
                        <span>🔥</span>
                        <span>창립 멤버 선착순 모집 중</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-[#1d1d1f] dark:text-white tracking-tight mb-6 font-serif">
                        실력을 증명하는<br />
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            가장 확실한 방법
                        </span>
                    </h1>
                    <p className="text-lg text-[#86868b] max-w-2xl mx-auto leading-relaxed">
                        로날드에 등록하면 AI가 판결문에서 승소사례를 자동 생성하고,
                        <br className="hidden md:block" />
                        의뢰인과의 매칭부터 상담 관리까지 한 번에 해결됩니다.
                    </p>
                </div>

                {/* FOMO Counter */}
                <div className="max-w-xl mx-auto mb-16">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-100 dark:border-zinc-800 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center">
                        <div className="text-sm font-bold text-[#86868b] uppercase tracking-widest mb-3">
                            파운딩 멤버 현황
                        </div>
                        <div className="flex items-baseline justify-center gap-2 mb-4">
                            <span className="text-5xl font-bold text-[#1d1d1f] dark:text-white tabular-nums">
                                {remaining}
                            </span>
                            <span className="text-lg text-[#86868b]">자리 남음</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-3 mb-3 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="text-xs text-[#86868b]">
                            300명 중 <span className="font-bold text-[#1d1d1f] dark:text-white">{total}명</span> 가입 완료
                        </div>
                        {remaining <= 50 && remaining > 0 && (
                            <div className="mt-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm font-semibold animate-pulse">
                                ⚡ 마감 임박! 소수 자리만 남았습니다
                            </div>
                        )}
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
                    {/* Standard Plan */}
                    <div className="bg-white dark:bg-zinc-900 rounded-[28px] p-10 border border-gray-100 dark:border-zinc-800 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-[#86868b] uppercase tracking-widest mb-2">
                                Standard
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-[#1d1d1f] dark:text-white">
                                    {STANDARD_PRICE.toLocaleString()}
                                </span>
                                <span className="text-[#86868b]">원/월</span>
                            </div>
                            <p className="text-sm text-[#86868b] mt-2">14일 무료 체험 후 결제</p>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                "AI 판결문 → 승소사례 자동 변환",
                                "AI 변호사 매칭 시스템 등록",
                                "실시간 의뢰인 상담 채팅",
                                "CRM 상담 관리 대시보드",
                                "매거진 & 블로그 자동 SEO",
                                "월간 마켓 인사이트 리포트",
                            ].map((feature) => (
                                <li key={feature} className="flex items-start gap-3 text-sm text-[#1d1d1f] dark:text-gray-300">
                                    <span className="text-blue-500 mt-0.5">✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleActivate("standard")}
                            disabled={activating}
                            className="w-full py-4 rounded-xl text-center font-semibold text-sm bg-gray-100 dark:bg-zinc-800 text-[#1d1d1f] dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                        >
                            {activating ? "처리 중..." : lawyerId ? "스탠다드 구독 시작하기" : "14일 무료 체험 시작"}
                        </button>
                    </div>

                    {/* Founder Plan */}
                    <div className="relative bg-[#1d1d1f] rounded-[28px] p-10 text-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex flex-col ring-2 ring-blue-500/50">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                                🚀 Founding Member
                            </span>
                        </div>

                        <div className="mb-8 mt-2">
                            <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-2">
                                Founder
                            </h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg text-white/40 line-through">
                                    {STANDARD_PRICE.toLocaleString()}원
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-4xl font-bold text-white">
                                    {FOUNDER_PRICE.toLocaleString()}
                                </span>
                                <span className="text-white/60">원/월</span>
                                <span className="ml-2 bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold">
                                    50% OFF 평생
                                </span>
                            </div>
                            <p className="text-sm text-white/50 mt-2">
                                6개월 무료 체험 + 이후 평생 반값
                            </p>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                "Standard 플랜의 모든 기능",
                                "6개월 완전 무료 체험",
                                "체험 종료 후 평생 50% 할인",
                                "파운딩 멤버 전용 뱃지 표시",
                                "신규 기능 우선 체험 (Early Access)",
                                "VIP 1:1 온보딩 지원",
                            ].map((feature) => (
                                <li key={feature} className="flex items-start gap-3 text-sm text-white/90">
                                    <span className="text-blue-400 mt-0.5">✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleActivate("founder")}
                            disabled={activating || (!!lawyerId && contentCount < 10)}
                            className="w-full py-4 rounded-xl text-center font-semibold text-sm bg-white text-[#1d1d1f] hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {activating
                                ? "처리 중..."
                                : lawyerId
                                    ? contentCount < 10
                                        ? `콘텐츠 ${10 - contentCount}개 더 등록 필요`
                                        : "파운딩 멤버 혜택 활성화 →"
                                    : "파운딩 멤버로 가입하기 →"}
                        </button>

                        {/* 콘텐츠 업로드 진행률 (로그인 상태에서만) */}
                        {lawyerId && contentCount < 10 && (
                            <div className="mt-4 text-center">
                                <div className="w-full bg-white/10 rounded-full h-2 mb-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-500"
                                        style={{ width: `${(contentCount / 10) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs text-white/40">
                                    승소사례·칼럼 <span className="text-white/80 font-bold">{contentCount}/10</span>개 등록
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-center text-[#1d1d1f] dark:text-white mb-10 font-serif">
                        자주 묻는 질문
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "파운딩 멤버 혜택은 정말 평생 유지되나요?",
                                a: "네, 선착순 300명 이내로 가입한 파운딩 멤버는 구독을 유지하는 한 월 정가 20만 원의 50% 할인인 10만 원에 영구적으로 이용하실 수 있습니다.",
                            },
                            {
                                q: "6개월 무료 체험 중 카드 등록이 필요한가요?",
                                a: "아닙니다. 무료 체험 기간에는 결제 정보 입력 없이 모든 기능을 자유롭게 사용하실 수 있습니다. 체험 종료 전 카드를 등록하시면 자동으로 할인 가격이 적용됩니다.",
                            },
                            {
                                q: "체험 기간이 끝나면 자동 결제되나요?",
                                a: "카드를 등록하지 않으면 자동 결제가 일어나지 않습니다. 체험 종료 시 구독이 일시 정지되며, 원하실 때 다시 활성화할 수 있습니다.",
                            },
                            {
                                q: "중도 해지가 가능한가요?",
                                a: "물론입니다. 언제든 대시보드에서 구독을 해지할 수 있으며, 해지 즉시 다음 결제일부터 과금이 중단됩니다.",
                            },
                        ].map((item, idx) => (
                            <details
                                key={idx}
                                className="group bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden"
                            >
                                <summary className="flex items-center justify-between p-6 cursor-pointer text-[#1d1d1f] dark:text-white font-semibold text-sm hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    {item.q}
                                    <span className="text-[#86868b] group-open:rotate-45 transition-transform text-xl">
                                        +
                                    </span>
                                </summary>
                                <div className="px-6 pb-6 text-sm text-[#86868b] leading-relaxed">
                                    {item.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
