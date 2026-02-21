"use client";
import { useState } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface BlogImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: {
        title: string;
        content: string;
        cover_image_url: string;
        category: string;
        keyword: string;
    }) => void;
}

export default function BlogImportModal({ isOpen, onClose, onImport }: BlogImportModalProps) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleImport = async () => {
        if (!url) return;
        setLoading(true);
        setError('');
        setStatus('블로그 글을 분석하고 있습니다... (약 10초 소요)');

        try {
            const res = await fetch('http://localhost:8000/api/blog/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!res.ok) throw new Error('불러오기에 실패했습니다. URL을 확인해주세요.');

            setStatus('AI가 삽화를 그리고 SEO 최적화를 진행 중입니다... (약 20초 소요)');
            const data = await res.json();

            setStatus('완료되었습니다!');
            // Artificial delay to show completion message
            setTimeout(() => {
                onImport({
                    title: data.title,
                    content: data.content,
                    cover_image_url: data.cover_image_url,
                    category: data.category,
                    keyword: data.keyword
                });
                setLoading(false);
                onClose(); // Close modal on success
            }, 1000);

        } catch (e: any) {
            setError(e.message);
            setStatus('');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-zinc-800">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">스마트 블로그 불러오기</h2>
                            <p className="text-sm text-gray-500 mt-1">네이버 블로그 URL을 입력하면 AI가 자동으로 매거진으로 변환합니다.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                            <XMarkIcon className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                블로그 URL
                            </label>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://blog.naver.com/..."
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 focus:ring-2 focus:ring-[#007aff] outline-none transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                            />
                            <div className="flex gap-2 mt-3">
                                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">Auto Title</span>
                                <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded uppercase">SEO Keyword</span>
                                <span className="px-2 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded uppercase">AI Cover Art</span>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-2">
                                <XMarkIcon className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4 bg-gray-50 dark:bg-zinc-900 rounded-xl">
                                <ArrowPathIcon className="w-8 h-8 text-[#007aff] animate-spin" />
                                <div className="text-center">
                                    <p className="text-sm font-bold text-[#1d1d1f] dark:text-white mb-1">AI가 분석 중입니다</p>
                                    <p className="text-xs text-gray-500 animate-pulse">{status}</p>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleImport}
                                disabled={!url}
                                className="w-full py-4 bg-[#03C75A] hover:bg-[#02b351] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span>스마트 불러오기 시작</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
