"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ActionSuggestion {
    id: string;
    title: string;
    description: string;
    priority: number;
    cta_label: string;
    cta_link: string;
    icon: string;
}

export default function ActionWidget({ lawyerId }: { lawyerId: string }) {
    const [actions, setActions] = useState<ActionSuggestion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!lawyerId) return;

        // Fetch actions from API
        fetch(`http://localhost:8000/api/dashboard/actions?lawyer_id=${lawyerId}`)
            .then(res => res.json())
            .then(data => {
                setActions(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch actions:", err);
                setLoading(false);
            });
    }, [lawyerId]);

    if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl mb-6"></div>;
    if (actions.length === 0) return null;

    return (
        <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-blue-600">⚡ 오늘의 추천 활동</span>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">AI 분석</span>
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
                {actions.map((action) => (
                    <div key={action.id} className="bg-white dark:bg-zinc-900 border border-blue-100 dark:border-blue-900/30 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-110" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="text-3xl mb-3">{action.icon}</div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                                {action.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1">
                                {action.description}
                            </p>
                            <Link
                                href={action.cta_link}
                                className="inline-block text-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2.5 px-4 rounded-lg transition-colors w-full"
                            >
                                {action.cta_label}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
