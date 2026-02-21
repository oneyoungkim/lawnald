"use client";

import { useState, useMemo } from 'react';
import {
    MagnifyingGlassIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    ClockIcon,
    CheckBadgeIcon,
    ArrowRightIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import ConsultationModal from './ConsultationModal';

// --- Typography Cover (for posts without images) ---
function TypographyCover({ title, category }: { title: string; category: string }) {
    const styles: Record<string, string> = {
        '성범죄': 'from-slate-900 to-slate-800',
        '형사': 'from-stone-900 to-stone-800',
        '이혼': 'from-orange-100 to-orange-50',
        '부동산': 'from-[#1e293b] to-[#0f172a]',
        '민사': 'from-slate-800 to-slate-700',
        default: 'from-[#14213D] to-[#0A1120]',
    };

    let gradientClass = styles.default;
    for (const [key, val] of Object.entries(styles)) {
        if (category.includes(key)) { gradientClass = val; break; }
    }
    const isLight = gradientClass.includes('orange');
    const textColor = isLight ? 'text-slate-800' : 'text-white/90';

    return (
        <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center p-5 text-center`}>
            <div>
                <span className={`text-[10px] font-bold tracking-widest uppercase ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    {category}
                </span>
                <h3 className={`font-serif text-base font-medium leading-snug mt-2 break-keep ${textColor}`}>
                    {title.length > 30 ? title.slice(0, 30) + '…' : title}
                </h3>
            </div>
        </div>
    );
}

// ── Constants ──
const POSTS_PER_PAGE = 6;
const CATEGORIES = ['전체', '승소 Story', '법률 칼럼', '변호사 소개'];

export default function BlogClient({ lawyer, posts }: { lawyer: any; posts: any[] }) {
    const [activeTab, setActiveTab] = useState('전체');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const theme = lawyer.theme || { primary: '#14213D', secondary: '#FAFAFA', accent: '#C5A065' };
    const content = lawyer.content || {
        heroDescription: `${lawyer.name} 변호사의 법률 이야기`,
        consultationTitle: '무료 법률 상담',
        consultationMessage: '복잡한 법률 문제,<br/>전문가와 직접 이야기하세요.',
    };

    // Filtering
    const filteredPosts = useMemo(() => {
        let result = posts;
        if (activeTab === '승소 Story') result = result.filter((p) => p.type === 'case');
        else if (activeTab === '법률 칼럼') result = result.filter((p) => p.type === 'column');
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (p) => p.title.toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q)
            );
        }
        return result;
    }, [posts, activeTab, searchQuery]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
    const pagedPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

    // Popular posts (top 3 by view or first 3)
    const popularPosts = useMemo(
        () => [...posts].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 3),
        [posts]
    );

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const showBio = activeTab === '변호사 소개';

    return (
        <div
            className="min-h-screen bg-white font-sans text-gray-800 selection:bg-[var(--blog-primary)] selection:text-white"
            style={{ '--blog-primary': theme.primary, '--blog-accent': theme.accent } as React.CSSProperties}
        >
            <ConsultationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                lawyerId={lawyer.id}
                lawyerName={lawyer.name}
            />

            {/* ━━━ 1. Header Banner ━━━ */}
            <header className="w-full bg-gray-50 border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        {/* Profile Photo */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-white shadow-lg">
                            {lawyer.image && !lawyer.image.includes('placehold') ? (
                                <Image src={lawyer.image} alt={lawyer.name} fill className="object-cover" unoptimized />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[var(--blog-primary)] text-white font-serif text-4xl font-bold">
                                    {lawyer.name?.substring(0, 1)}
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="text-center sm:text-left flex-1">
                            {(() => {
                                // "김원영 변호사" → "김원영" (strip suffix)
                                const rawName = (lawyer.name || '').replace(/\s*변호사$/, '');
                                // "파트너 변호사" → "파트너" (strip suffix for display next to 변호사)
                                const rawTitle = (lawyer.title || '파트너 변호사').replace(/\s*변호사$/, '');
                                return (
                                    <>
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                                                {rawName} <span className="text-gray-400 font-normal text-lg">변호사</span>
                                            </h1>
                                            {rawTitle && (
                                                <span className="text-sm text-[var(--blog-accent)] font-semibold">
                                                    {rawTitle}
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="mt-3 text-xl md:text-2xl font-serif text-gray-700 leading-snug break-keep">
                                            {rawName} 변호사의 법률 이야기
                                        </h2>
                                    </>
                                );
                            })()}
                            <p className="mt-2 text-sm text-gray-500 max-w-xl leading-relaxed">
                                {lawyer.slogan || '당신의 든든한 법률 파트너'}
                            </p>

                            {/* Tags */}
                            {lawyer.tags && lawyer.tags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5 justify-center sm:justify-start">
                                    {lawyer.tags.slice(0, 5).map((tag: string, i: number) => (
                                        <span key={i} className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-500 font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* ━━━ 2. Main Content (2-Column Grid) ━━━ */}
            <div className="max-w-6xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

                    {/* ── Left Column: Post List (7/12) ── */}
                    <main className="md:col-span-8">

                        {/* Category Tabs */}
                        <nav className="flex items-center gap-6 border-b border-gray-200 mb-8 overflow-x-auto">
                            {CATEGORIES.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => handleTabChange(tab)}
                                    className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 whitespace-nowrap ${activeTab === tab
                                        ? 'border-gray-900 text-gray-900'
                                        : 'border-transparent text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>

                        {/* Bio Section */}
                        {showBio ? (
                            <div id="bio-section" className="space-y-8">
                                <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <CheckBadgeIcon className="w-5 h-5 text-[var(--blog-accent)]" />
                                        변호사 소개
                                    </h3>
                                    <p className="whitespace-pre-wrap leading-relaxed text-gray-600 text-[15px]">{lawyer.bio}</p>
                                </div>

                                {lawyer.career && (
                                    <div className="bg-gray-50 p-8 rounded-xl border border-gray-100">
                                        <h4 className="text-lg font-bold text-gray-900 mb-4">주요 경력</h4>
                                        <ul className="space-y-2.5">
                                            {lawyer.career.split('\n').filter(Boolean).map((line: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3 text-gray-600 text-[15px]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                                                    {line}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Post Cards (Horizontal / Flex Row) */}
                                {pagedPosts.length > 0 ? (
                                    <div className="divide-y divide-gray-100">
                                        {pagedPosts.map((post) => (
                                            <article key={post.id} className="group">
                                                <Link href={`/magazine/${post.id}`} className="flex gap-5 py-6 first:pt-0 last:pb-0">
                                                    {/* Thumbnail */}
                                                    <div className="relative w-44 h-28 md:w-48 md:h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                                        {post.image && !post.image.includes('placehold') ? (
                                                            <Image
                                                                src={post.image}
                                                                alt={post.title}
                                                                fill
                                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <TypographyCover title={post.title} category={post.category || '법률정보'} />
                                                        )}
                                                    </div>

                                                    {/* Post Info */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] font-semibold rounded">
                                                                {post.category || (post.type === 'case' ? '승소사례' : '법률칼럼')}
                                                            </span>
                                                            <span className="text-xs text-gray-400">{post.date}</span>
                                                        </div>
                                                        <h3 className="text-[15px] md:text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[var(--blog-accent)] transition-colors break-keep">
                                                            {post.title}
                                                        </h3>
                                                        <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 leading-relaxed hidden sm:block">
                                                            {post.excerpt}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center text-gray-400">
                                        <p className="text-sm">검색 결과가 없습니다.</p>
                                    </div>
                                )}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <nav className="flex items-center justify-center gap-1 mt-10 pt-6 border-t border-gray-100">
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                                        >
                                            <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === currentPage
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-500 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                                        >
                                            <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </nav>
                                )}
                            </>
                        )}
                    </main>

                    {/* ── Right Sidebar (4/12) ── */}
                    <aside className="md:col-span-4 space-y-6">

                        {/* Search */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    placeholder="글 검색..."
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all"
                                />
                            </div>
                        </div>

                        {/* Category List */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">카테고리</h3>
                            <ul className="space-y-1">
                                {CATEGORIES.filter((c) => c !== '변호사 소개').map((cat) => (
                                    <li key={cat}>
                                        <button
                                            onClick={() => handleTabChange(cat)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === cat
                                                ? 'bg-gray-100 text-gray-900 font-semibold'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                                }`}
                                        >
                                            {cat}
                                            <span className="float-right text-xs text-gray-400">
                                                {cat === '전체'
                                                    ? posts.length
                                                    : cat === '승소 Story'
                                                        ? posts.filter((p) => p.type === 'case').length
                                                        : posts.filter((p) => p.type === 'column').length}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Popular Posts */}
                        {popularPosts.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">인기 포스트</h3>
                                <div className="space-y-3">
                                    {popularPosts.map((post, i) => (
                                        <Link key={post.id} href={`/magazine/${post.id}`} className="flex items-start gap-3 group">
                                            <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                                                {post.image && !post.image.includes('placehold') ? (
                                                    <Image src={post.image} alt="" fill className="object-cover" unoptimized />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                                        <span className="text-xs font-bold text-gray-500">{i + 1}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-[var(--blog-accent)] transition-colors break-keep">
                                                    {post.title}
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-1">{post.date}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 🔥 Sticky Consultation Card */}
                        <div className="sticky top-4">
                            <div className="bg-white rounded-xl border border-gray-100 shadow-md p-6 space-y-4">
                                <div className="text-center">
                                    <h3 className="text-base font-bold text-gray-900 mb-1">{content.consultationTitle}</h3>
                                    <p className="text-xs text-gray-500" dangerouslySetInnerHTML={{ __html: content.consultationMessage }} />
                                </div>

                                {/* Phone */}
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="p-2 bg-white rounded-md shadow-sm">
                                        <PhoneIcon className="w-4 h-4 text-gray-700" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">상담 문의</p>
                                        <p className="text-gray-900 font-bold font-mono text-sm">{lawyer.office?.phone}</p>
                                    </div>
                                </div>

                                {/* CTA Buttons */}
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full py-3 bg-gray-900 text-white font-bold text-sm text-center rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                                >
                                    간편 상담 신청하기
                                </button>
                                <a
                                    href={`tel:${lawyer.office?.phone || ''}`}
                                    className="w-full py-3 bg-white border border-gray-200 text-gray-600 font-semibold text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <PhoneIcon className="w-4 h-4" />
                                    전화 연결
                                </a>

                                {/* Office Info */}
                                <div className="pt-4 border-t border-gray-100 space-y-2.5">
                                    <div className="flex items-start gap-2.5 text-xs text-gray-500">
                                        <MapPinIcon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <span>{lawyer.office?.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-xs text-gray-500">
                                        <ClockIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        <span>{lawyer.office?.hours}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
