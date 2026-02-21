import React, { useRef, useState, useEffect, useCallback } from "react";
import {
    Platform,
    BackHandler,
    StatusBar,
    ActivityIndicator,
    View,
    StyleSheet,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from "expo-speech-recognition";

// ─── 설정 ───────────────────────────────────────
const WEB_URL = "https://www.lawnald.com"; // 프로덕션 URL (개발 시 http://YOUR_IP:3000)
const API_URL = "https://www.lawnald.com/api"; // 백엔드 API

// 스플래시 자동 숨김 방지 (웹뷰 로딩 완료까지 유지)
SplashScreen.preventAutoHideAsync();

// 알림 핸들러 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// ─── 푸시 알림 토큰 등록 ─────────────────────────
async function registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
        console.log("푸시 알림은 실제 디바이스에서만 동작합니다.");
        return null;
    }

    // 권한 요청
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        console.log("푸시 알림 권한이 거부되었습니다.");
        return null;
    }

    // Android 알림 채널 설정
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "기본 알림",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
        });
    }

    // Expo Push Token 획득
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId || undefined,
    });

    return tokenData.data;
}

async function sendTokenToServer(pushToken: string) {
    try {
        await fetch(`${API_URL}/push/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ push_token: pushToken }),
        });
        console.log("✅ Push token 서버 전송 완료");
    } catch (e) {
        console.error("Push token 전송 실패:", e);
    }
}

// ─── 메인 앱 ─────────────────────────────────────
export default function App() {
    const webViewRef = useRef<WebView>(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // ── 1. 푸시 알림 초기화 ──
    useEffect(() => {
        registerForPushNotifications().then((token) => {
            if (token) {
                console.log("Push Token:", token);
                sendTokenToServer(token);
            }
        });

        // 알림 클릭 시 해당 URL로 이동
        const subscription = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const url = response.notification.request.content.data?.url;
                if (url && webViewRef.current) {
                    webViewRef.current.injectJavaScript(
                        `window.location.href = '${url}'; true;`
                    );
                }
            }
        );

        return () => subscription.remove();
    }, []);

    // ── 2. Android 뒤로 가기 처리 ──
    useEffect(() => {
        if (Platform.OS !== "android") return;

        const backAction = () => {
            if (canGoBack && webViewRef.current) {
                webViewRef.current.goBack();
                return true; // 기본 동작(앱 종료) 방지
            }
            return false; // 최초 페이지 → 기본 동작(앱 종료)
        };

        const handler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );
        return () => handler.remove();
    }, [canGoBack]);

    // ── 3. 음성 인식 (STT) 이벤트 ──
    useSpeechRecognitionEvent("result", (event) => {
        if (event.results && event.results.length > 0) {
            const transcript = event.results[0]?.transcript || "";
            if (transcript && webViewRef.current) {
                // 인식된 텍스트를 웹뷰 textarea에 삽입
                const escaped = transcript.replace(/'/g, "\\'").replace(/\n/g, "\\n");
                webViewRef.current.injectJavaScript(`
          (function() {
            // STT_TARGET_ID가 있으면 해당 요소에 삽입
            var el = document.getElementById('stt-target');
            if (!el) {
              // textarea 중 포커스된 요소 찾기
              el = document.activeElement;
            }
            if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
              var start = el.selectionStart || el.value.length;
              el.value = el.value.substring(0, start) + '${escaped}' + el.value.substring(el.selectionEnd || start);
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
            // React state 업데이트를 위한 nativeInputValueSetter
            var nativeSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement?.prototype || window.HTMLInputElement?.prototype, 'value'
            )?.set;
            if (nativeSetter && el) {
              nativeSetter.call(el, el.value);
              el.dispatchEvent(new Event('input', { bubbles: true }));
            }
          })();
          true;
        `);
            }
        }
    });

    useSpeechRecognitionEvent("end", () => {
        setIsRecording(false);
        // 녹음 종료를 웹에 알림
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
        window.dispatchEvent(new CustomEvent('stt-status', { detail: { recording: false } }));
        true;
      `);
        }
    });

    useSpeechRecognitionEvent("error", (event) => {
        console.error("STT Error:", event.error);
        setIsRecording(false);
    });

    const startSpeechRecognition = useCallback(async () => {
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!result.granted) {
            console.log("마이크 권한 거부됨");
            return;
        }

        setIsRecording(true);
        ExpoSpeechRecognitionModule.start({
            lang: "ko-KR",
            interimResults: true,
            continuous: false,
        });

        // 녹음 시작을 웹에 알림
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
        window.dispatchEvent(new CustomEvent('stt-status', { detail: { recording: true } }));
        true;
      `);
        }
    }, []);

    const stopSpeechRecognition = useCallback(() => {
        ExpoSpeechRecognitionModule.stop();
        setIsRecording(false);
    }, []);

    // ── 4. WebView ↔ RN 메시지 브릿지 ──
    const onWebViewMessage = (event: WebViewMessageEvent) => {
        const message = event.nativeEvent.data;

        if (message === "START_STT") {
            if (isRecording) {
                stopSpeechRecognition();
            } else {
                startSpeechRecognition();
            }
        }
    };

    // ── 5. 스플래시 스크린 → 웹뷰 로딩 완료 후 숨김 ──
    const handleLoadEnd = useCallback(() => {
        setIsLoaded(true);
        SplashScreen.hideAsync();
    }, []);

    // 웹뷰에 모바일 앱 환경임을 알리는 JS 주입
    const injectedJS = `
    (function() {
      window.__LAWNALD_NATIVE_APP__ = true;
      window.__LAWNALD_PLATFORM__ = '${Platform.OS}';
      
      // 커스텀 이벤트 발생 → 웹에서 감지
      window.dispatchEvent(new CustomEvent('lawnald-native-ready'));
    })();
    true;
  `;

    return (
        <SafeAreaProvider>
            <StatusBar barStyle="light-content" backgroundColor="#070b14" />
            <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: WEB_URL }}
                    style={styles.webview}
                    // 네비게이션 상태 추적
                    onNavigationStateChange={(navState) =>
                        setCanGoBack(navState.canGoBack)
                    }
                    // 로딩 완료 → 스플래시 숨김
                    onLoadEnd={handleLoadEnd}
                    // JS 브릿지
                    onMessage={onWebViewMessage}
                    injectedJavaScript={injectedJS}
                    // 성능 최적화
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                        </View>
                    )}
                    // 설정
                    allowsBackForwardNavigationGestures={true} // iOS 스와이프 뒤로
                    mediaPlaybackRequiresUserAction={false}
                    allowsInlineMediaPlayback={true}
                    sharedCookiesEnabled={true}
                    thirdPartyCookiesEnabled={true}
                    // User Agent에 앱 식별자 추가
                    applicationNameForUserAgent="LawnaldApp/1.0"
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#070b14",
    },
    webview: {
        flex: 1,
        backgroundColor: "#070b14",
    },
    loadingContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#070b14",
    },
});
