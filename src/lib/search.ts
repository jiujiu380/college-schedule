import { Course } from "./schedule";
import { Homework } from "./homework";
import { Exam, examTime } from "./exams";
import { Announcement } from "./site-api";

export type MemoLike = { id: string; title: string; body: string; updatedAt: number };
export type SearchType = "course" | "homework" | "exam" | "memo" | "announcement";

export type SearchData = {
  courses: Course[];
  homework: Homework[];
  exams: Exam[];
  memos: MemoLike[];
  announcements: Announcement[];
};

export type SearchResult = {
  key: string;
  type: SearchType;
  title: string;
  subtitle: string;
  route: string;
  order: number;
};

export const TYPE_LABEL: Record<SearchType, string> = {
  course: "课程",
  homework: "作业",
  exam: "考试",
  memo: "备忘录",
  announcement: "公告",
};

const TYPE_ORDER: Record<SearchType, number> = { course: 0, homework: 1, exam: 2, memo: 3, announcement: 4 };

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateRange(q: string): { start: number; end: number } | null {
  const now = new Date();
  const today = startOfDay(now);
  if (/今天|今日/.test(q)) return { start: today.getTime(), end: today.getTime() + 86400000 };
  if (/明天|明日/.test(q)) { const d = new Date(today); d.setDate(d.getDate() + 1); return { start: d.getTime(), end: d.getTime() + 86400000 }; }
  if (/后天/.test(q)) { const d = new Date(today); d.setDate(d.getDate() + 2); return { start: d.getTime(), end: d.getTime() + 86400000 }; }
  if (/本周|这周/.test(q)) {
    const d = new Date(today);
    const wd = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - (wd - 1));
    return { start: d.getTime(), end: d.getTime() + 7 * 86400000 };
  }
  if (/下周/.test(q)) {
    const d = new Date(today);
    const wd = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - (wd - 1) + 7);
    return { start: d.getTime(), end: d.getTime() + 7 * 86400000 };
  }
  const wdMatch = q.match(/(?:周|星期)([一二三四五六日天])/);
  if (wdMatch) {
    const map: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 };
    const target = map[wdMatch[1]];
    const current = today.getDay() === 0 ? 7 : today.getDay();
    let diff = target - current;
    if (diff < 0) diff += 7;
    const d = new Date(today);
    d.setDate(d.getDate() + diff);
    return { start: d.getTime(), end: d.getTime() + 86400000 };
  }
  return null;
}

function termsOf(q: string): string[] {
  return q
    .replace(/明天|今日|今天|后天|本周|这周|下周|周[一二三四五六日天]|星期[一二三四五六日天]/g, " ")
    .replace(/要交|截止|作业|考试|课程|课表|课程表|备忘|笔记|公告|通知|有哪些|有什么|什么|哪些|安排|的|要|交/g, " ")
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function matches(text: string, terms: string[]): boolean {
  if (!terms.length) return true;
  const lower = text.toLowerCase();
  return terms.every((t) => lower.includes(t.toLowerCase()));
}

function fmtDate(iso?: string): string {
  if (!iso) return "未设截止";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

export function searchAll(q: string, data: SearchData, forceType?: SearchType): SearchResult[] {
  const query = q.trim();
  const range = dateRange(query);
  const terms = termsOf(query);
  const wants = {
    homework: /作业|要交|截止|DDL|ddl/.test(query),
    exam: /考试|考/.test(query),
    course: /课程|课表|上课|有几节课/.test(query),
    memo: /备忘|笔记/.test(query),
    announcement: /公告|通知/.test(query),
  };
  const anyIntent = Object.values(wants).some(Boolean);
  const allow = (type: SearchType) => (forceType ? forceType === type : !anyIntent || wants[type as keyof typeof wants]);
  const results: SearchResult[] = [];

  if (allow("course")) {
    for (const c of data.courses) {
      if (!matches([c.name, c.teacher ?? "", c.location ?? ""].join(" "), terms)) continue;
      results.push({
        key: "course-" + c.id,
        type: "course",
        title: c.name,
        subtitle: "周" + ["一", "二", "三", "四", "五", "六", "日"][c.weekday - 1] + " · 第" + c.startPeriod + "-" + c.endPeriod + "节" + (c.location ? " · " + c.location : ""),
        route: "/course/" + c.id,
        order: TYPE_ORDER.course,
      });
    }
  }

  if (allow("homework")) {
    for (const h of data.homework) {
      if (!matches(h.text, terms)) continue;
      if (range && h.due) {
        const t = new Date(h.due).getTime();
        if (!(t >= range.start && t < range.end)) continue;
      } else if (range) {
        continue;
      }
      if (wants.homework && h.done && !/完成|做完/.test(query)) continue;
      results.push({
        key: "hw-" + h.id,
        type: "homework",
        title: h.text,
        subtitle: (h.done ? "已完成 · " : "") + "截止 " + fmtDate(h.due),
        route: "/homework",
        order: TYPE_ORDER.homework,
      });
    }
  }

  if (allow("exam")) {
    for (const e of data.exams) {
      if (!matches([e.name, e.location ?? "", e.notes ?? ""].join(" "), terms)) continue;
      if (range) {
        const t = examTime(e);
        if (!(t >= range.start && t < range.end)) continue;
      }
      results.push({
        key: "exam-" + e.id,
        type: "exam",
        title: e.name,
        subtitle: e.date + " " + (e.time || "") + (e.location ? " · " + e.location : ""),
        route: "/exams",
        order: TYPE_ORDER.exam,
      });
    }
  }

  if (allow("memo")) {
    for (const m of data.memos) {
      if (!matches(m.title + " " + m.body, terms)) continue;
      results.push({
        key: "memo-" + m.id,
        type: "memo",
        title: m.title || "无标题笔记",
        subtitle: m.body.replace(/<[^>]+>/g, "").slice(0, 60),
        route: "/memo/" + m.id,
        order: TYPE_ORDER.memo,
      });
    }
  }

  if (allow("announcement")) {
    for (const a of data.announcements) {
      const text = a.title + " " + (a.content ?? "").replace(/<[^>]+>/g, " ");
      if (!matches(text, terms)) continue;
      results.push({
        key: "ann-" + a.id,
        type: "announcement",
        title: a.title,
        subtitle: String(a.created_at ?? "").slice(0, 10),
        route: "/announcements",
        order: TYPE_ORDER.announcement,
      });
    }
  }

  return results.sort((a, b) => a.order - b.order).slice(0, 60);
}
