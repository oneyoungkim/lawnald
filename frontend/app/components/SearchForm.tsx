"use client";

import { useState, useRef, useEffect } from "react";

export default function SearchForm() {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [hasTyped, setHasTyped] = useState(false);
    const [showNotice, setShowNotice] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowNotice(true);
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
                        <p className="text-zinc-400 text-xs sm:text-sm font-normal tracking-tight">
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
                            w-full min-h-[12rem] font-sans border-2 border-gray-300 p-8 text-main text-xl 
                            transition-all duration-200 ease-out resize-none leading-relaxed rounded-[20px] 
                            placeholder-transparent 
                            focus:outline-none focus:ring-2 focus:ring-point/30 focus:border-point/40
                            ${isFocused ? 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]' : 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]'}
                            ${hasTyped && isFocused ? 'animate-breathe' : ''}
                        `}
                    />
                </div>

                <div className="flex flex-col items-center gap-6 mt-4">
                    <button
                        type="submit"
                        className={`
                            group relative w-full sm:w-auto min-w-[200px] h-[56px]
                            bg-main text-white text-base font-semibold rounded-[16px]
                            transition-all duration-200 ease-out
                            shadow-lg shadow-main/20
                            flex items-center justify-center gap-2 overflow-hidden
                            hover:bg-main/90 hover:shadow-xl active:translate-y-[1px]
                        `}
                    >
                        <div className="relative z-10 flex items-center gap-2">
                            <span>변호사 추천받기</span>
                        </div>
                    </button>
                </div>
            </form>

            {showNotice && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowNotice(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md mx-4 p-8 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-50 flex items-center justify-center">
                            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-3">서비스 준비 중</h3>
                        <p className="text-zinc-600 text-sm leading-relaxed mb-6">
                            대한변호사협회와 심도 깊은 논의 뒤<br />
                            오픈하겠습니다.
                        </p>
                        <button
                            onClick={() => setShowNotice(false)}
                            className="px-8 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
