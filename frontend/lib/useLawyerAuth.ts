"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

interface LawyerAuth {
    lawyer: any | null;
    loading: boolean;
    isLoggedIn: boolean;
    logout: () => void;
    refresh: () => void;
}

/**
 * Shared hook for lawyer authentication.
 * Reads from localStorage on mount and optionally syncs with server.
 * If `redirectIfUnauthenticated` is true, redirects to /login when no session found.
 */
export function useLawyerAuth(redirectIfUnauthenticated = false): LawyerAuth {
    const [lawyer, setLawyer] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const loadFromStorage = () => {
        try {
            const stored = localStorage.getItem("lawyer_user");
            if (stored) {
                const parsed = JSON.parse(stored);
                setLawyer(parsed);
                return parsed;
            }
        } catch { }
        return null;
    };

    const syncWithServer = async (localData: any) => {
        if (!localData?.id) return;
        try {
            const res = await fetch(`${API_BASE}/api/lawyers/${localData.id}`);
            if (res.ok) {
                const serverData = await res.json();
                const merged = { ...localData, ...serverData };
                setLawyer(merged);
                localStorage.setItem("lawyer_user", JSON.stringify(merged));
            }
        } catch {
            // Server unreachable — keep local data, don't log out
        }
    };

    useEffect(() => {
        const localData = loadFromStorage();
        if (localData) {
            syncWithServer(localData).finally(() => setLoading(false));
        } else {
            setLoading(false);
            if (redirectIfUnauthenticated) {
                router.push("/login");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const logout = () => {
        localStorage.removeItem("lawyer_user");
        setLawyer(null);
        router.push("/login");
    };

    const refresh = () => {
        const localData = loadFromStorage();
        if (localData) {
            syncWithServer(localData);
        }
    };

    return {
        lawyer,
        loading,
        isLoggedIn: !!lawyer,
        logout,
        refresh,
    };
}
