"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LawyerMenu from '../../../components/LawyerMenu';
import SEOPreCheckModal from '../../../../app/admin/posts/new/SEOPreCheckModal';
import SEOAssistantPanel from '../../../../components/editor/SEOAssistantPanel';
import { ChevronLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
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

    // Analysis Data
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleModalComplete = (data: any) => {
        setTitle(data.title);
        setKeyword(data.keyword);
        setCategory(data.category);
        if (data.purpose) setPurpose(data.purpose); // Optional check
        setShowModal(false);

        // Initial Template Insertion based on purpose
        const templates: Record<string, string> = {
            'info': `## 1. ${data.keyword}란 무엇인가?\n\n법적으로 ${data.keyword}은(는)...\n\n## 2. 주요 쟁점과 주의사항\n\n많은 분들이 놓치기 쉬운 부분은...\n\n## 3. 변호사의 조언\n\n이러한 상황에서는...`,
            'case': `## 1. 사건의 개요\n\n의뢰인은 ${data.keyword} 혐의로 입건되어...\n\n## 2. 변호인의 조력\n\n저희 법무법인은...\n\n## 3. 결과 및 의의\n\n결국 재판부는...`,
            'myth': `## 1. 흔한 오해: ${data.keyword}, 무조건 처벌받는다?\n\n많은 분들이...\n\n## 2. 진실: 상황에 따라 다릅니다\n\n법적으로 보면...\n\n## 3. 핵심은 입증 책임\n\n따라서 중요한 것은...`,
            'QnA': `## Q1. ${data.keyword} 소송, 얼마나 걸리나요?\n\n통상적으로...\n\n## Q2. 비용은 어떻게 되나요?\n\n사안의 복잡도에 따라...\n\n## Q3. 증거가 부족해도 되나요?\n\n확실한 증거가 없다면...`
        };

        if (!data.content && data.purpose) { // Only set template if content is empty
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
                setShowModal(false); // Skip pre-check
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
        }, 1000); // 1s debounce

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

    const handlePublish = async () => {
        if (!confirm("이 글을 발행하시겠습니까?")) return;

        try {
            // Use existing endpoint for creating magazine content
            const res = await fetch('http://localhost:8000/api/admin/magazine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    keyword,
                    category,
                    purpose,
                    cover_image: coverImage
                })
            });

            if (res.ok) {
                alert("성공적으로 발행되었습니다!");
                router.push('/lawyer/magazine'); // Redirect to lawyer magazine list
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
                    setShowImportModal(false);
                    setShowModal(false); // Close pre-check if open
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
                                className="w-full h-[calc(100vh-300px)] resize-none text-lg text-gray-700 leading-relaxed border-none outline-none bg-transparent"
                            />
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
