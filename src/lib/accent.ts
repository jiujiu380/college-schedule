import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "college.accent.v1";
let current = "classic";
const subs = new Set<(id: string) => void>();

export async function initAccent(): Promise<string> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v) current = v;
  } catch {
    // ignore
  }
  return current;
}

export function getAccent(): string {
  return current;
}

export function setAccent(id: string): void {
  if (!id || current === id) return;
  current = id;
  AsyncStorage.setItem(KEY, id).catch(() => {});
  subs.forEach((cb) => cb(id));
}

export function subscribeAccent(cb: (id: string) => void): () => void {
  subs.add(cb);
  return () => subs.delete(cb);
}
