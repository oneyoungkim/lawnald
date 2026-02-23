import { API_BASE } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
    PhoneIcon,
    GlobeAltIcon,
    MapPinIcon,
    ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/react/24/outline";
import { LawyerDetail } from "../types";
import ChatButton from "./ChatButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const lawyer = await getLawyer(id);
    if (!lawyer) return { title: "변호사 프로필 | 로날드" };
    return {
        title: `${lawyer.name} 변호사 | ${lawyer.firm} | 로날드`,
        description: `${lawyer.name} 변호사의 전문 분야: ${lawyer.expertise.join(", ")}. ${lawyer.firm}`,
        openGraph: {
            title: `${lawyer.name} 변호사 프로필`,
            description: `${lawyer.expertise.join(", ")} 전문. ${lawyer.firm}`,
            url: `https://lawnald.com/lawyer/${id}`,
        },
    };
}

async function getLawyer(id: string): Promise<LawyerDetail | null> {
    const urls = [
        `${API_BASE}/api/lawyers/${id}`,
        `http://127.0.0.1:8000/api/lawyers/${id}`,
    ];
    for (const url of urls) {
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (res.ok) return res.json();
        } catch { }
    }
    return null;
}

export default async function LawyerLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = await params;
    const lawyer = await getLawyer(resolvedParams.id);

    if (!lawyer) notFound();

    // Helper to normalize image
    const normalizeImage = (url?: string) => {
        if (!url) return "/lawyers/default_avatar.png";
        if (url.startsWith("/lawyers/")) return url;
        if (url.startsWith(`${API_BASE}`)) return url.replace(`${API_BASE}`, `${API_BASE}`);
        if (url.startsWith("/")) return `https://lawnald.com${url}`;
        return url;
    };

    return (
        <main className="min-h-screen bg-background text-foreground font-sans selection:bg-point/30 selection:text-foreground">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-point/20">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="font-serif italic font-black text-xl text-main">Lawnald.</Link>
                    <Link href="/magazine" className="text-sm font-medium hover:text-point transition-colors">Magazine</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Text Content */}
                    <div className="z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 bg-main/5 text-main text-xs font-bold uppercase tracking-widest rounded-full">
                                Partner Lawyer
                            </span>
                            <span className="px-3 py-1 bg-point/10 text-point text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                                Expert Index: {lawyer.expertise_score || (lawyer.content_items?.filter(i => i.date).length || 0) * 10 + 50}
                            </span>

                            <span className="flex items-center gap-1 text-zinc-500 text-sm font-medium">
                                <MapPinIcon className="w-4 h-4 text-point" />
                                {lawyer.location}
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-serif font-medium leading-tight mb-6 text-main">
                            {lawyer.name?.endsWith('변호사') ? lawyer.name : `${lawyer.name}`} <span className="text-zinc-400 font-sans text-4xl align-middle">{lawyer.name?.endsWith('변호사') ? '' : '변호사'}</span>
                        </h1>

                        <div className="text-xl md:text-2xl text-zinc-600 font-light leading-relaxed mb-10 break-keep">
                            {lawyer.introduction_short ? (
                                lawyer.introduction_short.split('\n').map((line, i) => (
                                    <span key={i}>{line}<br /></span>
                                ))
                            ) : (
                                <>
                                    {lawyer.firm} 소속<br className="hidden md:block" />
                                    {lawyer.expertise?.filter(e => e !== '일반').length > 0
                                        ? `${lawyer.expertise.filter(e => e !== '일반').join(', ')} 전문`
                                        : '법률 문제, 전문가와 상담하세요.'}
                                </>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {lawyer.phone && (
                                <a href={`tel:${lawyer.phone}`} className="flex items-center gap-2 px-6 py-3 bg-main text-white rounded-full font-bold hover:opacity-90 transition-opacity shadow-lg shadow-main/20">
                                    <PhoneIcon className="w-5 h-5" />
                                    전화 상담
                                </a>
                            )}
                            <ChatButton lawyerId={lawyer.id} lawyerName={lawyer.name} show={true} />
                            {lawyer.homepage && (
                                <a href={lawyer.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 border border-point text-point rounded-full font-bold hover:bg-point/5 transition-colors">
                                    <GlobeAltIcon className="w-5 h-5" />
                                    홈페이지
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Image */}
                    <div className="relative w-full max-w-[500px] aspect-square mx-auto">
                        <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 rounded-full -z-10" />
                        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-zinc-800 shadow-2xl">
                            <Image
                                src={normalizeImage(lawyer.cutoutImageUrl || lawyer.imageUrl)}
                                alt={lawyer.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 500px"
                                className="object-cover object-top"
                                priority
                                unoptimized
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Tabs / Navigation */}
            <section className="bg-background border-t border-point/10 min-h-screen">
                <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b border-point/10">
                    <div className="max-w-6xl mx-auto px-6 flex gap-8 overflow-x-auto custom-scrollbar">
                        <Link href={`/lawyer/${lawyer.id}`} className="py-5 text-sm font-bold uppercase tracking-widest text-main border-b-2 border-main whitespace-nowrap">
                            About & Experience
                        </Link>
                        <Link href={`/lawyer/${lawyer.id}/blog`} className="py-5 text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-point transition-colors whitespace-nowrap">
                            Blog & News
                        </Link>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-20">
                    {children}
                </div>
            </section>
        </main>
    );
}
