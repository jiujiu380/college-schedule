import { Course } from "./schedule";
import { Period } from "./time";

export type ParsedTimetable = {
  courses: Course[];
  periods: Period[];
  title?: string;
};

/**
 * 解析内蒙古农业大学教务系统课表页（showTimetable.do）HTML。
 * 表格结构：<table id="timetable">，行为“第N节”，列为周一~周日，
 * 单元格 id="星期-节次"，内容形如：
 *   <<高等数学1>>;;1<br>耕学楼A307<br>陈红红<br>3-4,7-17<br>理论学时
 * 同一单元格可能包含多门课（用 <wbr> 分隔）。
 */
export function parseTimetable(html: string): ParsedTimetable {
  const table = html.match(/<table[^>]*id=["']timetable["'][\s\S]*?<\/table>/i)?.[0];
  if (!table) return parseGenericTimetable(html);

  const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[1]);
  const periods: Period[] = [];
  const entries: { weekday: number; period: number; name: string; teacher?: string; location?: string; weeks: number[] }[] = [];

  const text = (s: string) =>
    s
      .replace(/<wbr\s*\/?>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/[ \t\u00a0]+/g, " ");

  for (const row of rows) {
    const th = row.match(/<th[^>]*>([\s\S]*?)<\/th>/i)?.[1] ?? "";
    const pm = th.match(/第\s*(\d{1,2})\s*节/);
    if (!pm) continue;
    const no = Number(pm[1]);
    const tm = th.replace(/<br\s*\/?>/gi, "|").match(/(\d{1,2}:\d{2})\s*\|\s*[┆|]\s*\|\s*(\d{1,2}:\d{2})/);
    if (tm) periods.push({ no, start: tm[1], end: tm[2] });

    const cells = [...row.matchAll(/<td[^>]*id=["'](\d)-([\d]+)["'][^>]*>([\s\S]*?)<\/td>/gi)];
    for (const c of cells) {
      const weekday = Number(c[1]);
      const lines = text(c[3])
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const chunks: string[][] = [];
      let cur: string[] | null = null;
      for (const line of lines) {
        const m = line.match(/<<\s*([^>]+?)\s*>>/);
        if (m) {
          if (cur) chunks.push(cur);
          cur = [m[1]];
          const rest = line.replace(/^.*?>>/, "").replace(/^[;；\s]+/, "");
          if (rest) cur.push(rest);
        } else if (cur) {
          cur.push(line);
        }
      }
      if (cur) chunks.push(cur);

      for (const chunk of chunks) {
        const name = chunk[0].trim();
        if (!name) continue;
        const rest = chunk.slice(1).filter((s) => s && !/学时$/.test(s));
        const weekLine = rest.find((s) => /周/.test(s) || (/[\d]/.test(s) && /[,\-~，]/.test(s))) ?? "";
        const weeks = parseWeeks(weekLine);
        const teacher = rest.find((s) => /^[\u4e00-\u9fa5]{2,4}$/.test(s) && !/学时/.test(s));
        const location = rest.find((s) => /楼|室|馆|场|中心|实训/.test(s))?.replace(/^@/, "");
        entries.push({ weekday, period: no, name, teacher, location, weeks });
      }
    }
  }

  const groups = new Map<string, { weekday: number; name: string; teacher?: string; location?: string; weeks: number[]; periods: number[] }>();
  for (const e of entries) {
    const key = [e.weekday, e.name, e.teacher ?? "", e.location ?? "", e.weeks.join(",")].join("|");
    const g = groups.get(key) ?? { ...e, periods: [] };
    g.periods.push(e.period);
    groups.set(key, g);
  }

  const courses: Course[] = [];
  let id = 0;
  for (const g of groups.values()) {
    const ps = Array.from(new Set(g.periods)).sort((a, b) => a - b);
    let start = ps[0];
    let prev = ps[0];
    for (let i = 1; i <= ps.length; i++) {
      const p = ps[i];
      if (p === prev + 1) {
        prev = p;
        continue;
      }
      courses.push({
        id: `html-${++id}`,
        name: g.name,
        teacher: g.teacher,
        location: g.location,
        weekday: g.weekday,
        startPeriod: start,
        endPeriod: prev,
        weeks: g.weeks.length ? g.weeks : rangeWeeks(1, 20),
      });
      if (p === undefined) break;
      start = p;
      prev = p;
    }
  }

  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  return { courses, periods: periods.sort((a, b) => a.no - b.no), title };
}


/** 通用表格解析：适配正方 / 强智 / URP / 优慕课 等常见课表表格 */
export function parseGenericTimetable(html: string): ParsedTimetable {
  const clean = String(html).replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  const tables = [...clean.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);

  for (const table of tables) {
    const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[1]);
    if (rows.length < 4) continue;

    const grid = rows.map((row) =>
      [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) =>
        m[1]
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&nbsp;/g, " ")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    );

    const headerIdx = grid.findIndex((cells) => cells.filter((c) => c.some((s) => /周[一二三四五六日天]|星期一|星期二/.test(s))).length >= 3);
    if (headerIdx < 0) continue;

    const header = grid[headerIdx].map((c) => c.join(" "));
    const dayCols: number[] = [];
    for (let i = 0; i < header.length; i++) {
      if (/周[一二三四五六日天]|星期[一二三四五六日天]/.test(header[i])) dayCols.push(i);
    }
    if (dayCols.length < 2) continue;

    const periods: Period[] = [];
    const entries: { weekday: number; period: number; name: string; teacher?: string; location?: string; weeks: number[] }[] = [];

    for (let r = headerIdx + 1; r < grid.length; r++) {
      const cells = grid[r];
      if (!cells?.length) continue;
      const label = cells[0]?.join(" ") ?? "";
      const pm = label.match(/(\d{1,2})\s*[-~]\s*(\d{1,2})/) ?? label.match(/第?(\d{1,2})\s*节/);
      if (!pm) continue;
      const start = Number(pm[1]);
      const end = pm[2] ? Number(pm[2]) : start;
      const tm = label.match(/(\d{1,2}:\d{2})\s*[-~至]\s*(\d{1,2}:\d{2})/);
      if (tm && !periods.some((p) => p.no === start)) periods.push({ no: start, start: tm[1], end: tm[2] });

      dayCols.forEach((col, idx) => {
        const cell = cells[col] ?? [];
        if (!cell.length) return;
        const lines = cell.filter((s) => s && !/^(无|空|—|-)$/.test(s));
        if (!lines.length) return;
        const name = lines[0].replace(/^<<|>>$/g, "").replace(/[【[]/g, "").replace(/[】\]]/g, "");
        if (/^(午休|中午|休息)$/.test(name)) return;
        const joined = lines.join(" ");
        const weeks = parseWeeks(joined.match(/[\d,\-~]{1,20}\s*周/) ? joined.match(/[\d,\-~]{1,20}\s*周/)![0] : "");
        const teacher = lines.find((s) => /^[\u4e00-\u9fa5]{2,4}$/.test(s) && s !== name);
        const location = lines.find((s) => /楼|室|馆|场|中心|实训/.test(s));
        for (let p = start; p <= end; p++) entries.push({ weekday: idx + 1, period: p, name, teacher, location, weeks });
      });
    }

    if (entries.length < 3) continue;

    const groups = new Map<string, { weekday: number; name: string; teacher?: string; location?: string; weeks: number[]; periods: number[] }>();
    for (const e of entries) {
      const key = [e.weekday, e.name, e.teacher ?? "", e.weeks.join(",")].join("|");
      const g = groups.get(key) ?? { ...e, periods: [] };
      g.periods.push(e.period);
      groups.set(key, g);
    }

    const courses: Course[] = [];
    let id = 0;
    for (const g of groups.values()) {
      const ps = Array.from(new Set(g.periods)).sort((a, b) => a - b);
      courses.push({
        id: `gen-${++id}`,
        name: g.name,
        teacher: g.teacher,
        location: g.location,
        weekday: g.weekday,
        startPeriod: ps[0],
        endPeriod: ps[ps.length - 1],
        weeks: g.weeks.length ? g.weeks : rangeWeeks(1, 20),
      });
    }
    if (courses.length) return { courses, periods: periods.sort((a, b) => a.no - b.no) };
  }
  return { courses: [], periods: [] };
}

export function parseWeeks(s: string): number[] {
  const out = new Set<number>();
  const cleaned = s.replace(/周/g, "");
  for (const part of cleaned.split(/[,，、]/)) {
    const m = part.trim().match(/^(\d{1,2})(?:\s*[-~至]\s*(\d{1,2}))?$/);
    if (!m) continue;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let w = a; w <= b; w++) out.add(w);
  }
  return Array.from(out).sort((a, b) => a - b);
}

function rangeWeeks(from: number, to: number): number[] {
  const out: number[] = [];
  for (let w = from; w <= to; w++) out.push(w);
  return out;
}