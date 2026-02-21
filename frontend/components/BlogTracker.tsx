
"use client";

import { useEffect } from "react";

export default function BlogTracker({ lawyerId, slug }: { lawyerId: string; slug: string }) {
    useEffect(() => {
        // Track View
        fetch('http://127.0.0.1:8000/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lawyer_id: lawyerId,
                slug: slug,
                event_type: 'view',
                value: 1
            })
        }).catch(err => console.error("Tracking Error:", err));

        // Track Dwell Time (Simple implementation)
        const startTime = Date.now();
        return () => {
            const dwellTime = (Date.now() - startTime) / 1000;
            if (dwellTime > 5) { // Only track if > 5s
                fetch('http://127.0.0.1:8000/api/analytics/track', {
                    method: 'POST', // Use navigator.sendBeacon in real app for reliability on unload
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lawyer_id: lawyerId,
                        slug: slug,
                        event_type: 'dwell',
                        value: dwellTime
                    })
                }).catch(console.error);
            }
        };
    }, [lawyerId, slug]);

    return null; // Invisible component
}
