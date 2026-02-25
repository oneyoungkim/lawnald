"use client";

import { API_BASE } from "@/lib/api";
import { useState, useRef, useEffect, useCallback } from "react";
import {
    PencilIcon,
    DocumentCheckIcon,
    PlusIcon,
    CheckCircleIcon,
    ClockIcon,
    PaperAirplaneIcon,
    EyeIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    DevicePhoneMobileIcon,
    EnvelopeIcon,
    LockClosedIcon,
    DocumentTextIcon,
    UserIcon,
    FingerPrintIcon,
    RocketLaunchIcon,
    InformationCircleIcon,
} from "@heroicons/react/24/outline";

/* ─── Types ─── */
interface ESignDoc {
    id: string;
    title: string;
    content: string;
    signer_name: string;
    signer_email: string;
    signer_phone: string;
    lawyer_name: string;
    verification_method: string;
    status: string; // sent | viewed | signed
    created_at: string;
    signed_at: string | null;
    viewed_at: string | null;
    audit_log: { action: string; timestamp: string; ip: string; user_agent: string }[];
}

/* ─── Main Page ─── */
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

    const handleCreated = (doc: ESignDoc) => {
        setDocs(prev => [doc, ...prev]);
        setShowCreate(false);
        setSelectedDoc(doc);
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

    const STATUS_MAP: Record<string, { label: string; color: string; icon: JSX.Element }> = {
        sent: { label: "발송됨", color: "text-blue-600 bg-blue-50", icon: <PaperAirplaneIcon className="w-3 h-3" /> },
        viewed: { label: "열람됨", color: "text-amber-600 bg-amber-50", icon: <EyeIcon className="w-3 h-3" /> },
        signed: { label: "서명완료", color: "text-green-600 bg-green-50", icon: <CheckCircleIcon className="w-3 h-3" /> },
        pending: { label: "대기중", color: "text-zinc-500 bg-zinc-100", icon: <ClockIcon className="w-3 h-3" /> },
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-zinc-950">
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                            전자서명
                            <span className="text-[10px] font-bold bg-gradient-to-r from-blue-500 to-violet-500 text-white px-2 py-0.5 rounded-full">PREMIUM</span>
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">위임장, 수임계약서를 온라인으로 서명합니다 · 감사추적 지원</p>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all">
                        <PlusIcon className="w-4 h-4" /> 서명 요청
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
                {/* List */}
                <div className="w-[320px] flex-shrink-0 space-y-3">
                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">서명 문서</h2>
                    {docs.length === 0 && !loading ? (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-300">
                            <DocumentCheckIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">서명 문서가 없습니다</p>
                        </div>
                    ) : docs.map(doc => {
                        const st = STATUS_MAP[doc.status] || STATUS_MAP.pending;
                        return (
                            <div
                                key={doc.id}
                                onClick={() => setSelectedDoc(doc)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedDoc?.id === doc.id ? "bg-white dark:bg-zinc-800 border-blue-300 shadow-lg" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:shadow-md"}`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{doc.title}</h3>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${st.color}`}>
                                        {st.icon} {st.label}
                                    </span>
                                </div>
                                <p className="text-[11px] text-zinc-400">서명자: {doc.signer_name}</p>
                                {/* 3-stage tracker mini */}
                                <div className="flex items-center gap-1 mt-2">
                                    {["sent", "viewed", "signed"].map((s, i) => {
                                        const done = ["sent", "viewed", "signed"].indexOf(doc.status) >= i;
                                        return (
                                            <div key={s} className="flex items-center gap-1">
                                                <div className={`w-2 h-2 rounded-full ${done ? "bg-blue-500" : "bg-zinc-200"}`} />
                                                {i < 2 && <div className={`w-4 h-[2px] ${done ? "bg-blue-400" : "bg-zinc-200"}`} />}
                                            </div>
                                        );
                                    })}
                                    <span className="text-[9px] text-zinc-400 ml-1">
                                        {doc.status === "sent" ? "발송" : doc.status === "viewed" ? "열람" : doc.status === "signed" ? "완료" : "대기"}
                                    </span>
                                </div>
                                <p className="text-[10px] text-zinc-300 mt-1">{doc.created_at}</p>
                            </div>
                        );
                    })}
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
                                    {(selectedDoc.status === "sent" || selectedDoc.status === "viewed" || selectedDoc.status === "pending") && (
                                        <button onClick={() => setShowSign(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
                                            <PencilIcon className="w-4 h-4" /> 서명하기
                                        </button>
                                    )}
                                </div>
                                {/* Status Tracker */}
                                <div className="flex items-center gap-2 mb-4">
                                    {[
                                        { key: "sent", label: "발송됨", icon: <PaperAirplaneIcon className="w-4 h-4" /> },
                                        { key: "viewed", label: "열람됨", icon: <EyeIcon className="w-4 h-4" /> },
                                        { key: "signed", label: "서명완료", icon: <CheckCircleIcon className="w-4 h-4" /> },
                                    ].map((s, i) => {
                                        const idx = ["sent", "viewed", "signed"].indexOf(selectedDoc.status);
                                        const done = i <= idx;
                                        const active = i === idx;
                                        return (
                                            <div key={s.key} className="flex items-center gap-2">
                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${active ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" : done ? "bg-blue-100 text-blue-600" : "bg-zinc-100 text-zinc-400"}`}>
                                                    {s.icon} {s.label}
                                                </div>
                                                {i < 2 && <ArrowRightIcon className={`w-3 h-3 ${done ? "text-blue-400" : "text-zinc-300"}`} />}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    <InfoCell label="서명자" value={selectedDoc.signer_name} />
                                    <InfoCell label="변호사" value={selectedDoc.lawyer_name || "-"} />
                                    <InfoCell label="인증 방식" value={selectedDoc.verification_method === "kakao" ? "카카오" : selectedDoc.verification_method === "pass" ? "PASS" : "이메일"} />
                                    <InfoCell label="상태" value={
                                        selectedDoc.status === "signed" ? `✅ ${selectedDoc.signed_at}`
                                            : selectedDoc.status === "viewed" ? `👁️ 열람 ${selectedDoc.viewed_at}`
                                                : "📤 발송됨"
                                    } />
                                </div>
                            </div>
                            <div className="px-8 py-6">
                                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">문서 내용</h3>
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-6 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 max-h-[350px] overflow-y-auto font-mono">
                                    {selectedDoc.content}
                                </div>
                            </div>
                            {/* Audit Trail */}
                            {selectedDoc.audit_log && selectedDoc.audit_log.length > 0 && (
                                <div className="px-8 py-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <ShieldCheckIcon className="w-3.5 h-3.5" /> 감사추적 로그
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedDoc.audit_log.map((log, i) => (
                                            <div key={i} className="flex items-center gap-3 text-[11px] text-zinc-500">
                                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.action === "signed" ? "bg-green-500" : log.action === "viewed" ? "bg-amber-500" : "bg-blue-500"}`} />
                                                <span className="font-bold text-zinc-700 dark:text-zinc-300 w-12">
                                                    {log.action === "created" ? "생성" : log.action === "viewed" ? "열람" : "서명"}
                                                </span>
                                                <span>{log.timestamp}</span>
                                                <span className="text-zinc-300">|</span>
                                                <span>IP: {log.ip}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-start gap-2">
                                        <ShieldCheckIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                                            계약 완료 후 IP, 시간, 기기 정보가 기록된 <b>감사보고서(Audit Report)</b>가 함께 발급됩니다.
                                            이 기록은 법적 분쟁 시 증거 자료로 활용될 수 있습니다.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 4-Step Create Wizard */}
            {showCreate && <CreateWizard onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
            {/* Sign Modal */}
            {showSign && selectedDoc && <SignModal doc={selectedDoc} onClose={() => setShowSign(false)} onSign={signDoc} />}
        </div>
    );
}

/* ─── InfoCell ─── */
function InfoCell({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{value}</div>
        </div>
    );
}

/* ─── 4-Step Create Wizard ─── */
const STEPS = [
    { num: 1, label: "계약서 확인", icon: <DocumentTextIcon className="w-5 h-5" /> },
    { num: 2, label: "서명자 정보", icon: <UserIcon className="w-5 h-5" /> },
    { num: 3, label: "본인인증 선택", icon: <FingerPrintIcon className="w-5 h-5" /> },
    { num: 4, label: "발송 완료", icon: <RocketLaunchIcon className="w-5 h-5" /> },
];

const DOC_PRESETS = [
    {
        label: "수임계약서", template: `수 임 계 약 서

제1조 (수임사무)
갑(의뢰인)은 을(수임변호사)에게 아래 사건의 법률사무를 위임한다.

사건의 표시:
관할법원:

제2조 (착수금 및 보수)
갑은 을에게 아래와 같이 보수를 지급한다.
착수금:                    원
성공보수:                  %

제3조 (비용부담)
소송에 필요한 비용(인지대, 송달료, 감정비 등)은 갑이 부담한다.

제4조 (신의성실)
갑과 을은 위임사무를 처리함에 있어 신의성실의 원칙에 따른다.

제5조 (중도해지)
갑 또는 을이 본 계약을 해지하고자 할 때에는 상대방에게 서면으로 통보한다.

위 계약 내용을 확인하고 아래에 서명합니다.

갑(의뢰인):
을(수임변호사):`
    },
    {
        label: "위임장", template: `위 임 장

위임인(원고/피고):
성명:
주민등록번호:
주소:

위 위임인은 아래 사건에 관하여
수임인 변호사 _____ 에게 일체의 소송행위를 위임합니다.

사건의 표시:
관할법원:
상대방:

위임사항:
1. 소의 제기, 응소, 반소
2. 화해, 조정, 상소의 포기 또는 취하
3. 강제집행에 관한 행위

날짜:
위임인:          (서명)`
    },
];

function CreateWizard({ onClose, onCreated }: { onClose: () => void; onCreated: (doc: ESignDoc) => void }) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        title: "수임계약서",
        content: DOC_PRESETS[0].template,
        signer_name: "",
        signer_email: "",
        signer_phone: "",
        verification_method: "email",
    });
    const [sending, setSending] = useState(false);
    const [createdDoc, setCreatedDoc] = useState<ESignDoc | null>(null);
    const [aiWarnings, setAiWarnings] = useState<string[]>([]);

    // AI consistency check
    const runAiCheck = useCallback(() => {
        const warns: string[] = [];
        if (form.content.includes("착수금") && form.content.match(/착수금:\s+원/)) {
            warns.push("착수금 금액이 비어있습니다. 금액을 입력해 주세요.");
        }
        if (form.content.includes("성공보수") && form.content.match(/성공보수:\s+%/)) {
            warns.push("성공보수 비율이 비어있습니다. 비율을 입력해 주세요.");
        }
        if (form.signer_name && !form.content.includes(form.signer_name)) {
            warns.push(`서명자 '${form.signer_name}'이(가) 문서 내용에 포함되어 있지 않습니다. 당사자란을 확인하세요.`);
        }
        if (form.content.includes("관할법원:") && form.content.match(/관할법원:\s*\n/)) {
            warns.push("관할법원이 비어있습니다.");
        }
        setAiWarnings(warns);
    }, [form.content, form.signer_name]);

    useEffect(() => {
        if (step === 1) runAiCheck();
    }, [step, runAiCheck]);

    const canNext = () => {
        if (step === 1) return form.title.trim().length > 0 && form.content.trim().length > 0;
        if (step === 2) return form.signer_name.trim().length > 0;
        if (step === 3) return true;
        return true;
    };

    const handleSend = async () => {
        setSending(true);
        try {
            const stored = localStorage.getItem("lawyer_user");
            const lawyerName = stored ? JSON.parse(stored).name || "" : "";
            const res = await fetch(`${API_BASE}/api/esign/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, lawyer_name: lawyerName }),
            });
            if (res.ok) {
                const data = await res.json();
                setCreatedDoc(data.esign);
                setStep(4);
            }
        } catch (e) { }
        finally { setSending(false); }
    };

    const goNext = () => {
        if (step === 3) {
            handleSend();
        } else {
            setStep(s => Math.min(s + 1, 4));
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-5xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Step Bar */}
                <div className="px-8 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        {STEPS.map((s, i) => (
                            <div key={s.num} className="flex items-center gap-2">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${step === s.num ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg" : step > s.num ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-400"}`}>
                                    {step > s.num ? <CheckCircleIcon className="w-4 h-4" /> : s.icon}
                                    <span className="hidden sm:inline">{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`w-8 h-[2px] ${step > s.num ? "bg-green-400" : "bg-zinc-200"}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {/* Step 1: 계약서 확인 */}
                    {step === 1 && (
                        <div className="flex gap-6">
                            <div className="flex-1 space-y-4">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">문서 유형 및 내용</h3>
                                <div className="flex gap-2 flex-wrap">
                                    {DOC_PRESETS.map(p => (
                                        <button key={p.label} onClick={() => setForm({ ...form, title: p.label, content: p.template })} className={`text-xs px-4 py-2 rounded-full border-2 font-bold transition-all ${form.title === p.label ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">제목</label>
                                    <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">문서 내용</label>
                                    <textarea className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm min-h-[280px] font-mono leading-relaxed border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                                </div>
                                {/* AI Warnings */}
                                {aiWarnings.length > 0 && (
                                    <div className="space-y-2">
                                        {aiWarnings.map((w, i) => (
                                            <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                                <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-amber-700 dark:text-amber-300">{w}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Live Preview */}
                            <div className="w-[300px] flex-shrink-0">
                                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">실시간 미리보기</h4>
                                <div className="bg-white border-2 border-zinc-200 rounded-xl p-5 shadow-inner max-h-[480px] overflow-y-auto" style={{ aspectRatio: "210/297", minHeight: 400 }}>
                                    <div className="text-center mb-4">
                                        <h5 className="text-sm font-black tracking-wider">{form.title || "제목 없음"}</h5>
                                        <div className="w-12 h-[2px] bg-zinc-300 mx-auto mt-2" />
                                    </div>
                                    <div className="text-[10px] leading-[1.8] text-zinc-700 whitespace-pre-wrap font-mono">
                                        {form.content.replace(/갑\(의뢰인\):\s*$/m, `갑(의뢰인): ${form.signer_name || "___"}`)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: 서명자 정보 */}
                    {step === 2 && (
                        <div className="max-w-lg mx-auto space-y-6">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">서명자 정보 입력</h3>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">서명자 이름 *</label>
                                <input className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.signer_name} onChange={e => setForm({ ...form, signer_name: e.target.value })} placeholder="홍길동" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">이메일</label>
                                <input type="email" className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.signer_email} onChange={e => setForm({ ...form, signer_email: e.target.value })} placeholder="client@example.com" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">휴대폰</label>
                                <input type="tel" className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.signer_phone} onChange={e => setForm({ ...form, signer_phone: e.target.value })} placeholder="010-1234-5678" />
                            </div>
                        </div>
                    )}

                    {/* Step 3: 본인인증 선택 */}
                    {step === 3 && (
                        <div className="max-w-lg mx-auto space-y-6">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">본인인증 방식 선택</h3>
                            <p className="text-sm text-zinc-500">서명자가 본인임을 확인하는 방식을 선택하세요.</p>
                            <div className="space-y-3">
                                {[
                                    { key: "email", label: "이메일 인증", desc: "서명 링크를 이메일로 발송합니다", icon: <EnvelopeIcon className="w-6 h-6" />, available: true },
                                    { key: "kakao", label: "카카오톡 인증", desc: "카카오 간편인증으로 본인확인", icon: <DevicePhoneMobileIcon className="w-6 h-6" />, available: false },
                                    { key: "pass", label: "PASS 본인인증", desc: "통신사 PASS 앱으로 본인확인", icon: <LockClosedIcon className="w-6 h-6" />, available: false },
                                ].map(v => (
                                    <button
                                        key={v.key}
                                        onClick={() => v.available && setForm({ ...form, verification_method: v.key })}
                                        className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${form.verification_method === v.key ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10" : v.available ? "border-zinc-200 hover:border-zinc-400 bg-white dark:bg-zinc-800" : "border-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 opacity-60 cursor-not-allowed"}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${form.verification_method === v.key ? "bg-blue-500 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                                            {v.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                                                {v.label}
                                                {!v.available && <span className="text-[9px] bg-zinc-200 text-zinc-500 px-2 py-0.5 rounded-full font-bold">서비스 준비 중</span>}
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-0.5">{v.desc}</p>
                                        </div>
                                        {form.verification_method === v.key && <CheckCircleIcon className="w-5 h-5 text-blue-500" />}
                                    </button>
                                ))}
                            </div>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-start gap-2 mt-4">
                                <ShieldCheckIcon className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] text-zinc-500 leading-relaxed">
                                    계약 완료 후 IP, 시간, 기기 정보가 기록된 <b>감사보고서</b>가 함께 발급됩니다.
                                    이 기록은 법적 분쟁 시 증거 자료로 활용됩니다.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: 발송 완료 */}
                    {step === 4 && (
                        <div className="max-w-md mx-auto text-center py-6">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-[bounce_0.6s_ease-in-out]">
                                <CheckCircleIcon className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">서명 요청이 발송되었습니다!</h3>
                            <p className="text-sm text-zinc-500 mb-6">
                                {form.signer_name}님에게 {form.verification_method === "email" ? "이메일로" : "인증 링크가"} 서명 요청이 전달됩니다.
                            </p>

                            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-5 text-left space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm"><DocumentTextIcon className="w-4 h-4 text-zinc-400" /> <span className="font-bold">{form.title}</span></div>
                                <div className="flex items-center gap-2 text-sm"><UserIcon className="w-4 h-4 text-zinc-400" /> <span>서명자: {form.signer_name}</span></div>
                                {form.signer_email && <div className="flex items-center gap-2 text-sm"><EnvelopeIcon className="w-4 h-4 text-zinc-400" /> <span>{form.signer_email}</span></div>}
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-start gap-2 text-left mb-6">
                                <ShieldCheckIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                                    서명자가 문서를 <b>열람</b>하거나 <b>서명 완료</b>하면 실시간으로 상태가 업데이트됩니다.
                                    전체 과정은 <b>감사추적 로그</b>에 자동 기록됩니다.
                                </p>
                            </div>

                            <button
                                onClick={() => { if (createdDoc) onCreated(createdDoc); else onClose(); }}
                                className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                확인
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Nav */}
                {step < 4 && (
                    <div className="px-8 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                        <button onClick={step === 1 ? onClose : () => setStep(s => s - 1)} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-sm text-zinc-500 hover:bg-zinc-200 transition-colors">
                            {step === 1 ? "취소" : <><ArrowLeftIcon className="w-4 h-4" /> 이전</>}
                        </button>
                        <button
                            onClick={goNext}
                            disabled={!canNext() || sending}
                            className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {sending ? "발송 중..." : step === 3 ? <><PaperAirplaneIcon className="w-4 h-4" /> 서명 요청 발송</> : <>다음 <ArrowRightIcon className="w-4 h-4" /></>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Sign Modal ─── */
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

    const getPos = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const startDraw = (e: React.MouseEvent) => {
        setIsDrawing(true);
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };
    const draw = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
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
                    <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={signerName} onChange={e => setSignerName(e.target.value)} />
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
                    <button onClick={onClose} className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-zinc-500 text-sm">취소</button>
                    <button onClick={handleSign} className="px-8 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
                        <PencilIcon className="w-4 h-4 inline mr-2" />서명 완료
                    </button>
                </div>
            </div>
        </div>
    );
}
