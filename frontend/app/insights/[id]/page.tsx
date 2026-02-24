"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import AdminPostActions from "./AdminPostActions";

interface FeaturedLawyer {
    id: string;
    name: string;
    firm: string;
    location: string;
    expertise: string[];
    imageUrl: string | null;
    cutoutImageUrl: string | null;
    introduction_short: string | null;
}

interface PostDetail {
    id: string;
    title: string;
    content: string;
    summary: string;
    category: string;
    cover_image: string | null;
    featured_lawyer_id: string | null;
    featured_lawyer: FeaturedLawyer | null;
    tags: string[];
    author: string;
    author_image: string;
    created_at: string;
    updated_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    insights: "인사이트",
    "lawyer-spotlight": "변호사 스포트라이트",
    "legal-trends": "법률 트렌드",
    "platform-news": "플랫폼 소식",
};

export default function InsightDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const [post, setPost] = useState<PostDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        params.then(({ id }) => {
            fetch(`/api/admin/blog/posts/${id}`, { cache: "no-store" })
                .then((r) => {
                    if (!r.ok) { setNotFound(true); return null; }
                    return r.json();
                })
                .then((data) => { if (data) setPost(data); })
                .catch(() => setNotFound(true))
                .finally(() => setLoading(false));
        });
    }, [params]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/30 text-sm">불러오는 중...</p>
                </div>
            </main>
        );
    }

    if (notFound || !post) {
        return (
            <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="text-2xl font-bold mb-2">글을 찾을 수 없습니다</h1>
                    <Link href="/insights" className="text-blue-400 text-sm hover:underline">← 목록으로</Link>
                </div>
            </main>
        );
    }

    const lawyer = post.featured_lawyer;

    return (
        <main className="min-h-screen bg-[#070b14] text-white font-sans">
            {/* Nav */}
            <nav className="sticky top-0 z-50 bg-[#070b14]/95 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href="/insights" className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
                        <span>←</span>
                        <span>인사이트</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Lawnald" className="w-5 h-5 opacity-50" />
                        <span className="text-xs text-white/30 font-bold uppercase tracking-widest">Official</span>
                    </div>
                </div>
            </nav>

            {/* Cover Image */}
            {post.cover_image && (
                <div className="max-w-4xl mx-auto px-6 mt-8">
                    <div className="aspect-[2.2/1] rounded-[20px] overflow-hidden">
                        <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                </div>
            )}

            {/* Article */}
            <article className="max-w-3xl mx-auto px-6 pt-12 pb-8">
                {/* Header */}
                <div className="mb-12">
                    <span className="text-xs font-bold text-blue-400/80 uppercase tracking-widest">
                        {CATEGORY_LABELS[post.category] || post.category}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-6 font-serif leading-tight">
                        {post.title}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white border border-white/10 flex items-center justify-center overflow-hidden">
                            <img src={post.author_image || "/logo.png"} alt={post.author} className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold">{post.author}</div>
                            <div className="text-xs text-white/30">
                                {new Date(post.created_at).toLocaleDateString("ko-KR", {
                                    year: "numeric", month: "long", day: "numeric",
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .article-content p {
                        color: rgba(255,255,255,0.7);
                        font-size: 1rem;
                        line-height: 1.85;
                        margin-bottom: 1.5em;
                    }
                    .article-content h2 {
                        color: white;
                        font-size: 1.5rem;
                        font-weight: 700;
                        margin-top: 2.5em;
                        margin-bottom: 1em;
                        font-family: serif;
                    }
                    .article-content h3 {
                        color: white;
                        font-size: 1.25rem;
                        font-weight: 700;
                        margin-top: 2em;
                        margin-bottom: 0.75em;
                        font-family: serif;
                    }
                    .article-content blockquote {
                        border-left: 3px solid rgba(59,130,246,0.4);
                        background: rgba(59,130,246,0.04);
                        border-radius: 0 12px 12px 0;
                        padding: 1em 1.5em;
                        margin: 1.5em 0;
                        font-style: italic;
                        color: rgba(255,255,255,0.6);
                    }
                    .article-content blockquote p {
                        margin-bottom: 0.5em;
                    }
                    .article-content blockquote p:last-child {
                        margin-bottom: 0;
                    }
                    .article-content strong {
                        color: white;
                        font-weight: 700;
                    }
                    .article-content ul, .article-content ol {
                        color: rgba(255,255,255,0.6);
                        padding-left: 1.5em;
                        margin-bottom: 1.5em;
                    }
                    .article-content li {
                        margin-bottom: 0.5em;
                    }
                    .article-content a {
                        color: #60a5fa;
                        text-decoration: none;
                    }
                    .article-content a:hover {
                        text-decoration: underline;
                    }
                    .article-content img {
                        border-radius: 12px;
                        margin: 1.5em 0;
                    }
                    .article-content br {
                        display: block;
                        content: "";
                        margin-top: 0.5em;
                    }
                `}} />
                <div className="article-content max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>{post.content}</ReactMarkdown>
                </div>

                {/* Tags */}
                {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-white/[0.06]">
                        {post.tags.map((tag) => (
                            <span key={tag} className="text-xs text-white/30 bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06]">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </article>

            {/* Featured Lawyer CTA */}
            {lawyer && (
                <section className="max-w-3xl mx-auto px-6 pb-20">
                    <div className="bg-gradient-to-br from-[#0d1b3e] to-[#0f1729] rounded-[24px] border border-white/[0.08] p-8 md:p-10">
                        <div className="text-center mb-6">
                            <span className="text-xs font-bold text-blue-400/60 uppercase tracking-widest">
                                이 글에서 소개된 변호사
                            </span>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-28 h-28 rounded-[20px] bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                                {lawyer.cutoutImageUrl || lawyer.imageUrl ? (
                                    <img
                                        src={lawyer.cutoutImageUrl || lawyer.imageUrl || ""}
                                        alt={lawyer.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl text-white/20">
                                        👤
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-xl font-bold mb-1">{lawyer.name} 변호사</h3>
                                <p className="text-sm text-white/40 mb-2">{lawyer.firm}</p>
                                {lawyer.introduction_short && (
                                    <p className="text-sm text-white/50 mb-4 leading-relaxed">
                                        {lawyer.introduction_short}
                                    </p>
                                )}
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                                    {lawyer.expertise.slice(0, 4).map((tag) => (
                                        <span key={tag} className="text-[10px] bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/20">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <Link
                                href={`/lawyer/${lawyer.id}`}
                                className="flex-1 py-4 rounded-xl text-center font-semibold text-sm bg-white/10 text-white hover:bg-white/15 transition-colors border border-white/10"
                            >
                                프로필 상세보기
                            </Link>
                            <Link
                                href={`/lawyer/${lawyer.id}?chat=true`}
                                className="flex-1 py-4 rounded-xl text-center font-bold text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-[0_4px_20px_rgba(59,130,246,0.3)]"
                            >
                                💬 지금 즉시 실시간 상담하기
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Admin Actions */}
            <AdminPostActions postId={post.id} />

            {/* Footer */}
            <footer className="border-t border-white/[0.04] py-10">
                <div className="max-w-3xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Lawnald" className="w-5 h-5 opacity-30" />
                        <span className="text-xs text-white/20 font-serif italic">Lawnald.</span>
                    </div>
                    <Link href="/insights" className="text-xs text-white/20 hover:text-white/40 transition-colors">
                        더 많은 인사이트 보기 →
                    </Link>
                </div>
            </footer>
        </main>
    );
}
