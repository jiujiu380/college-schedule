import AsyncStorage from "@react-native-async-storage/async-storage";
import { Course } from "./schedule";

const KEY = "college.static.timetable.v1";

export type StaticMeta = { name: string; importedAt: string; count: number };
export type StaticPayload = { meta: StaticMeta; courses: Course[] };

export type ParseResult =
  | { ok: true; courses: Course[]; name: string; warnings: string[] }
  | { ok: false; error: string };

export const SAMPLE_JSON = JSON.stringify(
  {
    name: "2026 秋季学期（静态备份）",
    courses: [
      { name: "高等数学 A(2)", teacher: "张伟", location: "致远楼 302", weekday: "周一", periods: "1-2", weeks: "1-16", credit: 5 },
      {
        name: "数据结构",
        teacher: "陈晨",
        location: "信息楼 401",
        weekday: 2,
        startPeriod: 1,
        endPeriod: 2,
        weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
        credit: 4,
      },
      { name: "操作系统", teacher: "何静", location: "信息楼 403", weekday: "周五", periods: "3-4", weeks: "1-16", credit: 3.5 },
      { name: "计算机网络", teacher: "吴迪", location: "信息楼 402", weekday: "周四", periods: "5-6", weeks: "1-16", credit: 3.5 },
      { name: "创新创业实践", teacher: "马超", location: "创客空间", weekday: "周五", periods: "7-8", weeks: "4-16", credit: 1 },
      { name: "大学体育 3", teacher: "肖骏", location: "体育场馆 20", weekday: "周六", periods: "3-4", weeks: "1-16", credit: 1 },
    ],
  },
  null,
  2,
);

const WEEKDAY_MAP: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7,
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7,
};

function parseWeekday(value: unknown): number | null {
  if (typeof value === "number" && value >= 1 && value <= 7) return Math.floor(value);
  if (typeof value !== "string") return null;
  const s = value.trim().toLowerCase();
  const num = Number(s.replace(/[^0-9]/g, ""));
  if (s.match(/^[1-7]$/)) return num;
  const key = s.replace(/^(周|星期)/, "").replace(/天/g, "日");
  if (WEEKDAY_MAP[key]) return WEEKDAY_MAP[key];
  if (/^[1-7]$/.test(key)) return Number(key);
  return null;
}

function parseWeeks(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    const nums = value.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n >= 1 && n <= 30);
    return nums.length ? Array.from(new Set(nums)).sort((a, b) => a - b) : null;
  }
  if (typeof value === "number") return [value];
  if (typeof value !== "string") return null;
  const s = value.replace(/[第周\s]/g, "");
  if (!s) return null;
  const out: number[] = [];
  for (const part of s.split(/[,，、]/)) {
    const m = part.match(/^(\d+)(?:-(\d+))?(?:\/(\d+))?$/);
    if (!m) continue;
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    const step = m[3] ? Number(m[3]) : 1;
    for (let w = from; w <= to; w += Math.max(1, step)) out.push(w);
  }
  const uniq = Array.from(new Set(out)).filter((w) => w >= 1 && w <= 30).sort((a, b) => a - b);
  return uniq.length ? uniq : null;
}

function parsePeriods(item: any): { start: number; end: number } | null {
  const raw = item.periods ?? item.section ?? item.节次 ?? item.sections;
  if (typeof raw === "string") {
    const m = raw.replace(/[第节\s]/g, "").match(/^(\d+)(?:-(\d+))?$/);
    if (m) {
      const start = Number(m[1]);
      const end = m[2] ? Number(m[2]) : start;
      return { start, end };
    }
  }
  if (Array.isArray(raw) && raw.length >= 1) {
    const start = Number(raw[0]);
    const end = Number(raw[raw.length - 1]);
    return { start, end };
  }
  const start = Number(item.startPeriod ?? item.start ?? item.开始节);
  const end = Number(item.endPeriod ?? item.end ?? item.结束节 ?? start);
  if (Number.isFinite(start) && Number.isFinite(end)) return { start, end };
  return null;
}

export function parseStaticJson(text: string): ParseResult {
  let root: any;
  try {
    root = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: "JSON 格式错误，请检查括号、引号与逗号。" };
  }

  const list = Array.isArray(root) ? root : Array.isArray(root?.courses) ? root.courses : null;
  if (!list) return { ok: false, error: "未找到 courses 数组，格式应为 { \"courses\": [ ... ] }。" };

  const name = String(root?.name ?? root?.semester ?? "静态课表");
  const warnings: string[] = [];
  const courses: Course[] = [];

  list.forEach((item: any, idx: number) => {
    const label = `第 ${idx + 1} 条`;
    const courseName = String(item?.name ?? item?.courseName ?? item?.课程名 ?? item?.课程名称 ?? "").trim();
    if (!courseName) {
      warnings.push(`${label}：缺少课程名称，已跳过`);
      return;
    }
    const weekday = parseWeekday(item?.weekday ?? item?.day ?? item?.星期);
    if (!weekday) {
      warnings.push(`${label}「${courseName}」：星期无法识别，已跳过`);
      return;
    }
    const periods = parsePeriods(item);
    if (!periods || !Number.isFinite(periods.start) || !Number.isFinite(periods.end) || periods.start < 1 || periods.end > 12 || periods.start > periods.end) {
      warnings.push(`${label}「${courseName}」：节次无效，应为 1-12（如 "1-2"）`);
      return;
    }
    const weeks = parseWeeks(item?.weeks ?? item?.week ?? item?.周次);
    if (!weeks) {
      warnings.push(`${label}「${courseName}」：周次无效，如 "1-16" 或 [1,2,3]`);
      return;
    }
    courses.push({
      id: `s-${idx + 1}`,
      name: courseName,
      teacher: item?.teacher ?? item?.教师 ?? item?.老师,
      location: item?.location ?? item?.room ?? item?.教室 ?? item?.地点,
      weekday,
      startPeriod: periods.start,
      endPeriod: periods.end,
      weeks,
      credit: Number.isFinite(Number(item?.credit ?? item?.学分)) ? Number(item?.credit ?? item?.学分) : undefined,
    });
  });

  if (!courses.length) {
    return { ok: false, error: warnings[0] ?? "没有解析到有效课程。" };
  }
  return { ok: true, courses, name, warnings };
}

export async function loadStaticTimetable(): Promise<StaticPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StaticPayload;
    if (!parsed?.courses?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveStaticTimetable(payload: StaticPayload): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
}

export async function clearStaticTimetable(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export async function readPickedFile(uri: string): Promise<string> {
  try {
    const res = await fetch(uri);
    if (res.ok) return await res.text();
  } catch {
    // 部分平台的 file:// 不支持 fetch，回退到 expo-file-system
  }
  const { File } = await import("expo-file-system");
  const file = new File(uri);
  return file.text();
}