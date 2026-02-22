"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const SUGGESTED_QUERIES = [
    "보이스피싱 피해",
    "이혼 재산분할",
    "교통사고 합의금",
    "임대차 보증금 미반환",
    "직장 내 괴롭힘",
    "상속 분쟁",
];

export default function SearchForm() {
    const [query, setQuery] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [hasTyped, setHasTyped] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;
        }
    }, [query]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setQuery(e.target.value);
        if (!hasTyped && e.target.value.length > 0) {
            setHasTyped(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            textareaRef.current?.focus();
            return;
        }
        setIsAnalyzing(true);
        router.push(`/result?q=${encodeURIComponent(query)}`);
    };

    const handleTagClick = (tag: string) => {
        setQuery(tag);
        setHasTyped(true);
        // Focus textarea so user can append more details
        textareaRef.current?.focus();
    };

    const hasText = query.length > 0;

    return (
        <div className="w-full max-w-2xl relative">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <style jsx global>{`
                    @keyframes breathe {
                        0% { box-shadow: 0 4px 20px rgba(197, 160, 101, 0.05); }
                        50% { box-shadow: 0 0 25px rgba(197, 160, 101, 0.15); }
                        100% { box-shadow: 0 4px 20px rgba(197, 160, 101, 0.05); }
                    }
                    .animate-breathe {
                        animation: breathe 0.3s ease-out forwards;
                    }
                `}</style>
                <div className="relative w-full group">
                    <div
                        className={`absolute top-8 left-8 right-8 pointer-events-none transition-opacity duration-300 ${query ? 'opacity-0' : 'opacity-100'}`}
                    >
                        <p className="text-zinc-400 text-xs sm:text-sm font-normal tracking-tight truncate">
                            지금 어떤 상황인가요? 자세히 말씀해주시면 변호사 추천 정확도가 올라갑니다.
                        </p>
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={query}
                        onChange={handleChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        rows={1}
                        className={`
                            w-full min-h-[12rem] font-sans border border-point/10 p-8 text-main text-xl 
                            transition-all duration-200 ease-out resize-none leading-relaxed rounded-[20px] 
                            placeholder-transparent 
                            focus:outline-none focus:ring-2 focus:ring-point/20 focus:border-point/20
                            ${isFocused ? 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)]' : 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]'}
                            ${hasTyped && isFocused ? 'animate-breathe' : ''}
                        `}
                    />
                </div>

                {/* Suggested query tags */}
                {!hasText && (
                    <div className="flex flex-wrap gap-2 justify-center px-2">
                        {SUGGESTED_QUERIES.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => handleTagClick(tag)}
                                className="px-3 py-1.5 text-xs sm:text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-800 border border-gray-200 rounded-full transition-all duration-200"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex flex-col items-center gap-6 mt-4">
                    <button
                        type="submit"
                        disabled={isAnalyzing || !hasText}
                        className={`
                            group
                            relative w-full sm:w-auto min-w-[200px] h-[56px]
                            bg-main text-white text-base font-semibold rounded-[16px]
                            transition-all duration-200 ease-out
                            shadow-lg shadow-main/20
                            flex items-center justify-center gap-2
                            overflow-hidden
                            disabled:opacity-50 disabled:cursor-default disabled:transform-none
                            ${hasText ? 'opacity-100 hover:bg-main/90 hover:shadow-xl active:translate-y-[1px]' : 'opacity-85'}
                        `}
                    >
                        <div className="relative z-10 flex items-center gap-2">
                            {isAnalyzing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <span>분석 중...</span>
                                </>
                            ) : (
                                <span>변호사 추천받기</span>
                            )}
                        </div>
                    </button>
                </div>
            </form>
        </div>
    );
}
