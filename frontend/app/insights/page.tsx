"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface BlogPost {
    id: string;
    title: string;
    summary: string;
    category: string;
    cover_image: string | null;
    tags: string[];
    created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    insights: "인사이트",
    "lawyer-spotlight": "변호사 스포트라이트",
    "legal-trends": "법률 트렌드",
    "platform-news": "플랫폼 소식",
};

const CATEGORY_COLORS: Record<string, string> = {
    insights: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "lawyer-spotlight": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "legal-trends": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "platform-news": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function InsightsPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/blog/posts")
            .then((r) => {
                if (!r.ok) throw new Error("fetch failed");
                return r.json();
            })
            .then((data) => setPosts(data))
            .catch((err) => {
                console.error("Failed to load blog posts:", err);
                setPosts([]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className="min-h-screen bg-[#070b14] text-white font-sans">
            {/* Hero Header */}
            <header className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b3e]/80 to-[#070b14]" />
                <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <img src="/logo.png" alt="Lawnald" className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-white/40 uppercase tracking-widest">
                            Lawnald Official
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-serif mb-4">
                        인사이트
                    </h1>
                    <p className="text-lg text-white/50 max-w-xl leading-relaxed">
                        로날드 에디터가 엄선한 법률 인사이트,<br />
                        우수 변호사 소개, 그리고 플랫폼 소식.
                    </p>
                </div>
            </header>

            {/* Posts Grid */}
            <section className="max-w-5xl mx-auto px-6 pb-20">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-white/30 text-sm">불러오는 중...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📝</div>
                        <p className="text-white/30 text-sm">아직 등록된 글이 없습니다</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {posts.map((post, idx) => (
                            <a
                                key={post.id}
                                href={`/insights/${post.id}`}
                                className={`group block rounded-[24px] border border-white/[0.06] overflow-hidden hover:border-white/15 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)] ${idx === 0 ? "md:col-span-2" : ""
                                    }`}
                            >
                                {post.cover_image && (
                                    <div className="aspect-[2.4/1] bg-white/5 overflow-hidden">
                                        <img
                                            src={post.cover_image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                )}
                                <div className="p-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${CATEGORY_COLORS[post.category] || "bg-white/5 text-white/50"}`}>
                                            {CATEGORY_LABELS[post.category] || post.category}
                                        </span>
                                        <span className="text-xs text-white/20">
                                            {new Date(post.created_at).toLocaleDateString("ko-KR", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                    <h2 className={`font-bold text-white group-hover:text-blue-300 transition-colors font-serif mb-3 ${idx === 0 ? "text-2xl md:text-3xl" : "text-xl"
                                        }`}>
                                        {post.title}
                                    </h2>
                                    <p className="text-sm text-white/40 leading-relaxed line-clamp-2">
                                        {post.summary}
                                    </p>
                                    {post.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {post.tags.slice(0, 4).map((tag) => (
                                                <span key={tag} className="text-[10px] text-white/20 bg-white/[0.03] px-2 py-1 rounded">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
