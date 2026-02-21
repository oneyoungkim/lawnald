
"use client";

import { useState, useEffect } from "react";
import {
    ChartBarIcon,
    CursorArrowRaysIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";

interface AnalyticsData {
    period: string;
    total_views: number;
    total_dwell_time: number;
    total_clicks: number;
    total_conversions: number;
    top_posts: {
        title: string;
        views: number;
        dwell_time: number;
        conversions: number;
    }[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data fetch - In real app, fetch from /api/lawyers/{id}/analytics
        // For prototype, we simulate loading mock data as the backend endpoint requires data to be populated first
        setTimeout(() => {
            setData({
                period: "2025.02",
                total_views: 1250,
                total_dwell_time: 345, // seconds avg
                total_clicks: 45,
                total_conversions: 12,
                top_posts: [
                    { title: "이혼 소송 절차 가이드", views: 450, dwell_time: 180, conversions: 5 },
                    { title: "양육비 산정 기준 2025", views: 320, dwell_time: 240, conversions: 4 },
                    { title: "상간녀 위자료 청구 소송", views: 210, dwell_time: 150, conversions: 2 },
                ]
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) return <div className="p-12 text-center text-zinc-500">Loading analytics...</div>;
    if (!data) return <div className="p-12 text-center">No data available</div>;

    const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-2xl">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-zinc-500 text-sm font-medium mb-1">{title}</h3>
                    <div className="text-3xl font-bold font-serif">{value}</div>
                </div>
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
            </div>
            {sub && <div className="text-xs text-zinc-400">{sub}</div>}
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <header className="mb-10">
                <h1 className="text-3xl font-bold font-serif mb-2">Monthly SEO Report</h1>
                <p className="text-zinc-500">2025년 2월 콘텐츠 성과 분석</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatCard
                    title="총 조회수"
                    value={data.total_views.toLocaleString()}
                    sub="전월 대비 +12%"
                    icon={ChartBarIcon}
                    color="bg-blue-500"
                />
                <StatCard
                    title="평균 체류 시간"
                    value={`${Math.floor(data.total_dwell_time / 60)}분 ${data.total_dwell_time % 60}초`}
                    sub="업계 평균 상위 5%"
                    icon={ClockIcon}
                    color="bg-green-500"
                />
                <StatCard
                    title="상담 전환"
                    value={data.total_conversions}
                    sub="전월 대비 +3건"
                    icon={ChatBubbleLeftRightIcon}
                    color="bg-amber-500"
                />
                <StatCard
                    title="CTA 클릭"
                    value={data.total_clicks}
                    sub="클릭률 3.6%"
                    icon={CursorArrowRaysIcon}
                    color="bg-purple-500"
                />
            </div>

            <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-8 overflow-hidden">
                <h2 className="text-xl font-bold font-serif mb-6">인기 콘텐츠 TOP 3</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500">
                                <th className="pb-4 font-medium pl-4">콘텐츠 제목</th>
                                <th className="pb-4 font-medium text-right">조회수</th>
                                <th className="pb-4 font-medium text-right">체류 시간</th>
                                <th className="pb-4 font-medium text-right pr-4">상담 전환</th>
                            </tr>
                        </thead>
                        <tbody className="text-zinc-700 dark:text-zinc-300">
                            {data.top_posts.map((post, i) => (
                                <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="py-4 pl-4 font-medium">{post.title}</td>
                                    <td className="py-4 text-right">{post.views.toLocaleString()}</td>
                                    <td className="py-4 text-right">{Math.floor(post.dwell_time / 60)}분 {post.dwell_time % 60}초</td>
                                    <td className="py-4 text-right pr-4 font-bold">{post.conversions}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
