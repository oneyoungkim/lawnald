"use client";

import { useEffect } from "react";

export default function CalendarCallbackPage() {
    useEffect(() => {
        // Google OAuth implicit flow: access_token is in the URL hash
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get("access_token");

            if (accessToken && window.opener) {
                window.opener.postMessage(
                    { type: "GOOGLE_CALENDAR_TOKEN", token: accessToken },
                    window.location.origin
                );
                window.close();
            }
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-800 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-zinc-500">Google Calendar 연동 중...</p>
            </div>
        </div>
    );
}
