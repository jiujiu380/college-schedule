import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "college.exams.v1";

export type Exam = {
  id: string;
  name: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  createdAt: number;
};

export async function loadExams(): Promise<Exam[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveExams(list: Exam[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function addExam(input: Omit<Exam, "id" | "createdAt">): Promise<Exam[]> {
  const list = await loadExams();
  const exam: Exam = { ...input, id: "ex-" + Date.now().toString(36), createdAt: Date.now() };
  const next = [...list, exam];
  await saveExams(next);
  return next;
}

export async function updateExam(id: string, input: Omit<Exam, "id" | "createdAt">): Promise<Exam[]> {
  const list = await loadExams();
  const next = list.map((e) => (e.id === id ? { ...e, ...input } : e));
  await saveExams(next);
  return next;
}

export async function deleteExam(id: string): Promise<Exam[]> {
  const next = (await loadExams()).filter((e) => e.id !== id);
  await saveExams(next);
  return next;
}

export function examTime(exam: Exam): number {
  const time = exam.time || "09:00";
  const t = new Date(exam.date + "T" + time).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function countdown(target: number): { days: number; hours: number; minutes: number; past: boolean } {
  const diff = target - Date.now();
  const past = diff < 0;
  const abs = Math.abs(diff);
  return {
    days: Math.floor(abs / 86400000),
    hours: Math.floor((abs % 86400000) / 3600000),
    minutes: Math.floor((abs % 3600000) / 60000),
    past,
  };
}
