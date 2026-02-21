"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LawyerMenu from '../../../components/LawyerMenu';
import SEOPreCheckModal from '../../../../app/admin/posts/new/SEOPreCheckModal';
import SEOAssistantPanel from '../../../../components/editor/SEOAssistantPanel';
import { ChevronLeftIcon, ArrowDownTrayIcon, SparklesIcon } from '@heroicons/react/24/outline';
import BlogImportModal from '../../../../components/BlogImportModal';

export default function LawyerWritePage() {
    const router = useRouter();
    const [showModal, setShowModal] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);

    // Post Data
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('');
    const [purpose, setPurpose] = useState('');
    const [originalUrl, setOriginalUrl] = useState('');

    // Thumbnail Generation
    const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

    // Analysis Data
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleModalComplete = (data: any) => {
        setTitle(data.title);
        setKeyword(data.keyword);
        setCategory(data.category);
        if (data.purpose) setPurpose(data.purpose);
        setShowModal(false);

        const templates: Record<string, string> = {
            'info': `## 1. ${data.keyword}란 무엇인가?\n\n법적으로 ${data.keyword}은(는)...\n\n## 2. 주요 쟁점과 주의사항\n\n많은 분들이 놓치기 쉬운 부분은...\n\n## 3. 변호사의 조언\n\n이러한 상황에서는...`,
            'case': `## 1. 사건의 개요\n\n의뢰인은 ${data.keyword} 혐의로 입건되어...\n\n## 2. 변호인의 조력\n\n저희 법무법인은...\n\n## 3. 결과 및 의의\n\n결국 재판부는...`,
            'myth': `## 1. 흔한 오해: ${data.keyword}, 무조건 처벌받는다?\n\n많은 분들이...\n\n## 2. 진실: 상황에 따라 다릅니다\n\n법적으로 보면...\n\n## 3. 핵심은 입증 책임\n\n따라서 중요한 것은...`,
            'QnA': `## Q1. ${data.keyword} 소송, 얼마나 걸리나요?\n\n통상적으로...\n\n## Q2. 비용은 어떻게 되나요?\n\n사안의 복잡도에 따라...\n\n## Q3. 증거가 부족해도 되나요?\n\n확실한 증거가 없다면...`
        };

        if (!data.content && data.purpose) {
            setContent(templates[data.purpose] || '');
        }
    };

    // Check for pending import from Dashboard
    useEffect(() => {
        const pendingImport = localStorage.getItem('pendingImport');
        if (pendingImport) {
            try {
                const data = JSON.parse(pendingImport);
                setTitle(data.title);
                setContent(data.content);
                setCategory(data.category || '');
                setKeyword(data.keyword || '');
                setCoverImage(data.cover_image_url || '');
                setOriginalUrl(data.original_url || '');
                setShowModal(false);
                localStorage.removeItem('pendingImport');
            } catch (e) {
                console.error("Failed to parse pending import", e);
            }
        }
    }, []);

    // Real-time Analysis (Debounced)
    useEffect(() => {
        if (!content || !keyword) return;

        const timer = setTimeout(async () => {
            setIsAnalyzing(true);
            try {
                const res = await fetch('http://localhost:8000/api/seo/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content, keyword })
                });
                const data = await res.json();
                setAnalysis(data);
            } catch (error) {
                console.error("Analysis failed", error);
            } finally {
                setIsAnalyzing(false);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [content, title, keyword]);

    const handleInsertTemplate = (type: string) => {
        const templates: Record<string, string> = {
            'h2': '\n## 새로운 소제목을 입력하세요\n',
            'h3': '\n### 세부 내용을 입력하세요\n',
            'intro': '\n안녕하세요. 법무법인 맥디의 김원영 변호사입니다.\n오늘은 많은 분들이 고민하시는 주제, **' + keyword + '**에 대해 이야기해보려 합니다.\n',
            'outro': '\n---\n\n### 혼자 고민하지 마세요.\n복잡한 법률 문제, 전문가와 함께라면 해결할 수 있습니다.\n\n[무료 법률상담 신청하기](/blog/welder49264@naver.com)\n'
        };

        setContent(prev => prev + (templates[type] || ''));
    };

    // ── AI 썸네일 생성 (버튼 클릭 시에만 호출) ──
    const handleGenerateThumbnail = async () => {
        if (!content || content.trim().length < 30) {
            alert('썸네일 생성을 위해 최소 30자 이상의 본문을 입력해주세요.');
            return;
        }

        setIsGeneratingThumbnail(true);
        try {
            const res = await fetch('http://localhost:8000/api/generate-thumbnail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: content.slice(0, 1000) })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || '이미지 생성에 실패했습니다.');
            }

            const data = await res.json();
            setCoverImage(data.image_url);
        } catch (error: any) {
            console.error("Thumbnail generation failed:", error);
            alert(error.message || '이미지 생성 중 오류가 발생했습니다.');
        } finally {
            setIsGeneratingThumbnail(false);
        }
    };

    const handlePublish = async () => {
        if (!confirm("이 글을 발행하시겠습니까?")) return;

        try {
            const res = await fetch('http://localhost:8000/api/admin/magazine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    keyword,
                    category,
                    purpose,
                    cover_image: coverImage,
                    original_url: originalUrl
                })
            });

            if (res.ok) {
                alert("성공적으로 발행되었습니다!");
                router.push('/lawyer/magazine');
            } else {
                alert("발행에 실패했습니다. 다시 시도해주세요.");
            }
        } catch (e) {
            console.error("Publish failed", e);
            alert("서버 오류가 발생했습니다.");
        }
    };

    return (
        <div className="flex h-screen bg-background font-sans overflow-hidden">
            <LawyerMenu />

            <SEOPreCheckModal
                isOpen={showModal}
                onClose={() => router.back()}
                onComplete={handleModalComplete}
            />

            <BlogImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={(data: any) => {
                    setTitle(data.title);
                    setContent(data.content);
                    setCoverImage(data.cover_image_url);
                    setOriginalUrl(data.original_url || '');
                    setShowImportModal(false);
                    setShowModal(false);
                }}
            />

            <main className="flex-1 ml-64 flex flex-col h-full relative">
                {/* Header */}
                <header className="h-16 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                            <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-md">
                                {title || "새로운 글 쓰기"}
                            </h1>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span className="uppercase font-bold text-blue-600">{category}</span>
                                <span>•</span>
                                <span>{purpose}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="text-sm font-medium text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors flex items-center gap-1"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            <span>블로그 불러오기</span>
                        </button>
                        <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 mx-1"></div>
                        <div className="text-xs text-gray-400">
                            {isAnalyzing ? '분석 중...' : '자동 저장됨'}
                        </div>
                        <button
                            onClick={handlePublish}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors shadow-lg shadow-blue-500/30"
                        >
                            발행하기
                        </button>
                    </div>
                </header>

                {/* Editor Area */}
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 h-full overflow-y-auto bg-white">
                        <div className="max-w-3xl mx-auto py-12 px-8 min-h-full">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="제목을 입력하세요"
                                className="w-full text-4xl font-black text-gray-900 placeholder-gray-300 border-none outline-none mb-8 bg-transparent"
                            />
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="여기에 내용을 입력하세요..."
                                className="w-full h-[calc(100vh-500px)] resize-none text-lg text-gray-700 leading-relaxed border-none outline-none bg-transparent"
                            />

                            {/* ── AI 썸네일 생성 섹션 ── */}
                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4" />
                                    커버 이미지
                                </h3>

                                {/* 생성 중 로딩 애니메이션 */}
                                {isGeneratingThumbnail && (
                                    <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 mb-4">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative w-full max-w-md aspect-[16/9] bg-white rounded-xl overflow-hidden shadow-inner">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/60 to-transparent animate-pulse" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                                        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-semibold text-blue-700">
                                                    ✨ AI가 변호사님의 글에 맞는 이미지를 스케치하고 있습니다...
                                                </p>
                                                <p className="text-xs text-blue-400 mt-1">
                                                    약 10~15초 정도 소요됩니다. 잠시만 기다려주세요.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 생성된 이미지 미리보기 */}
                                {coverImage && !isGeneratingThumbnail && (
                                    <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm mb-4 group">
                                        <img
                                            src={coverImage.startsWith('/') ? `http://localhost:8000${coverImage}` : coverImage}
                                            alt="커버 이미지"
                                            className="w-full aspect-[16/9] object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <button
                                                onClick={handleGenerateThumbnail}
                                                className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-xl font-semibold text-sm shadow-lg hover:bg-white transition-colors"
                                            >
                                                🔄 다시 생성하기
                                            </button>
                                        </div>
                                        <div className="absolute top-3 right-3">
                                            <button
                                                onClick={() => setCoverImage('')}
                                                className="bg-white/80 backdrop-blur-sm text-gray-500 hover:text-red-500 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm transition-colors"
                                                title="이미지 삭제"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 생성 버튼 */}
                                {!coverImage && !isGeneratingThumbnail && (
                                    <button
                                        onClick={handleGenerateThumbnail}
                                        disabled={!content || content.trim().length < 30}
                                        className="w-full py-5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-gray-400 hover:text-blue-600 transition-all flex items-center justify-center gap-3 group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                    >
                                        <SparklesIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="font-semibold text-sm">
                                            ✨ AI 썸네일 생성하기
                                        </span>
                                    </button>
                                )}

                                {!coverImage && !isGeneratingThumbnail && (
                                    <p className="text-xs text-gray-300 text-center mt-2">
                                        글 내용을 분석하여 브랜드 톤에 맞는 일러스트를 자동 생성합니다
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SEO Panel */}
                    <SEOAssistantPanel
                        analysis={analysis}
                        targetKeyword={keyword}
                        onInsertTemplate={handleInsertTemplate}
                    />
                </div>
            </main>
        </div>
    );
}
