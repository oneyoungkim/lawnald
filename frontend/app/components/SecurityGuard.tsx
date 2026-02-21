"use client";

import { useEffect } from "react";

/**
 * 클라이언트 사이드 소스 코드 보호 컴포넌트
 * - 우클릭 비활성화
 * - 텍스트 선택/복사 방지
 * - DevTools 감지 및 경고
 * - 키보드 단축키 차단 (F12, Ctrl+Shift+I, Ctrl+U 등)
 */
export default function SecurityGuard() {
    useEffect(() => {
        // 1. 우클릭 차단
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        // 2. 텍스트 선택 방지
        const handleSelectStart = (e: Event) => {
            // input, textarea에서는 허용
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
            e.preventDefault();
        };

        // 3. 키보드 단축키 차단
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+I (개발자 도구)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+J (콘솔)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                return false;
            }
            // Ctrl+U (소스보기)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                return false;
            }
            // Ctrl+S (페이지 저장)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+C (요소 검사)
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                return false;
            }
        };

        // 4. 복사 방지
        const handleCopy = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
            e.preventDefault();
        };

        // 5. 드래그 방지
        const handleDragStart = (e: DragEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
            e.preventDefault();
        };

        // 6. DevTools 열림 감지 (콘솔 경고)
        const devToolsWarning = () => {
            const threshold = 160;
            if (
                window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold
            ) {
                console.clear();
                console.log(
                    '%c⚠️ LAWNALD 보안 경고',
                    'color: red; font-size: 24px; font-weight: bold;'
                );
                console.log(
                    '%c이 브라우저 기능의 사용은 보안 상의 이유로 제한됩니다.\n무단 코드 복제 및 역설계는 법적 조치의 대상이 됩니다.',
                    'color: white; font-size: 14px;'
                );
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('dragstart', handleDragStart);

        const devToolsInterval = setInterval(devToolsWarning, 2000);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('selectstart', handleSelectStart);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('dragstart', handleDragStart);
            clearInterval(devToolsInterval);
        };
    }, []);

    return null;
}
