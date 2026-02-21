"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    SparklesIcon,
    DocumentDuplicateIcon,
    ArrowLeftIcon,
    CheckIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function DocumentGeneratorPage() {
    const router = useRouter();

    // Form State
    const [senderName, setSenderName] = useState('');
    const [senderAddress, setSenderAddress] = useState('');
    const [senderPhone, setSenderPhone] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [facts, setFacts] = useState('');

    // Generation State
    const [generatedDocument, setGeneratedDocument] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        // Validation
        if (!senderName || !senderAddress || !recipientName || !recipientAddress || !facts) {
            setError('모든 필수 항목을 입력해 주세요.');
            return;
        }
        if (facts.trim().length < 30) {
            setError('사실관계를 최소 30자 이상 입력해 주세요.');
            return;
        }

        setError('');
        setIsGenerating(true);
        setGeneratedDocument('');

        try {
            const res = await fetch('http://localhost:8000/api/generate-notice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_name: senderName,
                    sender_address: senderAddress,
                    sender_phone: senderPhone,
                    recipient_name: recipientName,
                    recipient_address: recipientAddress,
                    facts: facts,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.detail || '내용증명 생성에 실패했습니다.');
            }

            const data = await res.json();
            setGeneratedDocument(data.document);
        } catch (e: any) {
            console.error('Document generation failed:', e);
            setError(e.message || '서버 오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedDocument);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = generatedDocument;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0a0a0a]">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/lawyer/dashboard')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-amber-500" />
                                AI 내용증명 초안 생성기
                            </h1>
                            <p className="text-xs text-gray-400">사실관계를 입력하면, AI가 법조 문서 양식에 맞춰 내용증명 초안을 작성합니다</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* ── 왼쪽: 입력 폼 ── */}
                    <div className="space-y-6">

                        {/* 발신인 정보 */}
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center text-xs font-black">1</span>
                                발신인 정보 (보내는 분)
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">성명 *</label>
                                    <input
                                        type="text"
                                        value={senderName}
                                        onChange={(e) => setSenderName(e.target.value)}
                                        placeholder="홍길동"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">주소 *</label>
                                    <input
                                        type="text"
                                        value={senderAddress}
                                        onChange={(e) => setSenderAddress(e.target.value)}
                                        placeholder="서울특별시 강남구 테헤란로 123"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">연락처 (선택)</label>
                                    <input
                                        type="text"
                                        value={senderPhone}
                                        onChange={(e) => setSenderPhone(e.target.value)}
                                        placeholder="010-1234-5678"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 수신인 정보 */}
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg flex items-center justify-center text-xs font-black">2</span>
                                수신인 정보 (받는 분)
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">성명 *</label>
                                    <input
                                        type="text"
                                        value={recipientName}
                                        onChange={(e) => setRecipientName(e.target.value)}
                                        placeholder="김철수"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">주소 *</label>
                                    <input
                                        type="text"
                                        value={recipientAddress}
                                        onChange={(e) => setRecipientAddress(e.target.value)}
                                        placeholder="서울특별시 서초구 법원로 1"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 사실관계 */}
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg flex items-center justify-center text-xs font-black">3</span>
                                핵심 사실관계 및 요구사항
                            </h2>
                            <textarea
                                value={facts}
                                onChange={(e) => setFacts(e.target.value)}
                                placeholder={`예시:\n\n2024년 3월 1일 수신인에게 보증금 5,000만원을 지불하고 서울시 강남구 소재 아파트 임대차계약을 체결하였습니다. 계약 기간은 2024년 3월 1일부터 2026년 2월 28일까지였으나, 수신인은 계약 종료 후에도 보증금을 반환하지 않고 있습니다.\n\n보증금 5,000만원의 즉시 반환을 요구합니다.`}
                                rows={10}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none leading-relaxed"
                            />
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-400">
                                    구체적으로 작성할수록 더 정확한 문서가 생성됩니다
                                </p>
                                <p className="text-xs text-gray-300">
                                    {facts.length}자
                                </p>
                            </div>
                        </div>

                        {/* 에러 메시지 */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        {/* 생성 버튼 */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    AI가 내용증명을 작성하고 있습니다...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5" />
                                    ✨ AI 내용증명 초안 생성
                                </>
                            )}
                        </button>
                    </div>

                    {/* ── 오른쪽: 생성 결과 ── */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                            {/* Result Header */}
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    📄 생성된 내용증명
                                </h2>
                                {generatedDocument && (
                                    <button
                                        onClick={handleCopy}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${copied
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-gray-300'
                                            }`}
                                    >
                                        {copied ? (
                                            <>
                                                <CheckIcon className="w-4 h-4" />
                                                복사 완료!
                                            </>
                                        ) : (
                                            <>
                                                <DocumentDuplicateIcon className="w-4 h-4" />
                                                문서 복사하기
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Result Body */}
                            <div className="p-6">
                                {isGenerating ? (
                                    /* Loading Animation */
                                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900 rounded-full" />
                                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                                AI 변호사가 내용증명을 작성 중입니다
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                약 10~20초 정도 소요됩니다
                                            </p>
                                        </div>
                                        {/* Skeleton lines */}
                                        <div className="w-full space-y-3 mt-4">
                                            {[...Array(8)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-full animate-pulse"
                                                    style={{ width: `${65 + Math.random() * 35}%`, animationDelay: `${i * 150}ms` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : generatedDocument ? (
                                    /* Editable Result */
                                    <textarea
                                        value={generatedDocument}
                                        onChange={(e) => setGeneratedDocument(e.target.value)}
                                        className="w-full h-[calc(100vh-280px)] min-h-[500px] bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200 leading-[1.9] resize-none font-['Noto_Serif_KR',serif]"
                                    />
                                ) : (
                                    /* Empty State */
                                    <div className="flex flex-col items-center justify-center py-24 text-center">
                                        <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                            <span className="text-4xl">📜</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-1">
                                            왼쪽에 정보를 입력하고
                                        </p>
                                        <p className="text-sm text-gray-300 dark:text-gray-600">
                                            [✨ AI 내용증명 초안 생성] 버튼을 눌러주세요
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
