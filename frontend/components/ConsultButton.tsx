
"use client";

import { useState } from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

export default function ConsultButton({ lawyerId }: { lawyerId: string }) {
    const [showNotice, setShowNotice] = useState(false);

    return (
        <>
            <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <button
                    onClick={() => setShowNotice(true)}
                    className="flex items-center gap-3 px-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full shadow-2xl hover:scale-105 transition-transform font-bold"
                >
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                    <span>이 분야 변호사 추천받기</span>
                </button>
            </div>

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
