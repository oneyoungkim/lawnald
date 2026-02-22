"use client";

import { API_BASE } from "@/lib/api";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, PlayCircleIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function YouTubeRegisterPage() {
    const router = useRouter();
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [tags, setTags] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStep("영상 자막을 추출하고 있습니다...");

        const stored = localStorage.getItem("lawyer_user");
        let lawyerId = "lawyer1@example.com";
        if (stored) {
            lawyerId = JSON.parse(stored).id;
        }

        try {
            setTimeout(() => setStep("AI가 자막을 분석하고 있습니다..."), 3000);
            setTimeout(() => setStep("변호사 말투로 매거진 글을 작성 중..."), 8000);
            setTimeout(() => setStep("SEO 최적화 및 매거진 등록 중..."), 15000);

            const res = await fetch(`${API_BASE}/api/lawyers/${lawyerId}/content`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "youtube",
                    title: title || "유튜브 영상",
                    url: url,
                    tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : []
                })
            });

            if (res.ok) {
                const data = await res.json();
                setStep("");
                alert(
                    `✅ 유튜브 영상이 매거진에 등록되었습니다!\n\n` +
                    `AI가 영상 내용을 변호사님의 말투 그대로 매거진 글로 변환했습니다.\n` +
                    `제목: ${data.title || title}\n` +
                    `매거진에서 확인해주세요.`
                );
                router.push("/lawyer/dashboard");
            } else {
                const err = await res.json();
                alert(`등록 실패: ${err.detail}`);
            }
        } catch (error) {
            console.error(error);
            alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setLoading(false);
            setStep("");
        }
    };

    return (
        <main className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1d1d1f] dark:text-gray-100 p-6 md:p-12 font-sans">
            <header className="max-w-2xl mx-auto mb-8">
                <Link href="/lawyer/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" /> 대시보드로 돌아가기
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <PlayCircleIcon className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">유튜브 → 매거진 자동 변환</h1>
                </div>
                <p className="text-[#86868b] leading-relaxed">
                    유튜브 영상 링크만 입력하면 AI가 자동으로 자막을 추출하고,<br />
                    <strong className="text-[#1d1d1f]">변호사님의 말투 그대로</strong> 매거진 글로 변환하여 게시합니다.
                </p>
            </header>

            <div className="max-w-2xl mx-auto bg-white dark:bg-[#1c1c1e] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                {/* How it works */}
                <div className="mb-8 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                        <SparklesIcon className="w-5 h-5 text-violet-600" />
                        <span className="text-sm font-bold text-violet-700">작동 방식</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs text-center text-gray-600">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">🔗</span>
                            <span>URL 입력</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">📝</span>
                            <span>자막 추출</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">🤖</span>
                            <span>AI 변환</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">📰</span>
                            <span>매거진 게시</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            유튜브 URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all font-mono text-sm"
                            placeholder="https://youtu.be/... 또는 https://www.youtube.com/watch?v=..."
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-400 mt-1.5">
                            자막이 없는 영상도 자동 자막(Auto Caption)을 추출합니다
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            영상 제목 <span className="text-gray-400 font-normal">(선택 — AI가 자동 생성)</span>
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-[#F5F5F7] dark:bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                            placeholder="비워두면 AI가 자동으로 제목을 생성합니다"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">
                            관련 태그 <span className="text-gray-400 font-normal">(선택 — AI가 자동 추출)</span>
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-[#F5F5F7] dark:bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                            placeholder="이혼, 재산분할, 위자료 (쉼표로 구분)"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="pt-4">
                        {loading && step && (
                            <div className="mb-4 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <div className="relative">
                                    <div className="w-6 h-6 border-2 border-blue-200 rounded-full" />
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0" />
                                </div>
                                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">{step}</span>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={loading || !url.trim()}
                            className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    AI 변환 중... (최대 30초)
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5" />
                                    AI 매거진 변환 시작
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
