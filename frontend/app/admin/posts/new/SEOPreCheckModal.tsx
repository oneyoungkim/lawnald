"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface SEOPreCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: { category: string; purpose: string; keyword: string; title: string }) => void;
}

export default function SEOPreCheckModal({ isOpen, onClose, onComplete }: SEOPreCheckModalProps) {
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState('');
    const [purpose, setPurpose] = useState('');
    const [keyword, setKeyword] = useState('');
    const [title, setTitle] = useState('');
    const [suggestedkeywords, setSuggestedKeywords] = useState<string[]>([]);

    const categories = ['형사', '성범죄', '이혼', '부동산', '기업', '민사', '행정'];
    const purposes = [
        { id: 'info', label: '정보 전달', desc: '법률 정보를 알기 쉽게 설명합니다.' },
        { id: 'case', label: '승소 사례', desc: '실제 해결 사례를 통해 신뢰를 줍니다.' },
        { id: 'myth', label: '오해와 진실', desc: '잘못된 상식을 바로잡습니다.' },
        { id: 'QnA', label: '자주 묻는 질문', desc: '의뢰인들이 궁금해하는 내용을 다룹니다.' }
    ];

    useEffect(() => {
        if (category) {
            // Fetch keywords based on category
            fetch(`${API_BASE}/api/seo/keywords?category=${category}`)
                .then(res => res.json())
                .then(data => setSuggestedKeywords(data.keywords || []))
                .catch(err => console.error("Failed to fetch keywords", err));
        }
    }, [category]);

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else onComplete({ category, purpose, keyword, title });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-blue-500" />
                            SEO 글쓰기 설정
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            검색 엔진에 잘 노출되는 글을 쓰기 위한 3단계 설정을 진행합니다.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex-1 overflow-y-auto">
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mb-8">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`flex-1 h-2 rounded-full ${s <= step ? 'bg-blue-500' : 'bg-gray-100 dark:bg-zinc-800'}`} />
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold dark:text-gray-200">어떤 분야의 글을 쓰시나요?</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className={`p-4 rounded-xl border-2 transition-all font-bold ${category === cat
                                                ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                                : 'border-transparent bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold dark:text-gray-200">글의 목적은 무엇인가요?</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {purposes.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setPurpose(p.id)}
                                        className={`p-5 rounded-xl border-2 text-left transition-all ${purpose === p.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-transparent bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className={`font-bold text-lg mb-1 ${purpose === p.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                            {p.label}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {p.desc}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-semibold dark:text-gray-200 mb-2">핵심 키워드를 선택/입력하세요</h3>
                                <p className="text-sm text-gray-500 mb-4">사람들이 검색할만한 단어를 선택하면 노출 확률이 올라갑니다.</p>

                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="직접 입력하거나 아래에서 선택"
                                    className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border-none text-lg active:ring-2 ring-blue-500 mb-4"
                                />

                                <div className="flex flex-wrap gap-2">
                                    {suggestedkeywords.map(k => (
                                        <button
                                            key={k}
                                            onClick={() => setKeyword(k)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${keyword === k
                                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {k}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold dark:text-gray-200 mb-2">제목을 지어보세요</h3>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="키워드가 포함된 매력적인 제목"
                                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border-none text-xl font-bold active:ring-2 ring-blue-500"
                                    />
                                    {/* Real-time Title Feedback */}
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className={`px-2 py-0.5 rounded ${keyword && title.includes(keyword) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            키워드 포함 {keyword && title.includes(keyword) ? 'O' : 'X'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded ${title.length >= 10 && title.length <= 30 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            길이 적절성 ({title.length}/30자)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-zinc-800 flex justify-between">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                        className="px-6 py-3 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        {step > 1 ? '이전' : '취소'}
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={(step === 1 && !category) || (step === 2 && !purpose) || (step === 3 && (!keyword || !title))}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {step === 3 ? '글쓰기 시작' : '다음'}
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
