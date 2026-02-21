"use client";

import { useEffect, useState, useRef } from "react";

interface Message {
    sender: "user" | "lawyer";
    content: string;
    timestamp: string;
}

interface ChatRoomProps {
    lawyerId: string;
    clientId: string;
    onClose: () => void;
}

export default function ChatRoom({ lawyerId, clientId, onClose }: ChatRoomProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch history
    useEffect(() => {
        fetch(`http://localhost:8000/api/chats/${encodeURIComponent(lawyerId)}/${clientId}/messages`)
            .then(res => res.json())
            .then(data => setMessages(data))
            .catch(console.error);
    }, [lawyerId, clientId]);

    // Connect WebSocket
    useEffect(() => {
        const socket = new WebSocket(`ws://localhost:8003/ws/chat/${encodeURIComponent(lawyerId)}/${clientId}/lawyer`);

        socket.onopen = () => {
            console.log("Connected to chat");
            setIsConnected(true);
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages(prev => [...prev, message]);
        };

        socket.onclose = () => {
            console.log("Disconnected from chat");
            setIsConnected(false);
        };

        ws.current = socket;

        return () => {
            socket.close();
        };
    }, [lawyerId, clientId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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

    return (
        <div className="flex flex-col h-full bg-[#b2c7da] dark:bg-[#1c1c1e]">
            {/* Header */}
            <div className="bg-white dark:bg-[#2c2c2e] px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                        {clientId.slice(0, 2)}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">의뢰인 ({clientId.slice(0, 4)}...)</div>
                        <div className="text-xs text-green-500 flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            {isConnected ? '실시간 접속 중' : '연결 끊김'}
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender === "lawyer";
                    return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 mr-2 self-start shrink-0">
                                    User
                                </div>
                            )}
                            <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm shadow-sm ${isMe
                                ? 'bg-[#ffeeb0] text-black'
                                : 'bg-white text-black'
                                }`}>
                                <div className="break-words whitespace-pre-wrap">{msg.content}</div>
                                <div className={`text-[10px] mt-1 ${isMe ? 'text-gray-500' : 'text-gray-400'} text-right`}>
                                    {msg.timestamp?.split(' ')[1]?.slice(0, 5)}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-[#2c2c2e] p-3 shrink-0">
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="메시지를 입력하세요"
                        className="flex-1 bg-gray-100 dark:bg-[#1c1c1e] text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ffeeb0] resize-none h-[42px]"
                        disabled={!isConnected}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || !isConnected}
                        className={`px-4 rounded-lg text-sm font-semibold transition-colors ${input.trim()
                            ? 'bg-[#ffeeb0] text-black hover:bg-[#ffe690]'
                            : 'bg-gray-100 text-gray-400'
                            }`}
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
}
