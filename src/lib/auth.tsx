import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AuthStatus = "loading" | "guest" | "demo" | "authed";

type AuthValue = {
  status: AuthStatus;
  studentId: string | null;
  signInDemo: () => Promise<void>;
  signIn: (studentId: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);
const KEY = "college.auth.v1";

type Stored = { status: "demo" | "authed"; studentId: string | null };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive) return;
        if (!raw) {
          setStatus("guest");
          return;
        }
        const parsed = JSON.parse(raw) as Stored;
        setStudentId(parsed.studentId ?? null);
        setStatus(parsed.status === "authed" ? "authed" : "demo");
      })
      .catch(() => alive && setStatus("guest"));
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback(async (next: Stored) => {
    setStudentId(next.studentId);
    setStatus(next.status);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const signInDemo = useCallback(async () => persist({ status: "demo", studentId: "20230001" }), [persist]);

  const signIn = useCallback(
    async (id: string, _token: string) => persist({ status: "authed", studentId: id }),
    [persist],
  );

  const signOut = useCallback(async () => {
    setStudentId(null);
    setStatus("guest");
    await AsyncStorage.removeItem(KEY);
  }, []);

  const value = useMemo(
    () => ({ status, studentId, signInDemo, signIn, signOut }),
    [status, studentId, signInDemo, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
