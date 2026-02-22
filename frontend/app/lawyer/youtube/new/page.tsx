"use client";

import { API_BASE } from "@/lib/api";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, PlayCircleIcon } from "@heroicons/react/24/outline";

export default function YouTubeRegisterPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [tags, setTags] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Get lawyer_id from local storage mock
        const stored = localStorage.getItem("lawyer_user");
        let lawyerId = "lawyer1@example.com";
        if (stored) {
            lawyerId = JSON.parse(stored).id;
        }

        try {
            const res = await fetch(`${API_BASE}/api/lawyers/${lawyerId}/content`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "youtube",
                    title: title,
                    url: url,
                    tags: tags.split(",").map(t => t.trim()).filter(Boolean)
                })
            });

            if (res.ok) {
                alert("유튜브 영상이 등록되었습니다.\nAI가 내용을 요약하여 매거진에 반영합니다.");
                router.push("/lawyer/dashboard");
            } else {
                const err = await res.json();
                alert(`등록 실패: ${err.detail}`);
            }
        } catch (error) {
            console.error(error);
            alert("서버 오류가 발생했습니다.");
        } finally {
            setLoading(false);
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
                    <h1 className="text-3xl font-bold tracking-tight">유튜브 영상 등록</h1>
                </div>
                <p className="text-[#86868b]">
                    운영 중인 유튜브 채널의 영상을 등록하세요. 검색 적합도에 가산점(+1점)이 부여되며, 매거진 섹션에 노출됩니다.
                </p>
            </header>

            <div className="max-w-2xl mx-auto bg-white dark:bg-[#1c1c1e] rounded-[24px] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2">영상 제목</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-[#F5F5F7] dark:bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                            placeholder="예: 이혼 소송 시 재산분할 꿀팁 3가지"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">유튜브 URL</label>
                        <input
                            type="url"
                            required
                            className="w-full px-4 py-3 bg-white border border-point/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-point/20 transition-all font-mono text-sm"
                            placeholder="https://youtu.be/..."
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            * AI가 영상 내용을 자동으로 500자 내외로 요약합니다.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">관련 태그 (쉼표로 구분)</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-[#F5F5F7] dark:bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                            placeholder="이혼, 재산분할, 위자료"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#ff0000] hover:bg-[#cc0000] text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                "등록 중..."
                            ) : (
                                <>
                                    <span>영상 등록하기</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
