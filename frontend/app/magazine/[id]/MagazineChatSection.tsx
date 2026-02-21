'use client';

import { useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import UserChatWidget from '@/app/components/chat/UserChatWidget';

interface MagazineChatSectionProps {
    lawyerId: string;
    lawyerName: string;
}

export default function MagazineChatSection({ lawyerId, lawyerName }: MagazineChatSectionProps) {
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <>
            <div className="mt-12 mb-16 flex flex-col items-center text-center">
                <div className="text-zinc-500 mb-4 text-sm font-medium">
                    궁금한 점이 있으신가요? 변호사와 직접 상담해보세요.
                </div>
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="group flex items-center gap-3 px-8 py-4 bg-[#1d1d1f] hover:bg-[#2c2c2e] text-white text-lg font-bold rounded-full transition-all shadow-xl shadow-black/5 hover:shadow-2xl hover:-translate-y-1"
                >
                    <div className="relative">
                        <ChatBubbleLeftRightIcon className="w-6 h-6" />
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                    </div>
                    <span>{lawyerName} 변호사와 1:1 상담하기</span>
                </button>
                <div className="mt-3 text-xs text-zinc-400">
                    * 실시간으로 답변을 받으실 수 있습니다.
                </div>
            </div>

            <UserChatWidget
                lawyerId={lawyerId}
                lawyerName={lawyerName}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
        </>
    );
}
