'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function ScrollCTA({ tags, type }: { tags: string[], type: string }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosed, setIsClosed] = useState(false);
    const [showNotice, setShowNotice] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (isClosed) return;
            const scrollPercent =
                (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
            if (scrollPercent > 0.6) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isClosed]);

    if (isClosed) return null;

    return (
        <>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-10 md:w-[400px] z-50"
                    >
                        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5 pr-12 relative overflow-hidden">
                            <button
                                onClick={() => setIsClosed(true)}
                                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-start gap-4">
                                <div className="bg-[#1d1d1f] rounded-full p-2.5 shrink-0">
                                    <span className="text-xl">⚖️</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-main mb-1">
                                        이 사건, 나와 비슷한가요?
                                    </h4>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                                        유사한 승소 사례를 가진 변호사를<br />
                                        <strong>무료로 추천</strong>받아보세요.
                                    </p>
                                    <button
                                        onClick={() => setShowNotice(true)}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-main hover:bg-main/90 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-main/20"
                                    >
                                        추천받기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
        </>
    );
}
