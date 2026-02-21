"use client";

interface DemandStat {
    category: string;
    case_count: number;
    lawyer_count: number;
    ratio: number;
    growth: number;
}

export default function DemandTable({ data }: { data: DemandStat[] }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[20px] border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h3 className="font-bold text-[#1E293B] dark:text-gray-100 text-lg">분야별 수요 과열 지표</h3>
                    <p className="text-xs text-[#64748B] mt-1">
                        사건 수 대비 활성 변호사 수가 적을수록 지표가 높습니다. (블루오션 기회 탐색)
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                        Update: {new Date().toLocaleDateString()}
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#64748B] uppercase bg-[#F8FAFC] dark:bg-zinc-800/50">
                        <tr>
                            <th className="px-6 py-4 rounded-tl-lg">전문 분야</th>
                            <th className="px-6 py-4 text-center">최근 30일 사건</th>
                            <th className="px-6 py-4 text-center">활성 변호사</th>
                            <th className="px-6 py-4 text-center">
                                경쟁 강도 (사건/변호사)
                                <span className="block text-[9px] font-normal text-gray-400">높을수록 기회</span>
                            </th>
                            <th className="px-6 py-4 text-right rounded-tr-lg">전월 대비</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-[#1E293B] dark:text-gray-200">
                                    {row.category}
                                    {idx < 3 && <span className="ml-2 text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-bold">HOT</span>}
                                </td>
                                <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                    {row.case_count.toLocaleString()}건
                                </td>
                                <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                    {row.lawyer_count.toLocaleString()}명
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={`font-bold text-base ${row.ratio >= 2.0 ? 'text-[#3B82F6]' : 'text-[#1E293B]'}`}>
                                            {row.ratio.toFixed(2)}
                                        </span>
                                        {/* Simple visualization bar */}
                                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${row.ratio >= 2.0 ? 'bg-[#3B82F6]' : 'bg-[#94A3B8]'}`}
                                                style={{ width: `${Math.min(row.ratio * 20, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`font-bold ${row.growth > 0 ? 'text-red-500' : row.growth < 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {row.growth > 0 ? `▲ ${row.growth}%` : row.growth < 0 ? `▼ ${Math.abs(row.growth)}%` : '-'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
