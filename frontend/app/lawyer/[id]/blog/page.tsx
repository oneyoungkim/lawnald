
import Link from "next/link";
import { LawyerDetail, ContentItem } from "../../types";

async function getLawyer(id: string): Promise<LawyerDetail | null> {
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/public/lawyers/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        return null;
    }
}

async function getBlogPosts(id: string): Promise<ContentItem[]> {
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/lawyers/${id}/blog`, { cache: 'no-store' });
        if (!res.ok) return [];
        return res.json();
    } catch (e) {
        return [];
    }
}

export default async function LawyerBlogPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    // We can fetch lawyer details if we want to show specific headers, but the layout already does.
    // However, the layout content is above the children.
    const posts = await getBlogPosts(resolvedParams.id);

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-8">
                <h2 className="text-3xl font-serif font-medium mb-4">Blog & News</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                    법률 지식과 최신 소식, 그리고 승소 사례를 전해드립니다.
                </p>
            </div>

            <div className="grid gap-12">
                {posts.map((post) => (
                    <article key={post.id} className="group grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="md:col-span-1 text-zinc-400 text-sm font-medium pt-2">
                            {post.date}
                        </div>
                        <div className="md:col-span-3">
                            <Link href={`/lawyer/${resolvedParams.id}/blog/${post.slug || post.id}`} className="block">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`text-xs font-bold uppercase tracking-wider ${post.type === 'case' ? 'text-blue-600' : 'text-green-600'}`}>
                                        {post.type === 'case' ? 'Success Case' : 'Column'}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-serif font-bold mb-4 group-hover:text-blue-600 transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                                    {post.summary}
                                </p>
                                <span className="inline-flex items-center text-sm font-bold text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white pb-1 group-hover:border-blue-600 group-hover:text-blue-600 transition-colors">
                                    Read Article
                                </span>
                            </Link>
                        </div>
                    </article>
                ))}
                {posts.length === 0 && (
                    <p className="text-zinc-400 py-10 text-center">등록된 게시글이 없습니다.</p>
                )}
            </div>
        </div>
    );
}
