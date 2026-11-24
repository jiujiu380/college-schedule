import { Base64 } from "js-base64";
import { Course } from "./schedule";
import { DEFAULT_UI, Timetable } from "./timetables";
import { PERIODS_AUTUMN } from "./season";

const PREFIX = "ZKS1.";

type CompactCourse = [string, string, string, number, number, number, string];

type Payload = {
  v: 1;
  n: string;
  sd: string;
  tw: number;
  c: CompactCourse[];
};

function encodeWeeks(weeks: number[]): string {
  const nums = [...new Set(weeks)].filter((n) => n > 0).sort((a, b) => a - b);
  if (!nums.length) return "";
  const parts: string[] = [];
  let start = nums[0];
  let prev = nums[0];
  for (let i = 1; i <= nums.length; i++) {
    const n = nums[i];
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    parts.push(start === prev ? String(start) : start + "-" + prev);
    start = n;
    prev = n;
  }
  return parts.join(",");
}

function decodeWeeks(value: string): number[] {
  const out: number[] = [];
  for (const part of value.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const [a, b] = p.split("-").map(Number);
    if (!Number.isFinite(a)) continue;
    const end = Number.isFinite(b) ? b : a;
    for (let i = a; i <= end && i <= 30; i++) out.push(i);
  }
  return [...new Set(out)].sort((x, y) => x - y);
}

export function makeShareCode(table: Timetable): string {
  const payload: Payload = {
    v: 1,
    n: table.name,
    sd: table.startDate,
    tw: table.totalWeeks,
    c: table.courses.map((c) => [c.name, c.teacher ?? "", c.location ?? "", c.weekday, c.startPeriod, c.endPeriod, encodeWeeks(c.weeks)]),
  };
  return PREFIX + Base64.encode(JSON.stringify(payload), true);
}

export function decodeShareCode(code: string): Timetable {
  const text = code.trim();
  if (!text.startsWith(PREFIX)) throw new Error("不是有效的课表分享码");
  let payload: Payload;
  try {
    payload = JSON.parse(Base64.decode(text.slice(PREFIX.length)));
  } catch {
    throw new Error("分享码内容损坏，请重新复制");
  }
  if (!payload || payload.v !== 1 || !Array.isArray(payload.c)) throw new Error("分享码版本不支持");
  if (!payload.c.length) throw new Error("分享码里没有课程");

  const courses: Course[] = payload.c.map((item, i) => ({
    id: "sc-" + Date.now().toString(36) + "-" + i,
    name: String(item[0] || "未命名课程"),
    teacher: item[1] || undefined,
    location: item[2] || undefined,
    weekday: Math.min(7, Math.max(1, Number(item[3]) || 1)),
    startPeriod: Math.min(12, Math.max(1, Number(item[4]) || 1)),
    endPeriod: Math.min(12, Math.max(Number(item[4]) || 1, Number(item[5]) || 1)),
    weeks: decodeWeeks(String(item[6] || "")),
  }));

  const now = new Date().toISOString();
  return {
    id: "share-" + Date.now().toString(36),
    name: (payload.n || "分享的课表") + "（分享）",
    courses,
    totalWeeks: Math.min(30, Math.max(1, Number(payload.tw) || 20)),
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(payload.sd || "") ? payload.sd : new Date().toISOString().slice(0, 10),
    themeId: "classic",
    ui: DEFAULT_UI,
    periods: PERIODS_AUTUMN,
    source: "import",
    createdAt: now,
    updatedAt: now,
  };
}