"use client";

import { useEffect, useState } from "react";

interface ChatSession {
    lawyer_id: string;
    client_id: string;
    messages: any[];
    last_updated: string;
}

interface ChatListProps {
    lawyerId: string;
    onSelectChat: (clientId: string) => void;
    refreshTrigger?: any;
}

export default function ChatList({ lawyerId, onSelectChat, refreshTrigger }: ChatListProps) {
    const [chats, setChats] = useState<ChatSession[]>([]);

    useEffect(() => {
        const fetchChats = () => {
            fetch(`http://localhost:8000/api/lawyers/${encodeURIComponent(lawyerId)}/chats`)
                .then(res => res.json())
                .then(data => setChats(data))
                .catch(console.error);
        };

        fetchChats();

        // Poll for updates every 2 seconds
        const interval = setInterval(fetchChats, 2000);

        return () => clearInterval(interval);
    }, [lawyerId, refreshTrigger]);

    if (chats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-xl">💬</div>
                <p className="text-sm">진행 중인 상담이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            {chats.map((chat) => {
                const lastMsg = chat.messages[chat.messages.length - 1];
                const unreadCount = 0; // Future implementation

                return (
                    <div
                        key={chat.client_id}
                        onClick={() => onSelectChat(chat.client_id)}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm shadow-inner">
                                {chat.client_id.slice(0, 2)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="text-sm font-bold text-gray-900 truncate">문의자 ({chat.client_id.slice(0, 4)}...)</h4>
                                <span className="text-[10px] text-gray-400">{new Date(chat.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate font-medium">
                                {lastMsg ? lastMsg.content : "대화가 시작되었습니다."}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
