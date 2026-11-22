import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "college.memos.v1";

export type Stroke = { path: string; color: string; width: number };
export type Memo = { id: string; title: string; body: string; strokes: Stroke[]; updatedAt: number };

export async function loadMemos(): Promise<Memo[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveMemos(list: Memo[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function upsertMemo(memo: Omit<Memo, "updatedAt">): Promise<Memo[]> {
  const list = await loadMemos();
  const next: Memo = { ...memo, updatedAt: Date.now() };
  const idx = list.findIndex((m) => m.id === memo.id);
  if (idx >= 0) list[idx] = next;
  else list.unshift(next);
  await saveMemos(list);
  return list;
}

export async function deleteMemo(id: string): Promise<Memo[]> {
  const next = (await loadMemos()).filter((m) => m.id !== id);
  await saveMemos(next);
  return next;
}

export function memoText(body: string): string {
  return body.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
