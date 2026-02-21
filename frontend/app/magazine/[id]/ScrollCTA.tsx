'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';

export default function ScrollCTA({ tags, type }: { tags: string[], type: string }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosed, setIsClosed] = useState(false);

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

    // Construct recommendation query
    // Use top 2 tags or '이혼', '성범죄' etc from type
    const query = tags.slice(0, 2).join(" ");

    return (
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

                        {/* Close Button */}
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
                                <Link
                                    href={`/?query=${encodeURIComponent(query)}`}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-main hover:bg-main/90 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-main/20"
                                >
                                    추천받기
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
