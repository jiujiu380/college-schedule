import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "college.backup.history.v1";
const MAX = 10;

export const SNAPSHOT_KEYS = [
  "college.timetables.v1",
  "college.timetables.active.v1",
  "college.memos.v1",
  "college.events.v1",
  "college.homework.v1",
  "college.exams.v1",
  "college.theme.mode.v1",
  "college.accent.v1",
];

export type Snapshot = {
  id: string;
  at: number;
  data: Record<string, string | null>;
};

export async function loadSnapshots(): Promise<Snapshot[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function saveSnapshots(list: Snapshot[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export async function createSnapshot(force = false): Promise<Snapshot | null> {
  const current = await AsyncStorage.multiGet(SNAPSHOT_KEYS);
  const data: Record<string, string | null> = {};
  for (const [k, v] of current) data[k] = v;

  if (!data["college.timetables.v1"]) return null;
  const history = await loadSnapshots();
  const last = history[0];
  const same = last && last.data["college.timetables.v1"] === data["college.timetables.v1"];
  if (last && same && !force && Date.now() - last.at < 24 * 60 * 60 * 1000) return null;

  const snap: Snapshot = { id: "bk-" + Date.now().toString(36), at: Date.now(), data };
  await saveSnapshots([snap, ...history].slice(0, MAX));
  return snap;
}

export async function restoreSnapshot(id: string): Promise<Snapshot | null> {
  const history = await loadSnapshots();
  const snap = history.find((s) => s.id === id);
  if (!snap) return null;
  const pairs = Object.entries(snap.data).filter(([, v]) => v != null).map(([k, v]) => [k, v as string] as [string, string]);
  await AsyncStorage.multiSet(pairs);
  return snap;
}

export async function deleteSnapshot(id: string): Promise<Snapshot[]> {
  const next = (await loadSnapshots()).filter((s) => s.id !== id);
  await saveSnapshots(next);
  return next;
}

export function snapshotCourses(snap: Snapshot): number {
  try {
    const raw = snap.data["college.timetables.v1"];
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const tables = Array.isArray(parsed?.tables) ? parsed.tables : Array.isArray(parsed) ? parsed : [];
    return tables.reduce((sum: number, t: any) => sum + (Array.isArray(t?.courses) ? t.courses.length : 0), 0);
  } catch {
    return 0;
  }
}

export function snapshotTables(snap: Snapshot): { tables: any[]; activeId: string } | null {
  try {
    const raw = snap.data["college.timetables.v1"];
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const tables = Array.isArray(parsed?.tables) ? parsed.tables : Array.isArray(parsed) ? parsed : [];
    if (!tables.length) return null;
    return { tables, activeId: snap.data["college.timetables.active.v1"] || parsed?.activeId || tables[0].id };
  } catch {
    return null;
  }
}
