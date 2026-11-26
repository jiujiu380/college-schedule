import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "college.study.sessions.v1";
const ACTIVE_KEY = "college.study.active.v1";

export type StudySession = { id: string; start: number; end: number; minutes: number };

export async function loadSessions(): Promise<StudySession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function loadActiveStart(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function startStudy(): Promise<number> {
  const now = Date.now();
  await AsyncStorage.setItem(ACTIVE_KEY, String(now));
  return now;
}

export async function stopStudy(): Promise<StudySession | null> {
  const start = await loadActiveStart();
  if (!start) return null;
  const end = Date.now();
  const minutes = Math.max(1, Math.round((end - start) / 60000));
  const session: StudySession = { id: "st-" + end.toString(36), start, end, minutes };
  const list = await loadSessions();
  await AsyncStorage.setItem(KEY, JSON.stringify([...list, session]));
  await AsyncStorage.removeItem(ACTIVE_KEY);
  return session;
}

export async function cancelStudy(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_KEY);
}
