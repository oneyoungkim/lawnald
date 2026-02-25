"use client";

import { API_BASE } from "@/lib/api";

import { useState, useRef, useEffect } from "react";
import {
    PencilIcon,
    DocumentCheckIcon,
    PlusIcon,
    CheckCircleIcon,
    ClockIcon,
    TrashIcon,
    PaperAirplaneIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

interface ESignDoc {
    id: string;
    title: string;
    content: string;
    signer_name: string;
    signer_email: string;
    lawyer_name: string;
    status: string;
    created_at: string;
    signed_at: string | null;
}

export default function ESignPage() {
    const [docs, setDocs] = useState<ESignDoc[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<ESignDoc | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [showSign, setShowSign] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadDocs(); }, []);

    const loadDocs = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/esign`);
            if (res.ok) setDocs(await res.json());
        } catch (e) { }
        finally { setLoading(false); }
    };

    const createDoc = async (title: string, content: string, signerName: string, signerEmail: string) => {
        const stored = localStorage.getItem("lawyer_user");
        const lawyerName = stored ? JSON.parse(stored).name || "" : "";
        try {
            const res = await fetch(`${API_BASE}/api/esign/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, signer_name: signerName, signer_email: signerEmail, lawyer_name: lawyerName }),
            });
            if (res.ok) {
                const data = await res.json();
                setDocs(prev => [data.esign, ...prev]);
                setShowCreate(false);
                setSelectedDoc(data.esign);
            }
        } catch (e) { }
    };

    const signDoc = async (signerName: string, signatureData: string) => {
        if (!selectedDoc) return;
        try {
            const res = await fetch(`${API_BASE}/api/esign/${selectedDoc.id}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signer_name: signerName, signature_data: signatureData }),
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedDoc(data.esign);
                setDocs(prev => prev.map(d => d.id === data.esign.id ? data.esign : d));
                setShowSign(false);
            }
        } catch (e) { }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-zinc-950">
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">전자서명</h1>
                        <p className="text-sm text-zinc-500 mt-1">위임장, 수임계약서를 온라인으로 서명합니다</p>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all">
                        <PlusIcon className="w-4 h-4" /> 서명 요청
                    </button>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-6 flex gap-6">
                {/* List */}
                <div className="w-[320px] flex-shrink-0 space-y-3">
                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">서명 문서</h2>
                    {docs.length === 0 && !loading ? (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-300">
                            <DocumentCheckIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">서명 문서가 없습니다</p>
                        </div>
                    ) : docs.map(doc => (
                        <div
                            key={doc.id}
                            onClick={() => setSelectedDoc(doc)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedDoc?.id === doc.id ? "bg-white dark:bg-zinc-800 border-blue-300 shadow-lg" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:shadow-md"}`}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{doc.title}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${doc.status === "signed" ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>
                                    {doc.status === "signed" ? <><CheckCircleIcon className="w-3 h-3" /> 서명완료</> : <><ClockIcon className="w-3 h-3" /> 대기중</>}
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-400">서명자: {doc.signer_name}</p>
                            <p className="text-[10px] text-zinc-300 mt-1">{doc.created_at}</p>
                        </div>
                    ))}
                </div>

                {/* Detail */}
                <div className="flex-1">
                    {!selectedDoc ? (
                        <div className="h-[400px] flex items-center justify-center text-zinc-300">
                            <div className="text-center">
                                <PencilIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-bold">문서를 선택하세요</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{selectedDoc.title}</h2>
                                    {selectedDoc.status === "pending" && (
                                        <button onClick={() => setShowSign(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
                                            <PencilIcon className="w-4 h-4" /> 서명하기
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <InfoCell label="서명자" value={selectedDoc.signer_name} />
                                    <InfoCell label="변호사" value={selectedDoc.lawyer_name || "-"} />
                                    <InfoCell label="상태" value={selectedDoc.status === "signed" ? `✅ 서명완료 (${selectedDoc.signed_at})` : "⏳ 대기 중"} />
                                </div>
                            </div>
                            <div className="px-8 py-6">
                                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">문서 내용</h3>
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-6 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 max-h-[500px] overflow-y-auto">
                                    {selectedDoc.content}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={createDoc} />}
            {/* Sign Modal */}
            {showSign && selectedDoc && <SignModal doc={selectedDoc} onClose={() => setShowSign(false)} onSign={signDoc} />}
        </div>
    );
}

function InfoCell({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{value}</div>
        </div>
    );
}

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (t: string, c: string, n: string, e: string) => void }) {
    const [form, setForm] = useState({ title: "수임계약서", content: "", signer_name: "", signer_email: "" });
    const presets = [
        { label: "수임계약서", template: "수임계약서\n\n제1조 (수임사무) 갑(의뢰인)은 을(수임변호사)에게 아래 사건의 법률사무를 위임한다.\n\n사건의 표시:\n관할법원:\n\n제2조 (착수금 및 보수) 갑은 을에게 아래와 같이 보수를 지급한다.\n착수금: 원\n성공보수: %\n\n제3조 (비용부담) 소송에 필요한 비용은 갑이 부담한다.\n\n제4조 (신의성실) 갑과 을은 위임사무를 처리함에 있어 신의성실의 원칙에 따른다.\n\n위 계약 내용을 확인하고 서명합니다.\n\n갑(의뢰인):\n을(수임변호사):" },
        { label: "위임장", template: "위 임 장\n\n위임인(원고/피고):\n성명:\n주민등록번호:\n주소:\n\n위 위임인은 아래 사건에 관하여\n수임인 변호사 _____에게 일체의 소송행위를 위임합니다.\n\n사건의 표시:\n관할법원:\n상대방:\n\n위임사항:\n1. 소의 제기, 응소, 반소\n2. 화해, 조정, 상소의 포기 또는 취하\n3. 강제집행에 관한 행위\n\n날짜:\n위임인: (서명)" },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl p-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6">서명 요청 생성</h2>
                <div className="flex gap-2 mb-4">
                    {presets.map(p => (
                        <button key={p.label} onClick={() => setForm({ ...form, title: p.label, content: p.template })} className={`text-xs px-3 py-1.5 rounded-full border ${form.title === p.label ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-50 border-zinc-200 text-zinc-600"}`}>
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">제목</label>
                        <input className="w-full p-3 bg-zinc-50 rounded-xl text-sm" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">서명자 이름</label>
                        <input className="w-full p-3 bg-zinc-50 rounded-xl text-sm" value={form.signer_name} onChange={e => setForm({ ...form, signer_name: e.target.value })} placeholder="홍길동" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">서명자 이메일 (선택)</label>
                        <input className="w-full p-3 bg-zinc-50 rounded-xl text-sm" value={form.signer_email} onChange={e => setForm({ ...form, signer_email: e.target.value })} placeholder="client@example.com" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">문서 내용</label>
                        <textarea className="w-full p-3 bg-zinc-50 rounded-xl text-sm min-h-[200px]" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-6 py-3 bg-zinc-100 rounded-xl font-bold text-zinc-500 text-sm">취소</button>
                    <button onClick={() => form.title && form.signer_name && form.content && onCreate(form.title, form.content, form.signer_name, form.signer_email)}
                        className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                        <PaperAirplaneIcon className="w-4 h-4 inline mr-2" />생성
                    </button>
                </div>
            </div>
        </div>
    );
}

function SignModal({ doc, onClose, onSign }: { doc: ESignDoc; onClose: () => void; onSign: (name: string, sig: string) => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [signerName, setSignerName] = useState(doc.signer_name);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000";
    }, []);

    const startDraw = (e: React.MouseEvent) => {
        setIsDrawing(true);
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };
    const draw = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };
    const endDraw = () => setIsDrawing(false);
    const clearCanvas = () => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx || !canvasRef.current) return;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    const handleSign = () => {
        const data = canvasRef.current?.toDataURL("image/png") || "";
        onSign(signerName, data);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-2">전자서명</h2>
                <p className="text-sm text-zinc-500 mb-6">{doc.title}</p>
                <div className="mb-4">
                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">서명자 이름</label>
                    <input className="w-full p-3 bg-zinc-50 rounded-xl text-sm" value={signerName} onChange={e => setSignerName(e.target.value)} />
                </div>
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">서명란</label>
                        <button onClick={clearCanvas} className="text-[10px] text-red-400 hover:text-red-600">지우기</button>
                    </div>
                    <canvas
                        ref={canvasRef}
                        width={350} height={150}
                        className="w-full border-2 border-dashed border-zinc-200 rounded-xl cursor-crosshair bg-white"
                        onMouseDown={startDraw}
                        onMouseMove={draw}
                        onMouseUp={endDraw}
                        onMouseLeave={endDraw}
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 bg-zinc-100 rounded-xl font-bold text-zinc-500 text-sm">취소</button>
                    <button onClick={handleSign} className="px-8 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
                        <PencilIcon className="w-4 h-4 inline mr-2" />서명 완료
                    </button>
                </div>
            </div>
        </div>
    );
}
