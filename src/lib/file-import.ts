import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as XLSX from "xlsx";
import { Course } from "./schedule";
import { parseWeeks } from "./timetable-html";

export type PickedFile = { name: string; kind: "xlsx" | "csv" | "json" | "unknown"; text?: string; base64?: string };

export async function pickImportFile(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "text/plain", "application/json", "*/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  const name = asset.name ?? "file";
  const lower = name.toLowerCase();
  const kind = lower.endsWith(".xlsx") || lower.endsWith(".xls") ? "xlsx" : lower.endsWith(".csv") ? "csv" : lower.endsWith(".json") ? "json" : "unknown";
  if (kind === "xlsx") {
    const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
    return { name, kind, base64 };
  }
  const text = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
  return { name, kind, text };
}

const ALIASES = {
  name: ["课程名", "课程名称", "课程", "名称", "course", "name"],
  weekday: ["星期", "周几", "星期几", "上课星期", "weekday", "day"],
  start: ["开始节", "起始节", "开始", "节次", "start", "startperiod"],
  end: ["结束节", "终止节", "结束", "end", "endperiod"],
  weeks: ["周次", "上课周", "周数", "week", "weeks"],
  teacher: ["教师", "老师", "任课教师", "teacher"],
  location: ["地点", "教室", "上课地点", "location", "room"],
};

function matchColumn(header: string, keys: string[]): boolean {
  const h = String(header ?? "").toLowerCase().replace(/\s/g, "");
  return keys.some((k) => h.includes(k.toLowerCase()));
}

export function parseRowsToCourses(rows: any[][]): Course[] {
  if (!rows?.length) return [];
  const header = rows[0].map((c) => String(c ?? ""));
  const hasHeader = header.some((h) => matchColumn(h, ALIASES.name)) || header.filter((h) => h && h.length < 8).length >= 3;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const idx = { name: -1, weekday: -1, start: -1, end: -1, weeks: -1, teacher: -1, location: -1 };
  if (hasHeader) {
    (Object.keys(idx) as (keyof typeof idx)[]).forEach((key) => {
      idx[key] = header.findIndex((h) => matchColumn(h, ALIASES[key]));
    });
  }
  const fallback = { name: 0, weekday: 1, start: 2, end: 3, weeks: 4, teacher: 5, location: 6 };
  (Object.keys(idx) as (keyof typeof idx)[]).forEach((key) => {
    if (idx[key] < 0) idx[key] = fallback[key];
  });

  const courses: Course[] = [];
  let seq = 0;
  for (const row of dataRows) {
    if (!row) continue;
    const name = String(row[idx.name] ?? "").trim();
    if (!name || /课程名|名称/.test(name)) continue;
    const weekday = parseWeekdayCell(row[idx.weekday]);
    if (!weekday) continue;
    const periods = parsePeriodCells(row[idx.start], row[idx.end]);
    if (!periods) continue;
    const weeksRaw = row[idx.weeks];
    const weeks = weeksRaw != null && String(weeksRaw).trim()
      ? parseWeeks(String(weeksRaw))
      : Array.from({ length: 20 }, (_, i) => i + 1);
    courses.push({
      id: `file-${++seq}`,
      name,
      teacher: String(row[idx.teacher] ?? "").trim() || undefined,
      location: String(row[idx.location] ?? "").trim() || undefined,
      weekday,
      startPeriod: periods.start,
      endPeriod: periods.end,
      weeks: weeks.length ? weeks : Array.from({ length: 20 }, (_, i) => i + 1),
    });
  }
  return courses;
}

export function parseWorkbookBase64(base64: string): Course[] {
  const wb = XLSX.read(base64, { type: "base64" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" }) as any[][];
  return parseRowsToCourses(rows);
}

export function parseCsvText(text: string): Course[] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[,\t;]/).map((c) => c.trim().replace(/^"|"$/g, "")));
  return parseRowsToCourses(rows);
}

export function parseWeekdayCell(v: any): number {
  if (typeof v === "number" && v >= 1 && v <= 7) return Math.floor(v);
  const s = String(v ?? "").trim();
  if (/^[1-7]$/.test(s)) return Number(s);
  const map: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 };
  const key = s.replace(/周|星期/g, "").trim();
  return map[key] ?? 0;
}

export function parsePeriodCells(start: any, end: any): { start: number; end: number } | null {
  const raw = String(start ?? "").replace(/[第节\s]/g, "");
  const m = raw.match(/^(\d{1,2})(?:-(\d{1,2}))?$/);
  if (m) {
    const s = Number(m[1]);
    const e = m[2] ? Number(m[2]) : Number(end) || s;
    if (s >= 1 && e <= 12 && s <= e) return { start: s, end: e };
  }
  return null;
}

export async function writeBackupFile(payload: unknown): Promise<string | null> {
  const dir = FileSystem.documentDirectory;
  if (!dir) return null;
  const uri = dir + "timetable-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2));
  return uri;
}
