"use client";

import { useState } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    Bars3CenterLeftIcon,
    DocumentTextIcon,
    TagIcon
} from '@heroicons/react/24/outline';

interface SEOAnalysisProps {
    score: number;
    issues: string[];
    details: {
        char_count: number;
        reading_time: number;
        keyword_stats: {
            count: number;
            density: number;
            status: string;
        };
        headings: number;
    };
    loading: boolean;
}

export default function SEOAssistantPanel({ analysis, targetKeyword, onInsertTemplate }: {
    analysis: SEOAnalysisProps | null,
    targetKeyword: string,
    onInsertTemplate: (type: 'h2' | 'h3' | 'intro' | 'outro') => void
}) {
    const [isOpen, setIsOpen] = useState(true);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition-all z-40"
            >
                <SparklesIcon className="w-6 h-6" />
            </button>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="w-80 border-l border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-blue-500" />
                    SEO 도우미
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-6">
                {/* Score Card */}
                {analysis ? (
                    <div className={`p-4 rounded-xl border ${getScoreColor(analysis.score)} text-center`}>
                        <div className="text-sm font-medium opacity-80 mb-1">SEO 점수</div>
                        <div className="text-4xl font-black">{analysis.score}점</div>
                    </div>
                ) : (
                    <div className="p-4 rounded-xl bg-gray-50 text-center text-gray-500 text-sm">
                        작성을 시작하면 분석됩니다.
                    </div>
                )}

                {/* Target Keyword Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-2 flex items-center gap-1">
                        <TagIcon className="w-3 h-3" />
                        Target Keyword
                    </div>
                    <div className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                        {targetKeyword || "미설정"}
                    </div>
                    {analysis && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 flex justify-between">
                            <span>사용 횟수: {analysis.details.keyword_stats.count}회</span>
                            <span className={analysis.details.keyword_stats.status === 'good' ? 'text-green-600' : 'text-red-500'}>
                                {analysis.details.keyword_stats.density}% ({analysis.details.keyword_stats.status})
                            </span>
                        </div>
                    )}
                </div>

                {/* Checklist */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">개선 필요 사항</h4>
                    <ul className="space-y-2">
                        {analysis?.issues.length === 0 ? (
                            <li className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircleIcon className="w-4 h-4" />
                                모든 조건이 충족되었습니다!
                            </li>
                        ) : (
                            analysis?.issues.map((issue, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                    {issue}
                                </li>
                            ))
                        )}
                        {!analysis && <li className="text-sm text-gray-400">내용을 입력해주세요.</li>}
                    </ul>
                </div>

                {/* Templates */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">구조 템플릿 삽입</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onInsertTemplate('h2')}
                            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium border border-gray-200"
                        >
                            H2 소제목
                        </button>
                        <button
                            onClick={() => onInsertTemplate('h3')}
                            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium border border-gray-200"
                        >
                            H3 소제목
                        </button>
                        <button
                            onClick={() => onInsertTemplate('intro')}
                            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium border border-gray-200"
                        >
                            서론 (인사말)
                        </button>
                        <button
                            onClick={() => onInsertTemplate('outro')}
                            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium border border-gray-200"
                        >
                            맺음말 (연락처)
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {analysis && (
                    <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-xs text-gray-400">읽는 시간</div>
                            <div className="font-bold text-gray-800 dark:text-white">{analysis.details.reading_time}분</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400">글자 수</div>
                            <div className="font-bold text-gray-800 dark:text-white">{analysis.details.char_count}자</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        </svg>
    );
}

function XMarkIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
    );
}
