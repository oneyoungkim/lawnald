"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, FunnelIcon, BookOpenIcon } from "@heroicons/react/24/outline";

interface DeidCasePublic {
    id: string;
    title: string;
    summary: string;
    tags: string[];
    field: string;
    result: string;
    view_count: number;
    approved_at: string;
    description: string;
}

export default function CaseArchivePage() {
    const [cases, setCases] = useState<DeidCasePublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedField, setSelectedField] = useState<string | null>(null);

    const FIELDS = ["형사", "이혼", "상속", "부동산", "민사", "행정"];

    const fetchCases = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE}/api/cases/archive`;
            const params = new URLSearchParams();
            if (searchQuery) params.append("query", searchQuery);
            if (selectedField) params.append("field", selectedField);

            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setCases(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCases();
    }, [selectedField]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCases();
    };

    return (
        <main className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1d1d1f] dark:text-gray-100 p-6 md:p-12 font-sans">
            <header className="max-w-7xl mx-auto mb-16 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                    Winning Case Archive
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                    데이터로 증명된 승소의 기록
                </h1>
                <p className="text-lg text-[#86868b] max-w-2xl mx-auto">
                    전국 변호사들의 검증된 승소 사례를 탐색하고,<br className="hidden md:block" /> 유사 사건의 판결 경향과 법리적 전략을 연구하세요.
                </p>
            </header>

            <div className="max-w-7xl mx-auto">
                {/* Search & Filter */}
                <div className="mb-10 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-10 bg-background/80 backdrop-blur-md py-4 transition-all">
                    {/* Field Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                        <button
                            onClick={() => setSelectedField(null)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${selectedField === null
                                ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-black shadow-md"
                                : "bg-white dark:bg-[#1c1c1e] text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                }`}
                        >
                            전체
                        </button>
                        {FIELDS.map(f => (
                            <button
                                key={f}
                                onClick={() => setSelectedField(f)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${selectedField === f
                                    ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-black shadow-md"
                                    : "bg-white dark:bg-[#1c1c1e] text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative w-full md:w-96">
                        <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="키워드, 쟁점, 사건유형 검색"
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 transition-shadow"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-gray-200 dark:bg-zinc-800 rounded-[28px]"></div>
                        ))}
                    </div>
                ) : cases.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpenIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">검색 결과가 없습니다.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cases.map((c) => (
                            <article key={c.id} className="group bg-white dark:bg-[#1c1c1e] p-7 rounded-[28px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg uppercase tracking-wide">
                                        {c.field}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${c.result === '승소' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-50'
                                        }`}>
                                        {c.result}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold mb-3 leading-snug group-hover:text-[#007aff] transition-colors line-clamp-2">
                                    {c.title}
                                </h3>

                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed flex-1">
                                    {c.summary}
                                </p>

                                <div className="flex flex-wrap gap-2 mt-auto">
                                    {c.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-xs text-gray-400 font-medium">#{tag}</span>
                                    ))}
                                    {c.tags.length > 3 && <span className="text-xs text-gray-400 font-medium">+{c.tags.length - 3}</span>}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
