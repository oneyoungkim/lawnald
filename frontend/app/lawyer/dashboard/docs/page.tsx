"use client";

import { API_BASE } from "@/lib/api";

import { useState, useEffect } from "react";
import {
    DocumentTextIcon,
    SparklesIcon,
    ClipboardDocumentIcon,
    ArrowDownTrayIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";

interface Matter {
    id: string;
    title: string;
    case_number: string;
    court: string;
    client_name: string;
    opponent_name: string;
    description: string;
}

const DOC_TYPES = [
    { key: "complaint", name: "소장", icon: "📄", desc: "민사소송 소장" },
    { key: "answer", name: "답변서", icon: "📋", desc: "피고 답변서" },
    { key: "brief", name: "준비서면", icon: "📝", desc: "변론 준비서면" },
    { key: "payment_order", name: "지급명령", icon: "💰", desc: "지급명령 신청" },
    { key: "power_of_attorney", name: "위임장", icon: "🤝", desc: "소송 위임장" },
    { key: "settlement", name: "합의서", icon: "🤲", desc: "분쟁 합의서" },
    { key: "demand_letter", name: "내용증명", icon: "✉️", desc: "내용증명 우편" },
    { key: "provisional_attachment", name: "가압류", icon: "🔒", desc: "부동산/채권 가압류" },
    { key: "criminal_complaint", name: "고소장", icon: "⚖️", desc: "형사 고소장" },
    { key: "statement", name: "진술서", icon: "🗣️", desc: "사실 진술서" },
    { key: "retainer_agreement", name: "수임계약서", icon: "📑", desc: "법률사무 위임계약" },
    { key: "appeal", name: "항소장", icon: "🔼", desc: "항소 제기" },
    { key: "provisional_injunction", name: "가처분", icon: "🚫", desc: "처분금지 가처분" },
];

export default function DocAutomationPage() {
    const [selectedType, setSelectedType] = useState<string>("");
    const [matters, setMatters] = useState<Matter[]>([]);
    const [selectedMatter, setSelectedMatter] = useState<string>("");
    const [form, setForm] = useState({
        plaintiff_name: "", defendant_name: "", court: "", case_number: "",
        case_summary: "", claim_amount: "", additional_info: "",
    });
    const [result, setResult] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Load matters
    useEffect(() => {
        fetch(`${API_BASE}/api/matters`).then(r => r.json()).then(setMatters).catch(() => { });
    }, []);

    // Auto-fill from matter
    const handleMatterSelect = (matterId: string) => {
        setSelectedMatter(matterId);
        const m = matters.find(x => x.id === matterId);
        if (m) {
            setForm(prev => ({
                ...prev,
                plaintiff_name: m.client_name || prev.plaintiff_name,
                defendant_name: m.opponent_name || prev.defendant_name,
                court: m.court || prev.court,
                case_number: m.case_number || prev.case_number,
                case_summary: m.description || prev.case_summary,
            }));
        }
    };

    const generate = async () => {
        if (!selectedType) return;
        setLoading(true);
        setResult("");
        try {
            const res = await fetch(`${API_BASE}/api/documents/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ doc_type: selectedType, matter_id: selectedMatter || undefined, ...form }),
            });
            if (res.ok) {
                const data = await res.json();
                setResult(data.content);
            } else {
                const err = await res.json();
                setResult(`❌ 오류: ${err.detail || "문서 생성에 실패했습니다."}`);
            }
        } catch (err) {
            setResult("❌ 네트워크 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadTxt = () => {
        const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const docName = DOC_TYPES.find(d => d.key === selectedType)?.name || "문서";
        a.download = `${docName}_${new Date().toISOString().split("T")[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-zinc-950">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">문서 자동화</h1>
                    <p className="text-sm text-zinc-500 mt-1">AI가 법률 서면을 자동으로 작성합니다. 사건 데이터를 연동하면 더 정확한 문서가 생성됩니다.</p>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
                {/* Step 1: Select Document Type */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">① 문서 유형 선택</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {DOC_TYPES.map(doc => (
                            <button
                                key={doc.key}
                                onClick={() => setSelectedType(doc.key)}
                                className={`p-4 rounded-2xl border-2 text-center transition-all hover:scale-[1.02] active:scale-[0.98] ${selectedType === doc.key
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-100 dark:shadow-none"
                                    : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200"
                                    }`}
                            >
                                <span className="text-2xl block mb-2">{doc.icon}</span>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white block">{doc.name}</span>
                                <span className="text-[10px] text-zinc-400 block mt-0.5">{doc.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2: Input Details */}
                {selectedType && (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">② 사건 정보 입력</h2>

                        {/* Matter Link */}
                        {matters.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">사건 연동 (선택)</label>
                                <select
                                    value={selectedMatter}
                                    onChange={e => handleMatterSelect(e.target.value)}
                                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">직접 입력</option>
                                    {matters.map(m => (
                                        <option key={m.id} value={m.id}>{m.title} {m.case_number ? `(${m.case_number})` : ""}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-zinc-400 mt-1">사건을 선택하면 당사자, 법원, 사건번호가 자동으로 채워집니다</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <InputField label="원고 (신청인)" value={form.plaintiff_name} onChange={v => setForm({ ...form, plaintiff_name: v })} placeholder="홍길동" />
                            <InputField label="피고 (상대방)" value={form.defendant_name} onChange={v => setForm({ ...form, defendant_name: v })} placeholder="김갑순" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <InputField label="관할법원" value={form.court} onChange={v => setForm({ ...form, court: v })} placeholder="서울중앙지방법원" />
                            <InputField label="사건번호" value={form.case_number} onChange={v => setForm({ ...form, case_number: v })} placeholder="2024가단12345" />
                        </div>
                        <div className="mb-4">
                            <InputField label="청구금액" value={form.claim_amount} onChange={v => setForm({ ...form, claim_amount: v })} placeholder="50,000,000원" />
                        </div>
                        <div className="mb-4">
                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">사건 내용</label>
                            <textarea
                                className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                                value={form.case_summary}
                                onChange={e => setForm({ ...form, case_summary: e.target.value })}
                                placeholder="사건의 경위와 청구 원인을 상세히 기술하세요..."
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">추가 지시사항</label>
                            <textarea
                                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                                value={form.additional_info}
                                onChange={e => setForm({ ...form, additional_info: e.target.value })}
                                placeholder="예: 손해배상청구 포함, 가처분도 함께 신청 등..."
                            />
                        </div>

                        <button
                            onClick={generate}
                            disabled={loading || !form.case_summary.trim()}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-sm shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    AI가 문서를 작성하고 있습니다...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5" /> 문서 생성
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Step 3: Result */}
                {result && (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">③ 생성된 문서</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={copyToClipboard} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-200 transition-colors">
                                    {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
                                    {copied ? "복사됨" : "복사"}
                                </button>
                                <button onClick={downloadTxt} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-200 transition-colors">
                                    <ArrowDownTrayIcon className="w-3.5 h-3.5" /> 다운로드
                                </button>
                            </div>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-8 prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                            <ReactMarkdown>{result}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</label>
            <input
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500"
                value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            />
        </div>
    );
}
