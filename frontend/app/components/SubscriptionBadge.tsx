"use client";

import { useEffect, useState } from "react";

interface SubscriptionData {
    is_subscribed: boolean;
    is_founder: boolean;
    trial_ends_at: string | null;
    days_remaining: number;
    plan_name: string;
    monthly_price: number;
    has_billing_key: boolean;
}

export default function SubscriptionBadge({ lawyerId }: { lawyerId: string }) {
    const [data, setData] = useState<SubscriptionData | null>(null);

    useEffect(() => {
        if (!lawyerId) return;
        fetch(`http://localhost:8000/api/billing/status/${lawyerId}`)
            .then((res) => res.json())
            .then(setData)
            .catch(() => null);
    }, [lawyerId]);

    if (!data) return null;

    // 파운딩 멤버 + 무료 체험 중
    if (data.is_founder && data.days_remaining > 0) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
                <span className="text-lg">🚀</span>
                <div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        파운딩 멤버 혜택
                    </span>
                    <span className="text-xs text-[#86868b] ml-2">
                        무료 체험 <span className="font-bold text-blue-600 dark:text-blue-400">{data.days_remaining}일</span> 남음
                    </span>
                </div>
            </div>
        );
    }

    // 파운딩 멤버 + 정식 결제 중
    if (data.is_founder && data.is_subscribed) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl">
                <span className="text-lg">💎</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    평생 50% 할인 적용 중
                </span>
                <span className="text-xs text-[#86868b]">
                    월 {data.monthly_price.toLocaleString()}원
                </span>
            </div>
        );
    }

    // 일반 사용자 + 체험 중
    if (data.days_remaining > 0) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                <span className="text-lg">✨</span>
                <span className="text-xs font-bold text-green-600 dark:text-green-400">
                    무료 체험 {data.days_remaining}일 남음
                </span>
            </div>
        );
    }

    // 구독 만료
    if (!data.is_subscribed) {
        return (
            <a
                href="/pricing"
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer"
            >
                <span className="text-lg">⚠️</span>
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                    구독이 만료되었습니다
                </span>
                <span className="text-xs text-red-500 underline ml-1">요금제 보기 →</span>
            </a>
        );
    }

    // 일반 구독 중
    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl">
            <span className="text-lg">✅</span>
            <span className="text-xs font-bold text-[#1d1d1f] dark:text-white">
                {data.plan_name}
            </span>
        </div>
    );
}
