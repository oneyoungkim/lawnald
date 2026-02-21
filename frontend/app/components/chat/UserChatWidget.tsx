"use client";

import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';

interface Message {
    sender: "user" | "lawyer";
    content: string;
    timestamp: string;
}

interface UserChatWidgetProps {
    lawyerId: string;
    lawyerName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function UserChatWidget({ lawyerId, lawyerName, isOpen, onClose }: UserChatWidgetProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [clientId, setClientId] = useState<string>("");

    const ws = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Client ID
    useEffect(() => {
        let storedId = localStorage.getItem("lawnald_client_id");
        if (!storedId) {
            storedId = uuidv4();
            localStorage.setItem("lawnald_client_id", storedId);
        }
        setClientId(storedId);
    }, []);

    // Fetch history
    useEffect(() => {
        if (!isOpen || !clientId) return;

        fetch(`http://localhost:8000/api/chats/${encodeURIComponent(lawyerId)}/${clientId}/messages`)
            .then(res => res.json())
            .then(data => setMessages(data))
            .catch(console.error);
    }, [lawyerId, clientId, isOpen]);

    // Connect WebSocket
    useEffect(() => {
        if (!isOpen || !clientId) return;

        console.log(`Connecting to chat: ${lawyerId}, ${clientId}`);
        const socket = new WebSocket(`ws://localhost:8003/ws/chat/${encodeURIComponent(lawyerId)}/${clientId}/user`);

        socket.onopen = () => {
            console.log("Connected to chat (User)");
            setIsConnected(true);
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages(prev => [...prev, message]);
        };

        socket.onclose = () => {
            console.log("Disconnected from chat (User)");
            setIsConnected(false);
        };

        ws.current = socket;

        return () => {
            socket.close();
        };
    }, [lawyerId, clientId, isOpen]);

    // Auto-scroll
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const sendMessage = () => {
        if (!input.trim() || !ws.current) return;
        ws.current.send(input);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 w-[350px] h-[500px] bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] flex flex-col z-[100] overflow-hidden border border-gray-100 dark:border-zinc-800 animate-slide-up">
            {/* Header */}
            <div className="bg-[#1d1d1f] text-white px-4 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                        {lawyerName.slice(0, 1)}
                    </div>
                    <div>
                        <div className="text-sm font-bold">{lawyerName} 변호사</div>
                        <div className="text-[10px] text-white/70 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                            {isConnected ? '답변 가능' : '연결 끊김'}
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f5f5f7] dark:bg-[#151516]">
                <div className="text-center text-xs text-gray-400 my-2">
                    상담 내용은 변호사에게만 전달됩니다.
                </div>
                {messages.map((msg, idx) => {
                    const isMe = msg.sender === "user";
                    return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[8px] font-bold text-gray-600 mr-2 self-start shrink-0">
                                    L
                                </div>
                            )}
                            <div className={`max-w-[80%] px-3 py-2 rounded-[16px] text-sm shadow-sm ${isMe
                                ? 'bg-[#007aff] text-white rounded-br-none'
                                : 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white rounded-bl-none'
                                }`}>
                                <div className="break-words whitespace-pre-wrap">{msg.content}</div>
                                <div className={`text-[9px] mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'} text-right`}>
                                    {msg.timestamp?.split(' ')[1]?.slice(0, 5)}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white dark:bg-[#1c1c1e] p-3 shrink-0 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="문의하실 내용을 입력하세요..."
                        className="flex-1 bg-transparent text-sm text-[#1d1d1f] dark:text-white focus:outline-none resize-none h-[40px] pt-2"
                        disabled={!isConnected}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || !isConnected}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${input.trim()
                            ? 'bg-[#007aff] text-white hover:scale-105'
                            : 'bg-gray-100 text-gray-400'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
