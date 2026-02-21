"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartData {
    name: string;
    value: number;
    growth: number;
}

interface StatsChartsProps {
    casesData: ChartData[];
    consultsData: ChartData[];
}

export default function StatsCharts({ casesData, consultsData }: StatsChartsProps) {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-zinc-800 p-3 border border-gray-100 dark:border-zinc-700 shadow-lg rounded-lg text-xs">
                    <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
                    <p className="text-[#1E293B] dark:text-blue-400 font-semibold">
                        {payload[0].value}건
                    </p>
                    <p className={`${data.growth >= 0 ? 'text-red-500' : 'text-blue-500'} font-medium`}>
                        {data.growth >= 0 ? '+' : ''}{data.growth}% (전월 대비)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Case Stats */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[20px] border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-[#1E293B] dark:text-gray-100">최근 30일 사건 분야 (Top 5)</h3>
                    <span className="text-xs text-gray-400 px-2 py-1 bg-gray-50 dark:bg-zinc-800 rounded-md">Case Created 기준</span>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={casesData} layout="vertical" margin={{ left: 40 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tick={{ fontSize: 11, fill: '#64748B' }}
                                width={70}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                {casesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#1E293B' : '#94A3B8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Consultation Stats */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[20px] border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-[#1E293B] dark:text-gray-100">최근 30일 상담 분야 (Top 5)</h3>
                    <span className="text-xs text-gray-400 px-2 py-1 bg-gray-50 dark:bg-zinc-800 rounded-md">Consult Started 기준</span>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={consultsData} layout="vertical" margin={{ left: 40 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tick={{ fontSize: 11, fill: '#64748B' }}
                                width={70}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                {consultsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#93C5FD'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
