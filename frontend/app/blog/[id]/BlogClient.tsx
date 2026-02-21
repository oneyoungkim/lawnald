"use client";

import { useState } from 'react';
import {
    MagnifyingGlassIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    ClockIcon,
    CheckBadgeIcon,
    ArrowRightIcon,
    BookmarkIcon,
    ShareIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import ConsultationModal from './ConsultationModal';

// --- Typography Cover Generator ---
function TypographyCover({ title, category }: { title: string, category: string }) {
    // Map categories to distinct styles
    const styles: Record<string, string> = {
        '성범죄': 'bg-gradient-to-br from-slate-900 to-slate-800',
        '음주운전': 'bg-gradient-to-br from-slate-900 to-slate-800',
        '형사': 'bg-gradient-to-br from-stone-900 to-stone-800',
        '이혼': 'bg-gradient-to-br from-orange-100 to-orange-50', // Warm/Lonely
        '가사': 'bg-gradient-to-br from-orange-50 to-stone-100',
        '부동산': 'bg-gradient-to-br from-[#1e293b] to-[#0f172a]', // Navy/Blueprint
        '민사': 'bg-gradient-to-br from-slate-800 to-slate-700',
        '기업': 'bg-gradient-to-br from-slate-800 to-slate-900',
        'default': 'bg-gradient-to-br from-[#14213D] to-[#0A1120]' // Deep Navy Default
    };

    // Determine style based on category keyword matching
    let bgClass = styles['default'];
    if (category.includes('성범죄') || category.includes('음주')) bgClass = styles['성범죄'];
    else if (category.includes('이혼') || category.includes('가사')) bgClass = styles['이혼'];
    else if (category.includes('부동산')) bgClass = styles['부동산'];
    else if (category.includes('민사')) bgClass = styles['민사'];

    const isLightBg = bgClass.includes('orange');
    const textColor = isLightBg ? 'text-slate-800' : 'text-white/90';

    return (
        <div className={`w-full h-full ${bgClass} p-6 flex items-center justify-center text-center transition-transform duration-500 group-hover:scale-105`}>
            <div className="flex flex-col items-center gap-4">
                <span className={`text-xs font-bold tracking-widest uppercase border-b pb-1 ${isLightBg ? 'border-slate-800 text-slate-600' : 'border-white/30 text-white/60'}`}>
                    {category}
                </span>
                <h3 className={`font-serif text-2xl font-medium leading-relaxed break-keep ${textColor}`}>
                    {title}
                </h3>
            </div>
        </div>
    );
}

export default function BlogClient({ lawyer, posts }: { lawyer: any, posts: any[] }) {
    const [activeTab, setActiveTab] = useState('전체');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredPosts = activeTab === '전체'
        ? posts
        : activeTab === '승소 Story'
            ? posts.filter(p => p.type === 'case')
            : activeTab === '법률 칼럼'
                ? posts.filter(p => p.type === 'column')
                : [];

    const scrollToBio = () => {
        document.getElementById('bio-section')?.scrollIntoView({ behavior: 'smooth' });
        setActiveTab('변호사 소개');
    };

    // Safe access to theme/content with defaults
    const theme = lawyer.theme || { primary: '#14213D', secondary: '#FAFAFA', accent: '#C5A065' };
    const content = lawyer.content || {
        heroDescription: `의뢰인의 삶을 지키는 법률 서비스,<br/><strong>${lawyer.name}</strong>이 함께하겠습니다.`,
        consultationTitle: "무료 법률 상담",
        consultationMessage: "복잡한 법률 문제,<br/>전문가와 직접 이야기하세요."
    };

    return (
        <div
            className="min-h-screen bg-stone-50/50 font-sans text-slate-800 pb-20 selection:bg-[var(--blog-primary)] selection:text-white"
            style={{
                '--blog-primary': theme.primary,
                '--blog-secondary': theme.secondary,
                '--blog-accent': theme.accent,
            } as React.CSSProperties}
        >
            <ConsultationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                lawyerId={lawyer.id}
                lawyerName={lawyer.name}
            />

            {/* --- Hero Section --- */}
            <header className="relative w-full bg-[var(--blog-primary)] text-white py-20 lg:py-28 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                </div>

                <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Introduction */}
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-4 justify-center lg:justify-start">
                            {/* Profile Image */}
                            <div className="relative w-20 h-20 rounded-full p-[2px] bg-gradient-to-br from-[var(--blog-accent)] to-transparent">
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 relative">
                                    {lawyer.image && !lawyer.image.includes('placehold') ? (
                                        <Image
                                            src={lawyer.image}
                                            alt={lawyer.name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-[var(--blog-accent)] font-serif text-2xl font-bold">
                                            {lawyer.name.substring(0, 1)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-left">
                                <h1 className="font-serif text-3xl lg:text-4xl font-light tracking-tight">
                                    {lawyer.name} <span className="text-lg text-white/60 font-sans font-normal ml-1">변호사</span>
                                </h1>
                                <p className="text-[var(--blog-accent)] font-medium tracking-wide text-sm mt-1 uppercase">
                                    {lawyer.title || "Legal Professional"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6 max-w-2xl mx-auto lg:mx-0">
                            <p className="font-serif text-2xl/relaxed lg:text-3xl/relaxed font-light text-white/90 break-keep">
                                "{lawyer.slogan}"
                            </p>
                            <p className="text-stone-300 font-light text-lg" dangerouslySetInnerHTML={{ __html: content.heroDescription }} />
                        </div>
                    </div>

                    {/* Right: CTA */}
                    <div className="flex justify-center lg:justify-end items-end h-full">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[var(--blog-accent)] text-[var(--blog-primary)] font-bold rounded-lg overflow-hidden transition-all hover:brightness-110 shadow-lg hover:shadow-xl hover:-translate-y-1"
                        >
                            <span className="relative z-10">법률상담 신청하기</span>
                            <ArrowRightIcon className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>
            </header>

            {/* --- Main Content --- */}
            <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <main className="lg:col-span-8">
                    {/* Tabs */}
                    <nav className="flex items-center gap-8 border-b border-stone-200 mb-12 overflow-x-auto">
                        {['전체', '승소 Story', '법률 칼럼', '변호사 소개'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 whitespace-nowrap ${activeTab === tab
                                    ? 'border-[var(--blog-primary)] text-[var(--blog-primary)]'
                                    : 'border-transparent text-stone-400 hover:text-stone-600'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>

                    {/* Content List */}
                    {activeTab === '변호사 소개' ? (
                        <div id="bio-section" className="prose prose-lg prose-stone max-w-none">
                            <h3 className="font-serif text-3xl text-[var(--blog-primary)] mb-6">변호사 소개</h3>
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
                                <p className="whitespace-pre-wrap leading-relaxed text-stone-600">{lawyer.bio}</p>
                            </div>

                            <div className="mt-12 bg-[#F8FAFC] p-8 rounded-2xl border border-slate-100">
                                <h4 className="font-serif text-xl text-[#0F172A] mb-6 flex items-center gap-2">
                                    <CheckBadgeIcon className="w-6 h-6 text-[var(--blog-primary)]" />
                                    주요 경력
                                </h4>
                                <ul className="space-y-3">
                                    {(lawyer.career || "").split('\n').map((line: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-stone-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--blog-primary)] mt-2.5 shrink-0" />
                                            {line}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-12">
                            {filteredPosts.map((post) => (
                                <article key={post.id} className="group cursor-pointer flex flex-col h-full bg-white rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-stone-100/50">
                                    <Link href={`/magazine/${post.id}`} className="block h-full flex flex-col">
                                        {/* Thumbnail / Typography Cover */}
                                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                                            {(post.image && !post.image.includes('placehold')) ? (
                                                <Image
                                                    src={post.image}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                    unoptimized
                                                />
                                            ) : (
                                                <TypographyCover title={post.title} category={post.category || '법률정보'} />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex flex-col flex-1">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-[var(--blog-accent)] tracking-widest uppercase">
                                                    {post.category}
                                                </span>
                                                <span className="text-xs text-stone-400 font-medium">
                                                    {post.date}
                                                </span>
                                            </div>
                                            <h3 className="font-serif text-xl font-bold text-[var(--blog-primary)] leading-snug mb-3 group-hover:text-[var(--blog-accent)] transition-colors break-keep">
                                                {post.title}
                                            </h3>
                                            <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed mb-6 flex-1">
                                                {post.excerpt}
                                            </p>
                                            <div className="flex items-center text-sm font-medium text-[var(--blog-primary)] group-hover:translate-x-1 transition-transform">
                                                Read Essay <ArrowRightIcon className="w-4 h-4 ml-1" />
                                            </div>
                                        </div>
                                    </Link>
                                </article>
                            ))}
                        </div>
                    )}
                </main>

                {/* --- Sidebar (Sticky) --- */}
                <aside className="lg:col-span-4 space-y-8">
                    {/* Floating Widget */}
                    <div className="sticky top-10 bg-white p-8 rounded-2xl shadow-xl transition-all hover:shadow-2xl z-10">
                        <div className="text-center mb-6">
                            <h3 className="font-serif text-xl font-bold text-[var(--blog-primary)] mb-2">{content.consultationTitle}</h3>
                            <p className="text-sm text-stone-500" dangerouslySetInnerHTML={{ __html: content.consultationMessage }} />
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-stone-50 rounded-xl flex items-center gap-4">
                                <div className="p-2 bg-white rounded-lg text-[var(--blog-primary)] shadow-sm">
                                    <PhoneIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500 font-bold uppercase">상담 문의</p>
                                    <p className="text-[var(--blog-primary)] font-bold font-mono text-lg">{lawyer.office?.phone}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="block w-full py-4 bg-[var(--blog-primary)] text-white font-bold text-center rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[var(--blog-primary)]/20"
                            >
                                간편 상담 신청하기
                            </button>

                            <button className="w-full py-4 bg-white border border-stone-200 text-stone-600 font-bold rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center gap-2">
                                <EnvelopeIcon className="w-5 h-5" />
                                이메일 문의
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-stone-100">
                            <div className="flex items-start gap-3 text-sm text-stone-500">
                                <MapPinIcon className="w-5 h-5 text-[var(--blog-accent)] shrink-0" />
                                <p>{lawyer.office?.address}</p>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-stone-500 mt-3">
                                <ClockIcon className="w-5 h-5 text-[var(--blog-accent)] shrink-0" />
                                <p>{lawyer.office?.hours}</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
