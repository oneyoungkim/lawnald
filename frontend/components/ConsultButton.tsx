
"use client";

import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

export default function ConsultButton({ lawyerId }: { lawyerId: string }) {
    return (
        <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <a
                href={`/lawyer/${lawyerId}/consult`} // Mock link
                className="flex items-center gap-3 px-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full shadow-2xl hover:scale-105 transition-transform font-bold"
                onClick={() => {
                    // Track click
                    fetch('/api/analytics/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            lawyer_id: lawyerId,
                            slug: window.location.pathname.split('/').pop(),
                            event_type: 'conversion',
                            value: 1
                        })
                    }).catch(console.error);
                }}
            >
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                <span>이 분야 변호사 추천받기</span>
            </a>
        </div>
    );
}
