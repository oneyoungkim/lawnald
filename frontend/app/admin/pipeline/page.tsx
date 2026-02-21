
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPipelinePage() {
    const router = useRouter();
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all cases from all lawyers (This endpoint needs to be created or we mock/fetch from all lawyers)
        // For prototype, we'll fetch the test lawyer's cases as an example, 
        // OR we create a new admin endpoint for all cases.
        // Let's try fetching the main lawyer for demo.
        const demoLawyerId = "kim_won_young";

        fetch(`http://localhost:8000/api/lawyers/${demoLawyerId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.content_items) {
                    setCases(data.content_items.filter((c: any) => c.type === 'case'));
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch cases:", err);
                setLoading(false);
            });
    }, []);

    const getStatusBadge = (status: string) => {
        if (status === 'published') return <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Published</span>;
        if (status === 'draft') return <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">Draft / Review</span>;
        return <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">{status || 'Unknown'}</span>;
    };

    const getRiskBadge = (risks: string[]) => {
        if (!risks || risks.length === 0) return <span className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded">Safe</span>;
        return (
            <div className="flex flex-col gap-1">
                {risks.map((risk, i) => (
                    <span key={i} className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">{risk}</span>
                ))}
            </div>
        );
    };

    const getOcrBadge = (score: number) => {
        if (!score) return <span className="text-gray-400 text-xs">-</span>;
        let color = "text-green-600";
        if (score < 80) color = "text-yellow-600";
        if (score < 50) color = "text-red-600";
        return <span className={`${color} font-bold`}>{score}%</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Pipeline Dashboard</h1>
                    <p className="text-gray-500">Manage automated case processing and publishing</p>
                </div>
                <div className="space-x-4">
                    <Link href="/admin/dashboard" className="text-blue-600 hover:underline">Back to Admin</Link>
                </div>
            </header>

            <div className="bg-white rounded-xl shadow p-6">
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Processed Cases</h2>
                    <span className="text-sm text-gray-500">Total: {cases.length}</span>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading pipeline data...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Title / Summary</th>
                                    <th className="px-6 py-3">OCR Quality</th>
                                    <th className="px-6 py-3">Risk Flags</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cases.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{item.title}</div>
                                            <div className="text-gray-500 text-xs line-clamp-1">{item.summary}</div>
                                            <div className="text-gray-300 text-[10px] mt-1">{item.date} | v{item.version || 1}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getOcrBadge(item.structured_data?.ocr_score)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRiskBadge(item.structured_data?.risks)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={item.url} target="_blank" className="text-blue-600 hover:underline mr-4">Preview</Link>
                                            <button className="text-red-500 hover:underline">Flag</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
