"use client";

import { API_BASE } from "@/lib/api";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    SparklesIcon,
    DocumentDuplicateIcon,
    ArrowLeftIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

export default function DocumentGeneratorPage() {
    const router = useRouter();
    const documentRef = useRef<HTMLDivElement>(null);

    // Form State
    const [senderName, setSenderName] = useState('');
    const [senderAddress, setSenderAddress] = useState('');
    const [senderPhone, setSenderPhone] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [facts, setFacts] = useState('');

    // 로그인된 변호사 정보로 발신인 자동 채우기
    useEffect(() => {
        try {
            const stored = localStorage.getItem("lawyer_user");
            if (stored) {
                const lawyer = JSON.parse(stored);
                // 법무법인명 + 변호사 이름
                const firm = lawyer.firm || '';
                const name = lawyer.name || '';
                setSenderName(firm ? `${firm} ${name} 변호사` : `${name} 변호사`);
                if (lawyer.phone) setSenderPhone(lawyer.phone);
                if (lawyer.address) setSenderAddress(lawyer.address);
            }
        } catch {}
    }, []);

    // Generation State
    const [generatedTitle, setGeneratedTitle] = useState('');
    const [generatedParagraphs, setGeneratedParagraphs] = useState<string[]>([]);
    const [generatedDate, setGeneratedDate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!senderName || !senderAddress || !recipientName || !recipientAddress || !facts) {
            setError('모든 필수 항목을 입력해 주세요.');
            return;
        }
        if (facts.trim().length < 30) {
            setError('사실관계를 최소 30자 이상 입력해 주세요.');
            return;
        }

        setError('');
        setIsGenerating(true);
        setGeneratedParagraphs([]);
        setGeneratedTitle('');

        try {
            const res = await fetch(`${API_BASE}/api/generate-notice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_name: senderName,
                    sender_address: senderAddress,
                    sender_phone: senderPhone,
                    recipient_name: recipientName,
                    recipient_address: recipientAddress,
                    recipient_phone: recipientPhone,
                    facts: facts,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.detail || '내용증명 생성에 실패했습니다.');
            }

            const data = await res.json();
            setGeneratedTitle(data.title || '');
            setGeneratedParagraphs(data.paragraphs || []);
            setGeneratedDate(data.generated_at || '');
        } catch (e: any) {
            console.error('Document generation failed:', e);
            setError(e.message || '서버 오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!documentRef.current) return;
        const text = documentRef.current.innerText;
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const t = document.createElement('textarea');
            t.value = text;
            document.body.appendChild(t);
            t.select();
            document.execCommand('copy');
            document.body.removeChild(t);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPDF = async () => {
        if (!documentRef.current) return;

        // Use html2canvas + jsPDF approach via print
        const printContent = documentRef.current.innerHTML;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>내용증명 - ${generatedTitle}</title>
                <style>
                    @page { size: A4; margin: 20mm 25mm; }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Batang', 'NanumMyeongjo', 'Noto Serif KR', serif;
                        font-size: 11pt;
                        line-height: 1.8;
                        color: #000;
                        background: #fff;
                        padding: 0;
                    }
                    .doc-wrapper { max-width: 100%; }
                    .doc-title {
                        text-align: center;
                        font-size: 22pt;
                        font-weight: bold;
                        letter-spacing: 18px;
                        padding: 30px 0 24px;
                        border-top: 3px double #000;
                    }
                    table.info-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        font-size: 10pt;
                    }
                    table.info-table th,
                    table.info-table td {
                        border: 1px solid #333;
                        padding: 6px 10px;
                        text-align: left;
                    }
                    table.info-table th {
                        background: #f5f5f5;
                        font-weight: bold;
                        white-space: nowrap;
                    }
                    .subject-row th { background: #f5f5f5; font-weight: bold; }
                    .body-title {
                        text-align: center;
                        font-size: 14pt;
                        font-weight: bold;
                        letter-spacing: 8px;
                        margin: 20px 0 16px;
                    }
                    .body-paragraph {
                        text-indent: 0;
                        margin-bottom: 12px;
                        text-align: justify;
                        font-size: 10.5pt;
                        line-height: 2;
                    }
                    table.footer-table {
                        width: 60%;
                        margin: 30px auto 0;
                        border-collapse: collapse;
                        font-size: 10pt;
                    }
                    table.footer-table th,
                    table.footer-table td {
                        border: 1px solid #333;
                        padding: 6px 12px;
                    }
                    table.footer-table th { background: #f5f5f5; font-weight: bold; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                ${printContent}
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); window.close(); }, 300);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const hasResult = generatedParagraphs.length > 0;

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0a0a0a]">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/lawyer/dashboard')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-amber-500" />
                                AI 내용증명 초안 생성기
                            </h1>
                            <p className="text-xs text-gray-400">사실관계를 입력하면, AI가 법조 문서 양식에 맞춰 내용증명 초안을 작성합니다</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* ── 왼쪽: 입력 폼 ── */}
                    <div className="space-y-6">

                        {/* 발신인 정보 */}
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center text-xs font-black">1</span>
                                발신인 정보 (보내는 분)
                            </h2>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">성명 *</label>
                                        <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="홍길동"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">전화번호</label>
                                        <input type="text" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="010-1234-1234"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">주소 *</label>
                                    <input type="text" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} placeholder="서울 성동구 서울숲길 17, 1층 (04766)"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* 수신인 정보 */}
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg flex items-center justify-center text-xs font-black">2</span>
                                수신인 정보 (받는 분)
                            </h2>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">성명 *</label>
                                        <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="김철수"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">전화번호</label>
                                        <input type="text" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="010-1234-1234"
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">주소 *</label>
                                    <input type="text" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder="서울 성동구 서울숲길 17, 2층 (04766)"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* 사실관계 */}
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg flex items-center justify-center text-xs font-black">3</span>
                                핵심 사실관계 및 요구사항
                            </h2>
                            <textarea
                                value={facts}
                                onChange={(e) => setFacts(e.target.value)}
                                placeholder={`예시:\n\n2023년 5월 10일 수신인에게 보증금 1억원을 지불하고 서울시 성동구 서울숲길 17, 1층 소재 부동산 임대차계약을 체결하였습니다. 계약 기간 만료 후에도 보증금을 반환하지 않고 있어, 보증금 1억원의 즉시 반환을 요구합니다.`}
                                rows={8}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none leading-relaxed"
                            />
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-400">구체적으로 작성할수록 더 정확한 문서가 생성됩니다</p>
                                <p className="text-xs text-gray-300">{facts.length}자</p>
                            </div>
                        </div>

                        {/* 에러 메시지 */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        {/* 생성 버튼 */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    AI가 내용증명을 작성하고 있습니다...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5" />
                                    ✨ AI 내용증명 초안 생성
                                </>
                            )}
                        </button>
                    </div>

                    {/* ── 오른쪽: 정식 문서 미리보기 ── */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                            {/* Result Header */}
                            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                    📄 내용증명 미리보기
                                </h2>
                                {hasResult && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCopy}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                                                }`}
                                        >
                                            {copied ? <><CheckIcon className="w-3.5 h-3.5" /> 복사됨</> : <><DocumentDuplicateIcon className="w-3.5 h-3.5" /> 복사</>}
                                        </button>
                                        <button
                                            onClick={handleDownloadPDF}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all"
                                        >
                                            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                            PDF 저장
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Document Preview */}
                            <div className="p-8 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {isGenerating ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
                                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-gray-700 text-sm">AI가 내용증명을 작성 중입니다</p>
                                            <p className="text-xs text-gray-400 mt-1">약 10~20초 정도 소요됩니다</p>
                                        </div>
                                        <div className="w-full space-y-3 mt-4">
                                            {[...Array(8)].map((_, i) => (
                                                <div key={i} className="h-3 bg-gray-100 rounded-full animate-pulse"
                                                    style={{ width: `${65 + Math.random() * 35}%`, animationDelay: `${i * 150}ms` }} />
                                            ))}
                                        </div>
                                    </div>
                                ) : hasResult ? (
                                    /* ── 정식 내용증명 양식 ── */
                                    <div ref={documentRef} className="doc-wrapper" style={{ fontFamily: "'Batang', 'NanumMyeongjo', 'Noto Serif KR', serif" }}>
                                        {/* 제목 */}
                                        <div className="doc-title" style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', letterSpacing: '18px', padding: '24px 0 20px', borderTop: '3px double #000' }}>
                                            내 용 증 명
                                        </div>

                                        {/* 발신인 / 수신인 정보 테이블 */}
                                        <table className="info-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12px' }}>
                                            <tbody>
                                                <tr>
                                                    <th rowSpan={2} style={{ border: '1px solid #333', padding: '6px 12px', background: '#f5f5f5', fontWeight: 'bold', width: '60px', textAlign: 'center' }}>발신인</th>
                                                    <th style={{ border: '1px solid #333', padding: '6px 10px', background: '#f5f5f5', fontWeight: 'bold', width: '55px' }}>성명</th>
                                                    <td style={{ border: '1px solid #333', padding: '6px 10px' }}>{senderName}</td>
                                                    <th style={{ border: '1px solid #333', padding: '6px 10px', background: '#f5f5f5', fontWeight: 'bold', width: '60px' }}>전화번호</th>
                                                    <td style={{ border: '1px solid #333', padding: '6px 10px' }}>{senderPhone || '-'}</td>
                                                </tr>
                                                <tr>
                                                    <th style={{ border: '1px solid #333', padding: '6px 10px', background: '#f5f5f5', fontWeight: 'bold' }}>주소</th>
                                                    <td colSpan={3} style={{ border: '1px solid #333', padding: '6px 10px' }}>{senderAddress}</td>
                                                </tr>
                                                <tr>
                                                    <th rowSpan={2} style={{ border: '1px solid #333', padding: '6px 12px', background: '#f5f5f5', fontWeight: 'bold', textAlign: 'center' }}>수신인</th>
                                                    <th style={{ border: '1px solid #333', padding: '6px 10px', background: '#f5f5f5', fontWeight: 'bold' }}>성명</th>
                                                    <td style={{ border: '1px solid #333', padding: '6px 10px' }}>{recipientName}</td>
                                                    <th style={{ border: '1px solid #333', padding: '6px 10px', background: '#f5f5f5', fontWeight: 'bold' }}>전화번호</th>
                                                    <td style={{ border: '1px solid #333', padding: '6px 10px' }}>{recipientPhone || '-'}</td>
                                                </tr>
                                                <tr>
                                                    <th style={{ border: '1px solid #333', padding: '6px 10px', background: '#f5f5f5', fontWeight: 'bold' }}>주소</th>
                                                    <td colSpan={3} style={{ border: '1px solid #333', padding: '6px 10px' }}>{recipientAddress}</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* 제목 행 */}
                                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '12px' }}>
                                            <tbody>
                                                <tr>
                                                    <th style={{ border: '1px solid #333', padding: '8px 12px', background: '#f5f5f5', fontWeight: 'bold', width: '60px', textAlign: 'center' }}>제목</th>
                                                    <td style={{ border: '1px solid #333', padding: '8px 12px', fontWeight: 'bold' }}>{generatedTitle}</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* 내 용 */}
                                        <div className="body-title" style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', letterSpacing: '8px', margin: '20px 0 16px' }}>
                                            내  용
                                        </div>

                                        {/* 본문 단락 */}
                                        <div style={{ padding: '0 4px' }}>
                                            {generatedParagraphs.map((para, i) => (
                                                <p key={i} className="body-paragraph" style={{ marginBottom: '14px', textAlign: 'justify', fontSize: '12.5px', lineHeight: 2 }}>
                                                    {para}
                                                </p>
                                            ))}
                                        </div>

                                        {/* 하단 서명 영역 */}
                                        <table className="footer-table" style={{ width: '55%', margin: '36px auto 0', borderCollapse: 'collapse', fontSize: '12px' }}>
                                            <tbody>
                                                <tr>
                                                    <th style={{ border: '1px solid #333', padding: '6px 12px', background: '#f5f5f5', fontWeight: 'bold', width: '90px', textAlign: 'center' }}>작성일자</th>
                                                    <td style={{ border: '1px solid #333', padding: '6px 12px' }}>{generatedDate}</td>
                                                </tr>
                                                <tr>
                                                    <th style={{ border: '1px solid #333', padding: '6px 12px', background: '#f5f5f5', fontWeight: 'bold', textAlign: 'center' }}>발신인</th>
                                                    <td style={{ border: '1px solid #333', padding: '6px 12px' }}>{senderName}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    /* Empty State */
                                    <div className="flex flex-col items-center justify-center py-24 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <span className="text-4xl">📜</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-400 mb-1">
                                            왼쪽에 정보를 입력하고
                                        </p>
                                        <p className="text-sm text-gray-300">
                                            [✨ AI 내용증명 초안 생성] 버튼을 눌러주세요
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
