"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LawyerMenu from "../../components/LawyerMenu";
import ChatList from "../../components/chat/ChatList";
import ChatRoom from "../../components/chat/ChatRoom";
import { NotificationProvider, useNotification } from "../../context/NotificationContext";

function ChatHistoryContent() {
    const router = useRouter();
    const [lawyer, setLawyer] = useState<any>(null);
    const [selectedChatClient, setSelectedChatClient] = useState<string | null>(null);
    const { lastMessage } = useNotification();

    useEffect(() => {
        const stored = localStorage.getItem("lawyer_user");
        if (stored) {
            setLawyer(JSON.parse(stored));
        } else {
            router.push("/login");
        }
    }, [router]);

    if (!lawyer) return null;

    return (
        <main className="min-h-screen bg-background text-foreground font-sans flex">
            <LawyerMenu />

            <div className="flex-1 ml-0 md:ml-80 transition-all duration-300">
                <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-point/20 px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-serif font-bold text-main">채팅 상담내역</h1>
                </header>

                <div className="p-8 h-[calc(100vh-80px)]">
                    <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-sm border border-point/10 h-full overflow-hidden flex">

                        {/* Chat List Sidebar */}
                        <div className={`w-full md:w-1/3 border-r border-point/10 flex flex-col ${selectedChatClient ? 'hidden md:flex' : 'flex'}`}>
                            <div className="p-4 border-b border-point/10">
                                <h2 className="font-bold text-zinc-700 dark:text-zinc-300">대화 목록</h2>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <ChatList
                                    lawyerId={lawyer.id}
                                    onSelectChat={setSelectedChatClient}
                                    refreshTrigger={lastMessage}
                                />
                            </div>
                        </div>

                        {/* Chat Room Area */}
                        <div className={`w-full md:w-2/3 flex flex-col ${!selectedChatClient ? 'hidden md:flex' : 'flex'}`}>
                            {selectedChatClient ? (
                                <ChatRoom
                                    lawyerId={lawyer.id}
                                    clientId={selectedChatClient}
                                    onClose={() => setSelectedChatClient(null)}
                                />
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-2xl">💬</div>
                                    <p>좌측 목록에서 상담을 선택해주세요.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}

export default function ChatHistoryPage() {
    return (
        <NotificationProvider>
            <ChatHistoryContent />
        </NotificationProvider>
    );
}
