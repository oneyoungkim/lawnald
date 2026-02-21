"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SearchForm() {
    const [query, setQuery] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [hasTyped, setHasTyped] = useState(false);
    const [progress, setProgress] = useState(0);
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

    // Handle typing "breathing" effect trigger (one-time)
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
        setProgress(0);

        // Simulate progress calculation simulating analysis time
        // Total time approx 2000ms - 2500ms
        const duration = 2000;
        const intervalTime = 20;
        const steps = duration / intervalTime;
        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            const newProgress = Math.min((currentStep / steps) * 100, 100);

            setProgress(newProgress);

            if (currentStep >= steps) {
                clearInterval(interval);
                const url = `/result?q=${encodeURIComponent(query)}`;
                router.push(url);
            }
        }, intervalTime);
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

                <div className="flex flex-col items-center gap-6 mt-8">
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
                        {isAnalyzing && (
                            <div
                                className="absolute left-0 top-0 h-full bg-point transition-all duration-100 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        )}

                        <div className="relative z-10 flex items-center gap-2">
                            {isAnalyzing ? (
                                <span>분석 중 {Math.round(progress)}%</span>
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
