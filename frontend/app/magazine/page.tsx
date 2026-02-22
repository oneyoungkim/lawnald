"use client";

import { API_BASE } from "@/lib/api";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import MagazineCard from "../components/magazine/MagazineCard";

interface Article {
    id: string;
    lawyer_id: string;
    lawyer_name: string;
    lawyer_firm: string;
    lawyer_image?: string;
    type: string;
    title: string;
    emotional_title?: string;
    summary: string;
    emotional_summary?: string;
    date: string;
    tags: string[];
    category_label?: string;
    key_issues?: string[];
    result_summary?: string;
    duration?: string;
    cover_image?: string;
}

export default function MagazinePage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeTab, setActiveTab] = useState("전체");
    const [searchQuery, setSearchQuery] = useState("");

    const categories = ["전체", "승소사례", "법률칼럼", "성범죄", "이혼", "부동산", "손해배상"];

    useEffect(() => {
        fetch(`${API_BASE}/api/magazine`)
            .then(res => res.json())
            .then(data => {
                setArticles(data);
            })
            .catch(err => {
                console.error(err);
                setError(true);
            })
            .finally(() => setLoading(false));
    }, []);

    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesTab = activeTab === "전체"
                || (activeTab === "승소사례" && article.type === 'case')
                || (activeTab === "법률칼럼" && article.type === 'column')
                || article.tags?.includes(activeTab)
                || article.category_label === activeTab;

            const matchesSearch = !searchQuery
                || article.title.toLowerCase().includes(searchQuery.toLowerCase())
                || article.emotional_title?.toLowerCase().includes(searchQuery.toLowerCase())
                || article.lawyer_name.includes(searchQuery);

            return matchesTab && matchesSearch;
        });
    }, [articles, activeTab, searchQuery]);

    return (
        <main className="min-h-screen bg-background font-sans">

            {/* Premium Header Section */}
            <header className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white to-background z-0" />

                <div className="relative z-10 max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <p className="text-sm font-bold text-point mb-4 tracking-[0.2em] uppercase">
                            Lawnald Premium Archive
                        </p>
                        <h1 className="text-4xl md:text-[56px] font-serif font-medium tracking-tight leading-tight text-main mb-6">
                            법률의 본질을<br className="md:hidden" /> 이야기합니다.
                        </h1>
                        <p className="text-lg text-zinc-500 max-w-2xl mx-auto font-light leading-relaxed">
                            광고성 키워드로 점철된 검색 결과 대신,<br className="hidden md:block" />
                            전문 변호사가 직접 기록한 승소의 과정을 읽어보세요.
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <div className="mt-12 max-w-xl mx-auto relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                            <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-main transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-4 border-none rounded-full bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] ring-1 ring-point/20 placeholder:text-zinc-400 focus:ring-2 focus:ring-main/20 focus:shadow-[0_8px_32px_rgba(0,0,0,0.08)] focus:outline-none transition-all duration-300 text-[16px] text-main"
                            placeholder="관심있는 사건이나 키워드를 검색해보세요"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Categories */}
                    <div className="mt-10 flex flex-wrap justify-center gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={`
                                    px-5 py-2.5 rounded-full text-[14px] font-medium transition-all duration-300
                                    ${activeTab === cat
                                        ? "bg-main text-white shadow-lg shadow-main/20 scale-105"
                                        : "bg-white text-zinc-500 shadow-sm hover:bg-point/5 hover:text-main hover:shadow-md border border-point/10"}
                                `}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Grid Content */}
            <section className="max-w-7xl mx-auto px-6 pb-32">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-96 bg-white rounded-2xl animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-lg text-zinc-400 mb-4">콘텐츠를 불러올 수 없습니다.</p>
                        <button onClick={() => window.location.reload()} className="text-main hover:underline font-medium">
                            새로고침
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-end mb-8 px-2 max-w-7xl mx-auto w-full">
                            <div className="text-sm font-semibold text-gray-400 tracking-wide uppercase">
                                Total {filteredArticles.length} Stories
                            </div>
                        </div>

                        {filteredArticles.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                                {filteredArticles.map((article, idx) => (
                                    <MagazineCard key={article.id} article={article} index={idx} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-32">
                                <p className="text-xl text-gray-400 font-light">검색 결과가 없습니다.</p>
                                <button
                                    onClick={() => { setSearchQuery(""); setActiveTab("전체"); }}
                                    className="mt-4 text-blue-600 hover:underline"
                                >
                                    전체 목록 보기
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}

