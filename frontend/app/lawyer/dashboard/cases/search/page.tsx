"use client";

import { API_BASE } from "@/lib/api";

import { useState } from "react";
import { MagnifyingGlassIcon, DocumentTextIcon, UserIcon } from "@heroicons/react/24/outline";

interface SimilarCase {
    id: string;
    lawyer_id: string;
    lawyer_name: string;
    title: string;
    content_summary: string;
    case_number: string;
    court: string;
    ai_tags: string;
    similarity: number;
}

export default function CaseSearchPage() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SimilarCase[]>([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        try {
            const res = await fetch(`${API_BASE}/api/cases/search-similar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, top_k: 10, threshold: 0.4 }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "검색 실패");
            }

            const data = await res.json();
            setResults(data.results || []);
        } catch (err: any) {
            console.error(err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold font-serif text-zinc-900 dark:text-white mb-3">
                    유사 판례 검색
                </h1>
                <p className="text-zinc-500 text-lg">
                    사건개요를 입력하면 로날드에 등록된 유사 승소사례를 AI가 찾아드립니다.
                </p>
            </header>

            {/* Search Box */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none p-8 mb-8">
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">
                    사건 개요 입력
                </label>
                <textarea
                    className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-base leading-relaxed border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all outline-none min-h-[150px] resize-none"
                    placeholder="예: 의뢰인이 음주운전으로 2차 적발되었습니다. 혈중알코올 0.12%, 사고 없음, 초범 시 벌금형 전력이 있습니다."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSearch();
                        }
                    }}
                />
                <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-zinc-400">
                        Shift+Enter로 줄바꿈 · Enter로 검색
                    </p>
                    <button
                        onClick={handleSearch}
                        disabled={loading || !query.trim()}
                        className={`px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 ${loading || !query.trim() ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                    >
                        {loading ? (
                            <>
                                <span className="w-2 h-2 bg-white dark:bg-zinc-900 rounded-full animate-ping" />
                                검색 중...
                            </>
                        ) : (
                            <>
                                <MagnifyingGlassIcon className="w-5 h-5" />
                                유사 판례 검색
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Results */}
            {searched && (
                <div className="space-y-4">
                    {results.length === 0 ? (
                        <div className="text-center py-16 text-zinc-400">
                            <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="font-bold text-lg">유사한 판례를 찾지 못했습니다</p>
                            <p className="text-sm mt-1">더 자세한 사건개요를 입력해보세요.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-zinc-500 font-bold mb-4">
                                🔍 {results.length}건의 유사 판례를 찾았습니다
                            </p>
                            {results.map((result, idx) => (
                                <div
                                    key={result.id}
                                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                                                    유사도 {Math.round(result.similarity * 100)}%
                                                </span>
                                                <span className="text-xs text-zinc-400">#{idx + 1}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                                                {result.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                                        {result.content_summary}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                                        <span className="flex items-center gap-1">
                                            <UserIcon className="w-3.5 h-3.5" />
                                            {result.lawyer_name || "변호사"}
                                        </span>
                                        {result.court && <span>📍 {result.court}</span>}
                                        {result.ai_tags && (
                                            <div className="flex gap-1 flex-wrap">
                                                {result.ai_tags.split(",").slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                                        {tag.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
