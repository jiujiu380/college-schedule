import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "college.homework.v1";

export type Homework = {
  id: string;
  courseId: string;
  date: string;
  text: string;
  done: boolean;
  due?: string;
  createdAt: number;
};

export async function loadHomework(): Promise<Homework[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveHomework(list: Homework[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function addHomework(courseId: string, date: string, text: string, due?: string): Promise<Homework[]> {
  const list = await loadHomework();
  const item: Homework = { id: "hw-" + Date.now().toString(36), courseId, date, text: text.trim(), done: false, due, createdAt: Date.now() };
  const next = [item, ...list];
  await saveHomework(next);
  return next;
}

export async function toggleHomework(id: string): Promise<Homework[]> {
  const list = await loadHomework();
  const next = list.map((h) => (h.id === id ? { ...h, done: !h.done } : h));
  await saveHomework(next);
  return next;
}

export async function deleteHomework(id: string): Promise<Homework[]> {
  const next = (await loadHomework()).filter((h) => h.id !== id);
  await saveHomework(next);
  return next;
}

export function occurrenceDate(startDate: string, week: number, weekday: number): string {
  const [y, m, d] = startDate.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + (week - 1) * 7 + (weekday - 1));
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}