
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { LawyerDetail } from "../../../types";
import ConsultButton from "@/components/ConsultButton";
import BlogTracker from "@/components/BlogTracker";
import ReactMarkdown from "react-markdown";

interface BlogPost {
    id: string;
    type: string;
    title: string;
    content: string;
    summary: string;
    date: string;
    slug?: string;
    seo_title?: string;
    seo_description?: string;
    topic_tags?: string[];
}

async function getLawyer(id: string): Promise<LawyerDetail | null> {
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/public/lawyers/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        return null;
    }
}

async function getBlogPost(lawyerId: string, slug: string): Promise<BlogPost | null> {
    try {
        // Assume backend endpoint handles slug or id lookup
        const res = await fetch(`http://127.0.0.1:8000/api/lawyers/${lawyerId}/blog/${slug}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; slug: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const post = await getBlogPost(resolvedParams.id, resolvedParams.slug);
    const lawyer = await getLawyer(resolvedParams.id);

    if (!post || !lawyer) return {};

    return {
        title: post.seo_title || `${post.title} - ${lawyer.name} 변호사`,
        description: post.seo_description || post.summary,
        openGraph: {
            title: post.seo_title || post.title,
            description: post.seo_description || post.summary,
            type: "article",
            publishedTime: post.date,
            authors: [lawyer.name],
            tags: post.topic_tags
        }
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
    const resolvedParams = await params;
    const post = await getBlogPost(resolvedParams.id, resolvedParams.slug);

    if (!post) notFound();

    return (
        <article className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-12 text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full ${post.type === 'case'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                        {post.type === 'case' ? 'Success Case' : 'Legal Column'}
                    </span>
                    <span className="text-zinc-400 text-sm">{post.date}</span>
                </div>

                <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight mb-8">
                    {post.title}
                </h1>
            </header>

            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-a:text-blue-600">
                <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>

            <div className="mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-wrap gap-2">
                    {post.topic_tags?.map(tag => (
                        <span key={tag} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-300 text-sm font-medium">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* CTA and Tracking */}
            <ConsultButton lawyerId={resolvedParams.id} />
            <BlogTracker lawyerId={resolvedParams.id} slug={resolvedParams.slug} />

            {/* Schema.org JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        "headline": post.seo_title || post.title,
                        "datePublished": post.date,
                        "description": post.seo_description || post.summary,
                        "author": { "@type": "Person", "name": "Lawnald Attorney" } // Simple fallback, should use lawyer data if available
                    })
                }}
            />
        </article>
    );
}
