"use client";

import { API_BASE } from "@/lib/api";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import {
    ArrowLeftIcon,
    DocumentArrowUpIcon,
    PaperAirplaneIcon,
    DocumentTextIcon,
    SparklesIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface DocInfo {
    name: string;
    size: number;
    chars: number;
    error?: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface SavedSession {
    id: string;
    title: string;
    sessionId: string;
    messages: ChatMessage[];
    documents: DocInfo[];
    summary: string;
    totalChars: number;
    savedAt: string;
}

export default function CaseWorkspacePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [documents, setDocuments] = useState<DocInfo[]>([]);
    const [summary, setSummary] = useState('');
    const [totalChars, setTotalChars] = useState(0);

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
    const [currentSessionLocalId, setCurrentSessionLocalId] = useState('');

    // ── 세션 목록 로드 ──
    useEffect(() => {
        try {
            const raw = localStorage.getItem('workspace_sessions');
            if (raw) setSavedSessions(JSON.parse(raw));
        } catch { }
    }, []);

    // ── 현재 세션 자동 저장 ──
    useEffect(() => {
        if (messages.length === 0) return;
        try {
            const raw = localStorage.getItem('workspace_sessions');
            let sessions: SavedSession[] = raw ? JSON.parse(raw) : [];
            const localId = currentSessionLocalId || `ws_${Date.now()}`;
            if (!currentSessionLocalId) setCurrentSessionLocalId(localId);

            const firstUserMsg = messages.find(m => m.role === 'user');
            const title = firstUserMsg?.content?.slice(0, 40) || (documents[0]?.name || '새 대화');

            const updated: SavedSession = {
                id: localId,
                title,
                sessionId,
                messages,
                documents,
                summary,
                totalChars,
                savedAt: new Date().toISOString(),
            };

            const idx = sessions.findIndex(s => s.id === localId);
            if (idx >= 0) {
                sessions[idx] = updated;
            } else {
                sessions.unshift(updated);
            }
            // 최대 20개 유지
            sessions = sessions.slice(0, 20);
            localStorage.setItem('workspace_sessions', JSON.stringify(sessions));
            setSavedSessions(sessions);
        } catch { }
    }, [messages, sessionId, documents, summary, totalChars, currentSessionLocalId]);

    // 세션 복원
    const loadSession = (session: SavedSession) => {
        setCurrentSessionLocalId(session.id);
        setSessionId(session.sessionId);
        setMessages(session.messages);
        setDocuments(session.documents);
        setSummary(session.summary);
        setTotalChars(session.totalChars);
        setError('');
    };

    // 세션 삭제
    const deleteSession = (id: string) => {
        try {
            const raw = localStorage.getItem('workspace_sessions');
            let sessions: SavedSession[] = raw ? JSON.parse(raw) : [];
            sessions = sessions.filter(s => s.id !== id);
            localStorage.setItem('workspace_sessions', JSON.stringify(sessions));
            setSavedSessions(sessions);
        } catch { }
    };

    // 새 세션 시작
    const handleNewSession = () => {
        setCurrentSessionLocalId('');
        setSessionId('');
        setMessages([]);
        setDocuments([]);
        setSummary('');
        setTotalChars(0);
        setError('');
    };

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // File upload handler
    const handleUpload = useCallback(async (files: FileList | File[]) => {
        const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        const fileArray = Array.from(files).filter(f =>
            allowed.includes(f.type) ||
            f.name.endsWith('.pdf') ||
            f.name.endsWith('.docx') ||
            f.name.endsWith('.doc') ||
            f.name.endsWith('.txt')
        );

        if (fileArray.length === 0) {
            setError('PDF, Word(.docx), 또는 텍스트 파일만 업로드 가능합니다.');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            const formData = new FormData();
            fileArray.forEach(f => formData.append('files', f));

            const res = await fetch(`${API_BASE}/api/case/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.detail || '문서 처리에 실패했습니다.');
            }

            const data = await res.json();
            setSessionId(data.session_id);
            setDocuments(data.documents);
            setSummary(data.summary);
            setTotalChars(data.total_chars);
            setMessages([]);

            // Auto-welcome message
            setMessages([{
                role: 'assistant',
                content: `📄 ${data.documents.length}개 문서를 분석했습니다 (총 ${(data.total_chars / 1000).toFixed(0)}K자).\n\n사건 관련 질문을 해 주세요. 예를 들어:\n• "이 사건의 핵심 법적 쟁점이 뭐야?"\n• "원고의 주장에 대한 반박 논거를 만들어줘"\n• "승소 가능성과 리스크를 분석해줘"`,
                timestamp: new Date().toISOString(),
            }]);

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsUploading(false);
        }
    }, []);

    // Chat send handler
    const handleSend = async () => {
        if (!input.trim() || isSending) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsSending(true);

        try {
            const res = await fetch(`${API_BASE}/api/case/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: userMsg.content,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.detail || 'AI 응답 생성에 실패했습니다.');
            }

            const data = await res.json();
            // 서버가 새로운 session_id를 반환하면 저장 (문서 없이 채팅 시)
            if (data.session_id && data.session_id !== sessionId) {
                setSessionId(data.session_id);
            }
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.reply,
                timestamp: new Date().toISOString(),
            }]);
        } catch (e: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ 오류: ${e.message}`,
                timestamp: new Date().toISOString(),
            }]);
        } finally {
            setIsSending(false);
        }
    };

    // Enter key handler
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    };

    return (
        <div className="h-screen flex flex-col bg-[#F8F9FB] dark:bg-[#0a0a0a]">
            {/* Header */}
            <header className="flex-shrink-0 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800 z-30">
                <div className="max-w-full mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/lawyer/dashboard')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-violet-500" />
                                팀 워크스페이스 · 로날드
                            </h1>
                        </div>
                    </div>
                    {sessionId && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                세션: {sessionId}
                            </span>
                            <button
                                onClick={handleNewSession}
                                className="text-xs text-red-500 hover:text-red-600 font-medium"
                            >
                                새 대화
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content — Split View */}
            <main className="flex-1 flex overflow-hidden">

                {/* ── 좌측 패널: 문서 업로드 & 요약 ── */}
                <div className="w-[380px] flex-shrink-0 border-r border-gray-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-[#1c1c1e] overflow-y-auto">

                    {/* Upload Zone */}
                    <div className="p-5">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleUpload(e.dataTransfer.files); }}
                            onClick={() => fileInputRef.current?.click()}
                            className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${isDragOver
                                ? 'border-violet-400 bg-violet-50/80 dark:bg-violet-900/20'
                                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 hover:bg-gray-50/50'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.docx,.doc,.txt"
                                className="hidden"
                                onChange={(e) => e.target.files && handleUpload(e.target.files)}
                            />

                            {isUploading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-violet-100 dark:border-violet-900 rounded-full" />
                                        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin absolute top-0" />
                                    </div>
                                    <p className="text-sm font-semibold text-violet-600">문서 분석 중...</p>
                                    <p className="text-xs text-gray-400">텍스트 추출 및 AI 요약 생성</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDragOver ? 'bg-violet-100' : 'bg-gray-100 dark:bg-zinc-800'
                                        }`}>
                                        <DocumentArrowUpIcon className={`w-6 h-6 ${isDragOver ? 'text-violet-500' : 'text-gray-400'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            사건 자료 업로드
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">PDF, Word, TXT 지원</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Document List */}
                    {documents.length > 0 && (
                        <div className="px-5 pb-3">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                업로드된 문서 ({documents.length}개)
                            </h3>
                            <div className="space-y-1.5">
                                {documents.map((doc, i) => (
                                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                                        <DocumentTextIcon className="w-4 h-4 text-violet-500 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{doc.name}</p>
                                            <p className="text-[10px] text-gray-400">
                                                {formatFileSize(doc.size)} · {doc.chars > 0 ? `${(doc.chars / 1000).toFixed(0)}K자` : '추출 실패'}
                                            </p>
                                        </div>
                                        {doc.chars > 0 ? (
                                            <span className="text-[10px] font-bold text-emerald-500">✓</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-red-400">✗</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Summary */}
                    {summary && (
                        <div className="px-5 pb-5 flex-1">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                📋 AI 핵심 요약
                            </h3>
                            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-violet-100 dark:border-violet-800/40">
                                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                                    {summary}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="px-5 pb-5">
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                                <span>⚠️</span>
                                <span>{error}</span>
                                <button onClick={() => setError('')} className="ml-auto"><XMarkIcon className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                    )}

                    {/* 이전 대화 목록 */}
                    <div className="px-5 pb-5 flex-1">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">이전 대화</h3>
                            {(sessionId || messages.length > 0) && (
                                <button
                                    onClick={handleNewSession}
                                    className="text-[11px] text-violet-500 hover:text-violet-600 font-semibold"
                                >
                                    + 새 대화
                                </button>
                            )}
                        </div>
                        {savedSessions.length > 0 ? (
                            <div className="space-y-1.5">
                                {savedSessions.map(s => (
                                    <div
                                        key={s.id}
                                        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${currentSessionLocalId === s.id
                                                ? 'bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700'
                                                : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                                            }`}
                                        onClick={() => loadSession(s)}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{s.title}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                {new Date(s.savedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                {` · ${s.messages.length}개`}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                        >
                                            <XMarkIcon className="w-3 h-3 text-red-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11px] text-gray-300 dark:text-zinc-600">아직 대화 기록이 없습니다</p>
                        )}
                    </div>
                </div>

                {/* ── 우측 패널: AI 채팅 ── */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                        {!sessionId && messages.length === 0 ? (
                            /* Empty State */
                            <div className="h-full flex flex-col items-center justify-center px-4">
                                <div className="text-center max-w-md">
                                    <div className="w-20 h-20 bg-violet-50 dark:bg-violet-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
                                        <span className="text-4xl">🧠</span>
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                                        로날드
                                    </h2>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        10년차 수석 어소시에이트, 로날드입니다.<br />
                                        사건 자료를 공유하시거나 바로 대화를 시작하십시오.<br />
                                        <span className="text-violet-500 font-medium">감정은 없고 논리만 있습니다.</span>
                                    </p>
                                </div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-sm text-gray-400">대화를 시작해주세요.</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] ${msg.role === 'user'
                                        ? 'bg-violet-600 text-white rounded-2xl rounded-br-md px-5 py-3'
                                        : 'bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm'
                                        }`}>
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <SparklesIcon className="w-3.5 h-3.5 text-violet-500" />
                                                <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">로날드</span>
                                            </div>
                                        )}
                                        {msg.role === 'assistant' ? (
                                            <div className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 prose prose-sm prose-gray dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>p:last-child]:mb-0">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">
                                                {msg.content}
                                            </p>
                                        )}
                                        <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-violet-200' : 'text-gray-300 dark:text-zinc-600'
                                            }`}>
                                            {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Typing indicator */}
                        {isSending && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <SparklesIcon className="w-3.5 h-3.5 text-violet-500" />
                                        <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">로날드 분석 중</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="flex-shrink-0 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#1c1c1e] px-6 py-4">
                        <div className="flex gap-3 items-end">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="사건에 대해 이야기해주세요... (Shift+Enter로 줄바꿈)"
                                disabled={isSending}
                                rows={1}
                                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ minHeight: '44px', maxHeight: '120px' }}
                                onInput={(e) => {
                                    const t = e.currentTarget;
                                    t.style.height = 'auto';
                                    t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isSending}
                                className="flex-shrink-0 w-11 h-11 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 dark:disabled:bg-zinc-700 text-white rounded-xl flex items-center justify-center transition-all disabled:cursor-not-allowed"
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
