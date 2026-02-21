"use client";

import { useEffect, useState } from "react";

/**
 * 🎤 음성 입력 (STT) 버튼 컴포넌트
 * 
 * 모바일 앱(WebView) 환경에서만 표시됩니다.
 * 앱의 네이티브 음성 인식 기능을 호출하여 텍스트를 입력합니다.
 * 
 * 사용법:
 *   <div className="relative">
 *     <textarea id="stt-target" ... />
 *     <SttButton />
 *   </div>
 */

export default function SttButton({ className = "" }: { className?: string }) {
    const [isNativeApp, setIsNativeApp] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        // 네이티브 앱 환경 감지
        const checkNative = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((window as any).__LAWNALD_NATIVE_APP__) {
                setIsNativeApp(true);
            }
        };

        checkNative();
        // 앱이 늦게 주입할 수 있으므로 이벤트 리스너도 등록
        window.addEventListener("lawnald-native-ready", checkNative);

        // STT 상태 변경 이벤트 리스너
        const handleSttStatus = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setIsRecording(detail?.recording || false);
        };
        window.addEventListener("stt-status", handleSttStatus);

        return () => {
            window.removeEventListener("lawnald-native-ready", checkNative);
            window.removeEventListener("stt-status", handleSttStatus);
        };
    }, []);

    if (!isNativeApp) return null;

    const handlePress = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rn = (window as any).ReactNativeWebView;
        if (rn) {
            rn.postMessage("START_STT");
        }
    };

    return (
        <button
            type="button"
            onClick={handlePress}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${isRecording
                    ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/30"
                    : "bg-blue-600 hover:bg-blue-500 shadow-md"
                } ${className}`}
            title={isRecording ? "음성 인식 중지" : "음성으로 입력"}
        >
            {isRecording ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
            ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="23" x2="16" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )}
        </button>
    );
}
