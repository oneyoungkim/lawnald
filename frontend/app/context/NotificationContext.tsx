"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface NotificationContextType {
    lastMessage: any;
    unreadCount: number;
    resetUnread: () => void;
    isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
    lastMessage: null,
    unreadCount: 0,
    resetUnread: () => { },
    isConnected: false,
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const router = useRouter();

    // Audio for notification
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio("/sounds/notification.mp3");
    }, []);

    useEffect(() => {
        // Check for lawyer login
        const stored = localStorage.getItem("lawyer_user");
        if (!stored) {
            console.log("NotificationContext: No lawyer_user found in localStorage");
            return;
        }

        let lawyer;
        try {
            lawyer = JSON.parse(stored);
            console.log("NotificationContext: Found lawyer:", lawyer.id);
        } catch (e) {
            console.error("NotificationContext: Failed to parse lawyer_user", e);
            return;
        }

        const wsUrl = `ws://localhost:8003/ws/monitor/${encodeURIComponent(lawyer.id)}`;

        const connect = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) return;

            console.log("Connecting to Notification Monitor:", wsUrl);
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log("Notification Monitor Connected");
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "new_message") {
                        setLastMessage(data);
                        setUnreadCount(prev => prev + 1);

                        // Play Sound
                        if (audioRef.current) {
                            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
                        }

                        // Show visual toast/notification (Browser Notification API could be added here)
                        // For now we rely on UI updates via context
                    }
                } catch (e) {
                    console.error("Notification parse error:", e);
                }
            };

            ws.onclose = () => {
                console.log("Notification Monitor Disconnected");
                setIsConnected(false);
                // Reconnect logic could go here
                setTimeout(connect, 3000);
            };

            wsRef.current = ws;
        };

        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const resetUnread = () => {
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider value={{ lastMessage, unreadCount, resetUnread, isConnected }}>
            {children}
            {/* Global Toast UI moved to LawyerDashboard for better control */}
        </NotificationContext.Provider>
    );
};
