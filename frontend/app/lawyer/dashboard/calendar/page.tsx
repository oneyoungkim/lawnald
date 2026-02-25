"use client";

import { useState, useEffect, useCallback } from "react";
import {
    PlusIcon,
    CalendarDaysIcon,
    ClockIcon,
    TrashIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
    colorId?: string;
}

const GOOGLE_CLIENT_ID = "1030277557352-gkm7ah5v5883a2huo166oqmr6cu16qjq.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar";

export default function CalendarPage() {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [viewMonth, setViewMonth] = useState(() => {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth() };
    });

    // Check for existing token
    useEffect(() => {
        const stored = localStorage.getItem("google_calendar_token");
        if (stored) {
            const data = JSON.parse(stored);
            if (data.expiry > Date.now()) {
                setAccessToken(data.token);
            } else {
                localStorage.removeItem("google_calendar_token");
            }
        }
    }, []);

    // Fetch events when token is available
    useEffect(() => {
        if (accessToken) fetchEvents();
    }, [accessToken, viewMonth]);

    // Google OAuth popup
    const connectGoogle = () => {
        const redirectUri = encodeURIComponent(window.location.origin + "/oauth/calendar-callback");
        const scope = encodeURIComponent(SCOPES);
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=consent&access_type=online`;

        const w = 500, h = 600;
        const left = window.screenX + (window.outerWidth - w) / 2;
        const top = window.screenY + (window.outerHeight - h) / 2;
        window.open(authUrl, "google_calendar_auth", `width=${w},height=${h},left=${left},top=${top}`);

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === "GOOGLE_CALENDAR_TOKEN") {
                window.removeEventListener("message", handleMessage);
                const token = event.data.token;
                const expiry = Date.now() + 3600 * 1000; // 1 hour
                localStorage.setItem("google_calendar_token", JSON.stringify({ token, expiry }));
                setAccessToken(token);
            }
        };
        window.addEventListener("message", handleMessage);
    };

    // Fetch events from Google Calendar
    const fetchEvents = async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const start = new Date(viewMonth.year, viewMonth.month, 1).toISOString();
            const end = new Date(viewMonth.year, viewMonth.month + 1, 0, 23, 59, 59).toISOString();
            const res = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime&maxResults=100`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setEvents((data.items || []).map((e: any) => ({
                    id: e.id,
                    summary: e.summary || "(제목 없음)",
                    description: e.description,
                    start: e.start?.dateTime || e.start?.date || "",
                    end: e.end?.dateTime || e.end?.date || "",
                    location: e.location,
                })));
            } else if (res.status === 401) {
                localStorage.removeItem("google_calendar_token");
                setAccessToken(null);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // Add event
    const addEvent = async (summary: string, date: string, startTime: string, endTime: string, description: string) => {
        if (!accessToken) return;
        try {
            const startDt = `${date}T${startTime}:00+09:00`;
            const endDt = `${date}T${endTime}:00+09:00`;
            const res = await fetch(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        summary,
                        description,
                        start: { dateTime: startDt, timeZone: "Asia/Seoul" },
                        end: { dateTime: endDt, timeZone: "Asia/Seoul" },
                    }),
                }
            );
            if (res.ok) {
                setShowAddForm(false);
                fetchEvents();
            }
        } catch (err) { console.error(err); }
    };

    // Delete event
    const deleteEvent = async (eventId: string) => {
        if (!accessToken || !confirm("이 일정을 삭제하시겠습니까?")) return;
        try {
            await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
                { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setEvents(prev => prev.filter(e => e.id !== eventId));
        } catch (err) { console.error(err); }
    };

    // Calendar grid
    const getDaysInMonth = () => {
        const firstDay = new Date(viewMonth.year, viewMonth.month, 1);
        const lastDay = new Date(viewMonth.year, viewMonth.month + 1, 0);
        const days: (number | null)[] = [];
        for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
        for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
        return days;
    };

    const getEventsForDay = (day: number) => {
        const dateStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return events.filter(e => e.start.startsWith(dateStr));
    };

    const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const todayStr = new Date().toISOString().split("T")[0];

    // Disconnect
    const disconnect = () => {
        localStorage.removeItem("google_calendar_token");
        setAccessToken(null);
        setEvents([]);
    };

    // Not connected state
    if (!accessToken) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] dark:bg-zinc-950 flex items-center justify-center p-6">
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-12 text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CalendarDaysIcon className="w-10 h-10 text-blue-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Google Calendar 연동</h1>
                    <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                        Google 캘린더를 연동하면 재판 기일, 상담 예약, 서면 제출 기한을 한곳에서 관리할 수 있습니다.
                    </p>
                    <button
                        onClick={connectGoogle}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-zinc-200 rounded-2xl hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        <span className="font-bold text-zinc-800 text-sm">Google 계정으로 연결하기</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-zinc-950">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">캘린더</h1>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircleIcon className="w-3.5 h-3.5" /> Google 연동됨
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchEvents} disabled={loading} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                            <ArrowPathIcon className={`w-5 h-5 text-zinc-500 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:scale-105 active:scale-95 transition-all text-sm shadow-lg">
                            <PlusIcon className="w-4 h-4" /> 일정 추가
                        </button>
                        <button onClick={disconnect} className="text-xs text-zinc-400 hover:text-red-500 transition-colors">연결 해제</button>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
                {/* Calendar Grid */}
                <div className="flex-1">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                            <button onClick={() => setViewMonth(prev => {
                                const m = prev.month === 0 ? 11 : prev.month - 1;
                                const y = prev.month === 0 ? prev.year - 1 : prev.year;
                                return { year: y, month: m };
                            })} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">←</button>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{viewMonth.year}년 {monthNames[viewMonth.month]}</h2>
                            <button onClick={() => setViewMonth(prev => {
                                const m = prev.month === 11 ? 0 : prev.month + 1;
                                const y = prev.month === 11 ? prev.year + 1 : prev.year;
                                return { year: y, month: m };
                            })} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">→</button>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800">
                            {dayNames.map(d => (
                                <div key={d} className={`text-center py-2 text-[11px] font-bold uppercase tracking-wider ${d === "일" ? "text-red-400" : d === "토" ? "text-blue-400" : "text-zinc-400"}`}>
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Day Grid */}
                        <div className="grid grid-cols-7">
                            {getDaysInMonth().map((day, i) => {
                                if (day === null) return <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-zinc-50 dark:border-zinc-800" />;
                                const dateStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                const dayEvents = getEventsForDay(day);
                                const isToday = dateStr === todayStr;
                                const isSelected = dateStr === selectedDate;
                                const dayOfWeek = new Date(viewMonth.year, viewMonth.month, day).getDay();

                                return (
                                    <div
                                        key={day}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={`min-h-[100px] p-2 border-b border-r border-zinc-50 dark:border-zinc-800 cursor-pointer transition-colors ${isSelected ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}
                                    >
                                        <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-blue-500 text-white" : dayOfWeek === 0 ? "text-red-400" : dayOfWeek === 6 ? "text-blue-400" : "text-zinc-600 dark:text-zinc-400"
                                            }`}>
                                            {day}
                                        </div>
                                        <div className="space-y-0.5">
                                            {dayEvents.slice(0, 3).map(ev => (
                                                <div key={ev.id} className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded truncate font-medium">
                                                    {ev.summary}
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[9px] text-zinc-400 px-1.5">+{dayEvents.length - 3}건</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Selected Day Events */}
                <div className="w-[320px] flex-shrink-0">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sticky top-6">
                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">
                            {selectedDate} 일정
                        </h3>
                        {(() => {
                            const dayNum = parseInt(selectedDate.split("-")[2]);
                            const dayEvents = events.filter(e => e.start.startsWith(selectedDate));
                            if (dayEvents.length === 0) {
                                return (
                                    <div className="text-center py-8 text-zinc-300">
                                        <CalendarDaysIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm font-medium">일정이 없습니다</p>
                                    </div>
                                );
                            }
                            return (
                                <div className="space-y-3">
                                    {dayEvents.map(ev => (
                                        <div key={ev.id} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl group">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">{ev.summary}</h4>
                                                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
                                                        <ClockIcon className="w-3.5 h-3.5" />
                                                        {ev.start.includes("T") ? (
                                                            <span>{ev.start.split("T")[1]?.substring(0, 5)} ~ {ev.end.split("T")[1]?.substring(0, 5)}</span>
                                                        ) : (
                                                            <span>종일</span>
                                                        )}
                                                    </div>
                                                    {ev.location && <p className="text-[10px] text-zinc-400 mt-1">📍 {ev.location}</p>}
                                                    {ev.description && <p className="text-[10px] text-zinc-500 mt-2 line-clamp-2">{ev.description}</p>}
                                                </div>
                                                <button onClick={() => deleteEvent(ev.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded transition-all">
                                                    <TrashIcon className="w-3.5 h-3.5 text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 transition-colors text-sm font-medium"
                        >
                            <PlusIcon className="w-4 h-4" /> 이 날짜에 일정 추가
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            {showAddForm && (
                <AddEventModal
                    defaultDate={selectedDate}
                    onClose={() => setShowAddForm(false)}
                    onAdd={addEvent}
                />
            )}
        </div>
    );
}

function AddEventModal({ defaultDate, onClose, onAdd }: {
    defaultDate: string;
    onClose: () => void;
    onAdd: (summary: string, date: string, start: string, end: string, desc: string) => void;
}) {
    const [form, setForm] = useState({
        summary: "",
        date: defaultDate,
        startTime: "10:00",
        endTime: "11:00",
        description: "",
    });

    const presets = [
        { label: "재판 기일", icon: "⚖️" },
        { label: "의뢰인 상담", icon: "👤" },
        { label: "서면 제출 기한", icon: "📄" },
        { label: "증인 미팅", icon: "🗣️" },
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">일정 추가</h2>

                {/* Quick Presets */}
                <div className="flex gap-2 mb-5 flex-wrap">
                    {presets.map(p => (
                        <button
                            key={p.label}
                            onClick={() => setForm({ ...form, summary: p.label })}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${form.summary === p.label ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"}`}
                        >
                            {p.icon} {p.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">일정 제목</label>
                        <input className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="재판 기일, 상담 예약 등..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">날짜</label>
                        <input type="date" className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">시작</label>
                            <input type="time" className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">종료</label>
                            <input type="time" className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">메모</label>
                        <textarea className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border-0 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="사건 내용, 준비물 등..." />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold text-zinc-500 text-sm">취소</button>
                    <button onClick={() => form.summary.trim() && onAdd(form.summary, form.date, form.startTime, form.endTime, form.description)} disabled={!form.summary.trim()} className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50">추가</button>
                </div>
            </div>
        </div>
    );
}
