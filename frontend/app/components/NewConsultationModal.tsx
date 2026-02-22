"use client";

import { API_BASE } from "@/lib/api";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface NewConsultationModalProps {
    isOpen: boolean;
    onClose: () => void;
    lawyerId: string;
}

export default function NewConsultationModal({ isOpen, onClose, lawyerId }: NewConsultationModalProps) {
    const router = useRouter();
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!text.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/consultations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: text,
                    lawyer_id: lawyerId
                })
            });

            if (!res.ok) throw new Error("분석에 실패했습니다.");

            const data = await res.json();
            // Redirect to the list or detail page? 
            // For now, reload dashboard or go to detail.
            // Let's go to the new detail page (which we need to create).
            // But we don't have the page yet. Let's just reload.
            alert("상담이 추가되었습니다. AI 분석이 완료되었습니다.");
            window.location.reload();
            // Or better: router.refresh() if using Next.js 13+ app dir features correctly, 
            // but window.location.reload is safer for this mock.
            onClose();
        } catch (e) {
            console.error(e);
            alert("오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold">새 상담 추가</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            상담 내용 또는 사연
                        </label>
                        <textarea
                            className="w-full h-64 p-4 border border-gray-200 dark:border-zinc-700 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800"
                            placeholder="의뢰인의 사연이나 상담 메모를 여기에 붙여넣으세요. AI가 자동으로 분석하여 요약, 쟁점, 체크리스트를 생성합니다."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-200 mb-6 flex gap-3 items-start">
                        <span className="text-xl">🤖</span>
                        <p>
                            입력된 내용은 자동으로 분석되어 사건 분류, 중요도, 핵심 쟁점, 필요 증거 목록 등으로 정리됩니다.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !text.trim()}
                            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    분석 중...
                                </>
                            ) : (
                                "분석 및 저장"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
