export const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export type Period = { no: number; start: string; end: string };

/** 课表行：按两节一组展示，中午单列一行（与教务系统一致） */
export const ROW_GROUPS: { key: string; label: string; periods: number[] }[] = [
  { key: "1-2", label: "1-2", periods: [1, 2] },
  { key: "3-4", label: "3-4", periods: [3, 4] },
  { key: "noon", label: "中午", periods: [] },
  { key: "5-6", label: "5-6", periods: [5, 6] },
  { key: "7-8", label: "7-8", periods: [7, 8] },
  { key: "9-10", label: "9-10", periods: [9, 10] },
  { key: "11-12", label: "11-12", periods: [11, 12] },
];

export const TOTAL_WEEKS = 20;

/** 学期第一周的周一（演示数据用 2026 秋季学期） */
export const TERM_START = new Date(2026, 8, 7);

export function weekOf(date: Date, termStart: Date = TERM_START): number {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const b = new Date(termStart.getFullYear(), termStart.getMonth(), termStart.getDate()).getTime();
  const diff = Math.floor((a - b) / 86400000);
  return Math.floor(diff / 7) + 1;
}

export function mondayOfWeek(week: number, termStart: Date = TERM_START): Date {
  const d = new Date(termStart);
  d.setDate(d.getDate() + (week - 1) * 7);
  return d;
}

export function formatRange(d: Date): string {
  const e = new Date(d);
  e.setDate(e.getDate() + 6);
  return `${d.getMonth() + 1}.${d.getDate()} - ${e.getMonth() + 1}.${e.getDate()}`;
}

export function todayWeekday(): number {
  const js = new Date().getDay();
  return js === 0 ? 7 : js;
}

export function formatToday(d: Date = new Date()): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${WEEKDAYS[(d.getDay() + 6) % 7]}`;
}

export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** 当前是第几节；不在任何一节课内返回 null */
export function currentPeriodNo(periods: Period[], d: Date = new Date()): number | null {
  const now = d.getHours() * 60 + d.getMinutes();
  for (const p of periods) {
    if (now >= minutesOf(p.start) && now <= minutesOf(p.end)) return p.no;
  }
  return null;
}

export function groupOfPeriod(no: number | null): string | null {
  if (!no) return null;
  const g = ROW_GROUPS.find((x) => x.periods.includes(no));
  return g ? g.key : null;
}
