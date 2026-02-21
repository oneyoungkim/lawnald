"use client";

import { useState } from "react";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import UserChatWidget from "@/app/components/chat/UserChatWidget";

interface ChatButtonProps {
    lawyerId: string;
    lawyerName: string;
    show?: boolean;
}

export default function ChatButton({ lawyerId, lawyerName, show = true }: ChatButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!show) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#eab308] text-white rounded-full font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[#eab308]/20"
            >
                <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                채팅 상담
            </button>

            <UserChatWidget
                lawyerId={lawyerId}
                lawyerName={lawyerName}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}
