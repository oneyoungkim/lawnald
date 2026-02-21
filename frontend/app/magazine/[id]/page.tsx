import { Metadata } from 'next';
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import ReactMarkdown from 'react-markdown';

// --- Types ---
type Props = {
    params: Promise<{ id: string }>
}

interface ArticleDetail {
    id: string;
    lawyer_id: string;
    lawyer_name: string;
    lawyer_image?: string;
    firm: string;
    type: string;
    title: string;
    summary: string;
    cover_image?: string;
    key_takeaways?: string[];
    content: string;
    date: string;
    tags: string[];
    seo?: {
        slug: string;
        seo_title: string;
        meta_description: string;
        canonical: string;
        faq: { question: string; answer: string }[];
    };
}

// --- Fetch Data ---
async function getArticle(id: string): Promise<ArticleDetail | null> {
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/magazine/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        return null;
    }
}

// --- Dynamic Metadata (SEO) ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const article = await getArticle(id);

    if (!article) {
        return { title: 'Not Found' };
    }

    const seo = article.seo;

    const canonicalUrl = seo?.canonical || `https://lawnald.com/magazine/${id}`;
    const displayName = article.lawyer_name?.endsWith('변호사') ? article.lawyer_name : `${article.lawyer_name} 변호사`;
    const metaTitle = seo?.seo_title || `${article.title} - ${displayName} | Lawnald Magazine`;
    const metaDesc = seo?.meta_description || `${displayName}의 ${article.type === 'case' ? '승소사례' : '법률칼럼'}: ${article.title}. 전문가의 법률 인사이트를 확인하세요.`;
    const ogImage = article.cover_image || (article.lawyer_image ? `http://127.0.0.1:8000${article.lawyer_image}` : 'https://lawnald.com/og-default.png');

    return {
        title: metaTitle,
        description: metaDesc,
        openGraph: {
            title: seo?.seo_title || article.title,
            description: metaDesc,
            url: canonicalUrl,
            type: 'article',
            publishedTime: article.date,
            authors: [article.lawyer_name],
            tags: article.tags,
            section: article.type === 'case' ? '승소사례' : '법률칼럼',
            images: [{
                url: ogImage,
                width: 1200,
                height: 630,
                alt: article.title,
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: seo?.seo_title || article.title,
            description: metaDesc,
            images: [ogImage],
        },
        alternates: {
            canonical: canonicalUrl,
        }
    };
}

// --- Page Component ---
import AuthorCard from "@/components/magazine/AuthorCard";
import ScrollCTA from "./ScrollCTA";
import MagazineChatSection from "./MagazineChatSection";

export default async function ArticlePage({ params }: Props) {
    const { id } = await params;
    const article = await getArticle(id);

    // Debugging: If article is null, it means fetch failed or 404
    if (!article) {
        notFound();
    }



    // Helper to normalize image URL (avoid localhost ipv6 issues)
    const normalizeImage = (url?: string) => {
        if (!url) return undefined;
        if (url.startsWith("http://localhost:8000")) {
            return url.replace("http://localhost:8000", "http://127.0.0.1:8000");
        }
        if (url.startsWith("/")) {
            return `http://127.0.0.1:8000${url}`;
        }
        return url;
    };

    // JSON-LD
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.seo?.seo_title || article.title,
        "description": article.seo?.meta_description || article.summary,
        "author": {
            "@type": "Person",
            "name": article.lawyer_name,
            "url": `https://lawnald.com/lawyer/${article.lawyer_id}`
        },
        "publisher": {
            "@type": "Organization",
            "name": "Lawnald",
            "logo": {
                "@type": "ImageObject",
                "url": "https://lawnald.com/logo.png"
            }
        },
        "datePublished": article.date,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": article.seo?.canonical || `https://lawnald.com/magazine/${id}`
        }
    };

    const faqSchema = article.seo?.faq ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": article.seo.faq.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
            }
        }))
    } : null;

    return (
        <main className="min-h-screen bg-background font-sans selection:bg-point/30 selection:text-foreground">
            {/* SEO Scripts */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {faqSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
            )}

            {/* Header */}
            <header className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-point/10 z-50">
                <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/magazine" className="text-sm font-medium text-zinc-400 hover:text-main transition-colors">
                        ← Magazine
                    </Link>
                    <div className="font-serif italic font-black text-xl text-main">Lawnald.</div>
                </div>
            </header>

            {/* Content */}
            <article className="pt-32 pb-20 max-w-3xl mx-auto px-6">
                <div className="text-center mb-16">
                    <span className={`inline-block px-3 py-1 text-xs font-bold tracking-widest uppercase mb-6 ${article.type === 'case' ? 'text-main bg-main/5' : 'text-point bg-point/10'} rounded-full`}>
                        {article.type === 'case' ? 'Success Case' : 'Legal Column'}
                    </span>
                    <h1 className="text-3xl md:text-5xl font-serif font-medium leading-tight mb-8 break-keep text-main">
                        {article.title}
                    </h1>

                    <div className="flex items-center justify-center gap-3 text-sm text-zinc-500 font-medium">
                        <span className="text-main font-bold">{article.lawyer_name?.endsWith('변호사') ? article.lawyer_name : `${article.lawyer_name} 변호사`}</span>
                        <span className="text-point">·</span>
                        <span>{article.date}</span>
                    </div>
                </div>

                <div className="prose prose-lg prose-zinc mx-auto">
                    {/* Markdown rendering with ReactMarkdown */}
                    <ReactMarkdown
                        components={{
                            h1: ({ node, ...props }) => <h2 className="text-2xl md:text-3xl font-serif font-bold mt-10 mb-5 text-main" {...props} />,
                            h2: ({ node, ...props }) => <h3 className="text-xl md:text-2xl font-serif font-bold mt-8 mb-4 text-main" {...props} />,
                            h3: ({ node, ...props }) => <h4 className="text-lg md:text-xl font-serif font-bold mt-6 mb-3 text-main" {...props} />,
                            p: ({ node, ...props }) => <p className="leading-loose mb-6 text-foreground font-sans text-base md:text-lg" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold text-main bg-point/10 px-0.5" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-6 mb-6 space-y-2 marker:text-point" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-6 mb-6 space-y-2 marker:text-point" {...props} />,
                            li: ({ node, ...props }) => <li className="text-foreground" {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-point/30 pl-4 italic text-zinc-600 my-6 bg-white/50 py-2 rounded-r-lg" {...props} />,
                        }}
                    >
                        {article.content}
                    </ReactMarkdown>

                    <div className={`p-8 rounded-2xl border my-12 ${article.type === 'case' ? 'bg-main/5 border-main/10' : 'bg-point/5 border-point/10'}`}>
                        <h3 className="font-serif font-medium text-xl mb-4 text-main">
                            {article.type === 'case' ? '💡 승소 포인트' : '📌 핵심 요약'}
                        </h3>
                        {/* Check if key_takeaways exists, otherwise fall back to summary */}
                        {article.key_takeaways && article.key_takeaways.length > 0 ? (
                            <ul className="space-y-3">
                                {article.key_takeaways.map((point, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-main/10 text-main flex items-center justify-center shrink-0 text-xs font-bold">✓</div>
                                        <span className="text-zinc-700 leading-relaxed font-medium">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-zinc-700 leading-relaxed">
                                {article.summary}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat CTA Section */}
                <MagazineChatSection lawyerId={article.lawyer_id} lawyerName={article.lawyer_name} />

                <div className="mt-16 pt-16 border-t border-point/10">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Related Tags</h3>
                    <div className="flex flex-wrap gap-2 mb-20">
                        {article.tags.map(tag => (
                            <Link key={tag} href={`/search?q=${tag}`} className="px-4 py-2 bg-white border border-point/10 rounded-full text-sm hover:bg-point/5 hover:text-main hover:border-point/30 transition-all text-zinc-600">
                                #{tag}
                            </Link>
                        ))}
                    </div>

                    {/* Author Card */}
                    <div className="border-t border-point/10 pt-16">
                        <h3 className="text-2xl font-serif font-medium mb-8 text-main">About the Author</h3>
                        <AuthorCard
                            lawyerId={article.lawyer_id}
                            name={article.lawyer_name}
                            firm={article.firm}
                            image={normalizeImage(article.lawyer_image)}
                            description="의뢰인의 권리를 최우선으로 생각합니다. 복잡한 법률 문제, 명쾌한 해결책을 제시해 드립니다."
                        />
                    </div>
                </div>
                {/* FAQ Section */}
                {article.seo?.faq && (
                    <div className="mt-16 pt-16 border-t border-point/10">
                        <h3 className="text-2xl font-serif font-medium mb-8 text-main">자주 묻는 질문</h3>
                        <div className="space-y-6">
                            {article.seo.faq.map((item, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-2xl border border-point/10 shadow-sm">
                                    <h4 className="font-bold text-lg mb-3 text-main">Q. {item.question}</h4>
                                    <p className="text-zinc-600 leading-relaxed text-sm">A. {item.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </article>

            {/* Scroll CTA */}
            {article && <ScrollCTA tags={article.tags} type={article.type} />}
        </main >
    );
}

