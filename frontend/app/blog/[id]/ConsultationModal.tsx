"use client";

import { useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface ConsultationModalProps {
    isOpen: boolean;
    onClose: () => void;
    lawyerId: string;
    lawyerName: string;
}

export default function ConsultationModal({ isOpen, onClose, lawyerId, lawyerName }: ConsultationModalProps) {
    const [message, setMessage] = useState('');
    const [contact, setContact] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Updated endpoint to use lead generation
            const response = await fetch(`http://localhost:8000/api/lawyers/${lawyerId}/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    case_summary: `${message}\n\n[연락처: ${contact}]`,
                    contact_type: "homepage_modal"
                }),
            });

            if (response.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    onClose();
                    setIsSuccess(false);
                    setMessage('');
                    setContact('');
                }, 2000);
            } else {
                alert('전송에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('Error submitting consultation:', error);
            alert('오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-[var(--blog-primary)] text-white p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                    <h3 className="font-serif text-2xl font-bold mb-1">무료 법률 상담</h3>
                    <p className="text-white/80 text-sm">
                        {lawyerName} 변호사에게 직접 메시지를 남기세요.
                    </p>
                </div>

                {/* Body */}
                <div className="p-6">
                    {isSuccess ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PaperAirplaneIcon className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-800">전송 완료!</h4>
                            <p className="text-slate-500">
                                변호사님이 내용을 확인 후<br />남겨주신 연락처로 연락드립니다.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    상담 내용
                                </label>
                                <textarea
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="어떤 법률 도움이 필요하신가요?&#13;&#10;간단히 상황을 적어주세요."
                                    className="w-full h-32 px-4 py-3 rounded-lg border border-slate-200 focus:border-[var(--blog-primary)] focus:ring-1 focus:ring-[var(--blog-primary)] outline-none resize-none bg-slate-50 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                    연락처
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="핸드폰 번호 또는 이메일"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[var(--blog-primary)] focus:ring-1 focus:ring-[var(--blog-primary)] outline-none bg-slate-50 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-[var(--blog-primary)] text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[var(--blog-primary)]/20 mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? '전송 중...' : '상담 신청하기'}
                            </button>

                            <p className="text-xs text-center text-slate-400 mt-2">
                                * 상담 내용은 비밀이 절대 보장됩니다.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
