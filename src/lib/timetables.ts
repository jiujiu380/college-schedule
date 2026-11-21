import AsyncStorage from "@react-native-async-storage/async-storage";
import { Course } from "./schedule";
import { Period, TOTAL_WEEKS } from "./time";
import { PERIODS_AUTUMN } from "./season";

export type TableUi = {
  rowHeight: number;
  radius: number;
  opacity: number;
  dividers: boolean;
};

export type Timetable = {
  id: string;
  name: string;
  courses: Course[];
  periods: Period[];
  totalWeeks: number;
  startDate: string; // 第1周周一 YYYY-MM-DD
  themeId: string;
  ui: TableUi;
  createdAt: string;
  updatedAt: string;
  source?: "demo" | "import" | "api";
};

const KEY = "college.timetables.v1";
const ACTIVE_KEY = "college.timetables.active.v1";

export const DEFAULT_UI: TableUi = { rowHeight: 64, radius: 6, opacity: 1, dividers: true };

export const DEMO_TABLES: Timetable[] = [
  {
    id: "local-1",
    name: "我的课表",
    courses: [],
    periods: PERIODS_AUTUMN,
    totalWeeks: TOTAL_WEEKS,
    startDate: "2026-09-07",
    themeId: "classic",
    ui: DEFAULT_UI,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "demo",
  },
];

export type TablesState = { tables: Timetable[]; activeId: string };

export async function loadTables(): Promise<TablesState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const active = (await AsyncStorage.getItem(ACTIVE_KEY)) ?? "";
    if (!raw) return { tables: DEMO_TABLES, activeId: DEMO_TABLES[0].id };
    const tables = JSON.parse(raw) as Timetable[];
    if (!Array.isArray(tables) || !tables.length) return { tables: DEMO_TABLES, activeId: DEMO_TABLES[0].id };
    const activeId = tables.some((t) => t.id === active) ? active : tables[0].id;
    return { tables, activeId };
  } catch {
    return { tables: DEMO_TABLES, activeId: DEMO_TABLES[0].id };
  }
}

export async function saveTables(state: TablesState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state.tables));
  await AsyncStorage.setItem(ACTIVE_KEY, state.activeId);
}

export function newTable(name: string, courses: Course[] = [], periods?: Period[]): Timetable {
  const now = new Date().toISOString();
  return {
    id: `t-${Date.now()}`,
    name,
    courses,
    periods: periods?.length ? periods : PERIODS_AUTUMN,
    totalWeeks: TOTAL_WEEKS,
    startDate: mondayISO(new Date()),
    themeId: "classic",
    ui: DEFAULT_UI,
    createdAt: now,
    updatedAt: now,
    source: "demo",
  };
}

export function mondayISO(d: Date): string {
  const day = d.getDay() === 0 ? 7 : d.getDay();
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (day - 1));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

export function weekOfDate(startDate: string, date: Date = new Date()): number {
  const [y, m, d] = startDate.split("-").map(Number);
  const start = new Date(y, (m ?? 1) - 1, d ?? 1);
  const diff = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return Math.floor(diff / 7) + 1;
}