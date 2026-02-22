"use client";

import { API_BASE } from "@/lib/api";

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeftIcon,
    DocumentArrowUpIcon,
    TrashIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    DocumentTextIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline';

interface UploadedFile {
    id: string;
    file: File;
    preview?: string;
    type: 'pdf' | 'image';
}

export default function EvidenceProcessorPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState('');

    // Generate unique ID
    const genId = () => Math.random().toString(36).slice(2, 10);

    // Add files handler
    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'application/pdf'];
        const validFiles: UploadedFile[] = [];

        Array.from(newFiles).forEach(file => {
            if (!allowed.includes(file.type)) {
                setError(`지원하지 않는 파일 형식입니다: ${file.name}`);
                return;
            }

            const entry: UploadedFile = {
                id: genId(),
                file,
                type: file.type === 'application/pdf' ? 'pdf' : 'image',
            };

            // Image preview
            if (entry.type === 'image') {
                entry.preview = URL.createObjectURL(file);
            }

            validFiles.push(entry);
        });

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
            setError('');
        }
    }, []);

    // Drag & Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = () => setIsDragOver(false);
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    };

    // File operations
    const removeFile = (id: string) => {
        setFiles(prev => {
            const removed = prev.find(f => f.id === id);
            if (removed?.preview) URL.revokeObjectURL(removed.preview);
            return prev.filter(f => f.id !== id);
        });
    };

    const moveFile = (index: number, direction: 'up' | 'down') => {
        setFiles(prev => {
            const newFiles = [...prev];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= newFiles.length) return prev;
            [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
            return newFiles;
        });
    };

    // Process & Download
    const handleProcess = async () => {
        if (files.length === 0) {
            setError('파일을 1개 이상 업로드해 주세요.');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const formData = new FormData();
            files.forEach(f => {
                formData.append('files', f.file);
            });

            const res = await fetch(`${API_BASE}/api/merge-evidence`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.detail || 'PDF 병합에 실패했습니다.');
            }

            // Download the PDF
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Extract filename from header or use default
            const disposition = res.headers.get('content-disposition');
            let filename = `갑호증_병합_${new Date().toISOString().slice(0, 10)}.pdf`;
            if (disposition) {
                const match = disposition.match(/filename="?(.+?)"?$/);
                if (match) filename = decodeURIComponent(match[1]);
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (e: any) {
            console.error('Evidence processing failed:', e);
            setError(e.message || '서버 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0a0a0a]">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/lawyer/dashboard')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                📄 갑호증 자동 넘버링 · PDF 병합
                            </h1>
                            <p className="text-xs text-gray-400">증거자료에 호증 번호를 스탬프하고 하나의 PDF로 병합합니다</p>
                        </div>
                    </div>
                    {files.length > 0 && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            {files.length}개 파일
                        </span>
                    )}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

                {/* Drop Zone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200 ${isDragOver
                        ? 'border-blue-400 bg-blue-50/80 dark:bg-blue-900/20 scale-[1.01]'
                        : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-[#1c1c1e] hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf"
                        className="hidden"
                        onChange={(e) => e.target.files && addFiles(e.target.files)}
                    />

                    <div className="flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragOver ? 'bg-blue-100 dark:bg-blue-800/40' : 'bg-gray-100 dark:bg-zinc-800'
                            }`}>
                            <DocumentArrowUpIcon className={`w-8 h-8 ${isDragOver ? 'text-blue-500' : 'text-gray-400'
                                }`} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                                {isDragOver ? '여기에 놓으세요!' : '파일을 드래그 앤 드롭하거나 클릭하여 업로드'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                JPG, PNG, PDF 파일 지원 · 여러 파일 동시 업로드 가능
                            </p>
                        </div>
                    </div>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                업로드된 파일 (순서 = 호증 번호)
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                화살표 버튼으로 순서를 변경할 수 있습니다. 위에서부터 갑 제1호증, 제2호증 순으로 넘버링됩니다.
                            </p>
                        </div>

                        <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                            {files.map((file, index) => (
                                <div
                                    key={file.id}
                                    className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors group"
                                >
                                    {/* Number Badge */}
                                    <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-black text-red-600 dark:text-red-400">
                                            {index + 1}호
                                        </span>
                                    </div>

                                    {/* Preview / Icon */}
                                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                                        {file.preview ? (
                                            <img src={file.preview} alt="" className="w-full h-full object-cover" />
                                        ) : file.type === 'pdf' ? (
                                            <DocumentTextIcon className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <PhotoIcon className="w-5 h-5 text-blue-500" />
                                        )}
                                    </div>

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                            {file.file.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {formatFileSize(file.file.size)} · {file.type === 'pdf' ? 'PDF' : '이미지'}
                                        </p>
                                    </div>

                                    {/* Label Preview */}
                                    <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg whitespace-nowrap">
                                        [갑 제{index + 1}호증]
                                    </span>

                                    {/* Reorder Buttons */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => moveFile(index, 'up')}
                                            disabled={index === 0}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-20 transition-colors"
                                            title="위로 이동"
                                        >
                                            <ArrowUpIcon className="w-4 h-4 text-gray-500" />
                                        </button>
                                        <button
                                            onClick={() => moveFile(index, 'down')}
                                            disabled={index === files.length - 1}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-20 transition-colors"
                                            title="아래로 이동"
                                        >
                                            <ArrowDownIcon className="w-4 h-4 text-gray-500" />
                                        </button>
                                        <button
                                            onClick={() => removeFile(file.id)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            title="삭제"
                                        >
                                            <TrashIcon className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
                        ⚠️ {error}
                    </div>
                )}

                {/* Process Button */}
                {files.length > 0 && (
                    <button
                        onClick={handleProcess}
                        disabled={isProcessing}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                갑호증 넘버링 및 PDF 병합 중...
                            </>
                        ) : (
                            <>
                                📄 갑호증 넘버링 및 PDF 병합하기 ({files.length}개 파일 → 1개 PDF)
                            </>
                        )}
                    </button>
                )}

                {/* Info Card */}
                <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">💡 사용 안내</h3>
                    <ul className="text-xs text-amber-700/80 dark:text-amber-400/70 space-y-1.5 leading-relaxed">
                        <li>• 파일 순서대로 <strong>[갑 제1호증]</strong>, <strong>[갑 제2호증]</strong> ... 으로 자동 넘버링됩니다.</li>
                        <li>• 이미지 파일은 자동으로 A4 크기 PDF로 변환됩니다.</li>
                        <li>• PDF 파일의 경우, 각 페이지마다 별도의 호증 번호가 부여됩니다.</li>
                        <li>• 모든 파일이 하나의 PDF로 병합되어 다운로드됩니다.</li>
                        <li>• <strong>우측 상단</strong>에 붉은색으로 호증 번호가 스탬프됩니다.</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
