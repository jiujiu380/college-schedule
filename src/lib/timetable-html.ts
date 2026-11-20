import { Course } from "./schedule";

/**
 * 解析教务课表页面 HTML。
 * 教务系统表格结构可能随版本变化，这里按“行=节次、列=星期”的通用结构做容错解析：
 * - 自动挑选含“星期/周一”且单元格最多的表格；
 * - 支持 colspan / rowspan 展开；
 * - 课程格内通常为：课程名 / 教师 / 地点 / 周次（用 <br> 或换行分隔）。
 */
export function parseTimetableHtml(html: string): Course[] {
  const clean = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const tables = [...clean.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  if (!tables.length) return [];

  const scored = tables
    .map((t) => ({ t, score: (t.match(/<td/gi) ?? []).length + (/星期|周一|星期一/.test(t) ? 50 : 0) }))
    .sort((a, b) => b.score - a.score);

  for (const cand of scored) {
    const courses = parseTable(cand.t);
    if (courses.length) return courses;
  }
  return [];
}

function textOf(cell: string): string {
  return cell
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t\u00a0]+/g, " ")
    .trim();
}

function parseTable(tableHtml: string): Course[] {
  const rows = [...tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((m) => m[0]);
  if (!rows.length) return [];

  const grid: string[][] = [];
  for (let r = 0; r < rows.length; r++) {
    const cells = [...rows[r].matchAll(/<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/gi)];
    grid[r] = grid[r] ?? [];
    let c = 0;
    for (const cell of cells) {
      const attrs = cell[1];
      const colspan = Number((attrs.match(/colspan\s*=\s*["']?(\d+)/i) ?? [])[1] ?? 1);
      const rowspan = Number((attrs.match(/rowspan\s*=\s*["']?(\d+)/i) ?? [])[1] ?? 1);
      while (grid[r][c] !== undefined) c++;
      const text = textOf(cell[2]);
      for (let dr = 0; dr < rowspan; dr++) {
        for (let dc = 0; dc < colspan; dc++) {
          grid[r + dr] = grid[r + dr] ?? [];
          grid[r + dr][c + dc] = text;
        }
      }
      c += colspan;
    }
  }

  const headerIdx = grid.findIndex((row) => row.some((cell) => /星期|周一|星期一/.test(cell ?? "")));
  if (headerIdx < 0) return [];

  const header = grid[headerIdx];
  const dayCols = header.map((cell, i) => ({ cell, i })).filter((x) => /周[一二三四五六日天]|星期/.test(x.cell ?? ""));
  if (!dayCols.length) return [];

  const firstDayCol = dayCols[0].i;
  const courses: Course[] = [];
  let seq = 0;

  for (let r = headerIdx + 1; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const label = row.slice(0, firstDayCol).join(" ");
    const periods = parsePeriods(label);
    if (!periods) continue;
    dayCols.forEach((dc, idx) => {
      const text = row[dc.i];
      if (!text || /^(无|空|—|-)?$/.test(text)) return;
      const chunks = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      if (!chunks.length) return;
      if (/^(午休|中午|休息)$/.test(chunks[0])) return;

      const name = chunks[0];
      let weeks: number[] = rangeWeeks(1, 20);
      const weekMatch = text.match(/(\d{1,2})\s*[-~至]\s*(\d{1,2})\s*周/);
      if (weekMatch) {
        const odd = /单周/.test(text);
        const even = /双周/.test(text);
        weeks = rangeWeeks(Number(weekMatch[1]), Number(weekMatch[2]), odd ? "odd" : even ? "even" : undefined);
      }
      const teacher = chunks.find((s) => /^[\u4e00-\u9fa5]{2,4}$/.test(s) && s !== name) ?? undefined;
      const location = chunks.find((s) => /楼|室|馆|场|中心|教学/.test(s) && s !== name)?.replace(/^@/, "");
      courses.push({
        id: `html-${++seq}`,
        name,
        teacher,
        location,
        weekday: idx + 1,
        startPeriod: periods.start,
        endPeriod: periods.end,
        weeks,
      });
    });
  }
  return courses;
}

function parsePeriods(label: string): { start: number; end: number } | null {
  const m = label.match(/(\d{1,2})\s*[-~]\s*(\d{1,2})/);
  if (m) {
    const start = Number(m[1]);
    const end = Number(m[2]);
    if (start >= 1 && end <= 12 && start <= end) return { start, end };
  }
  const single = label.match(/^\D*(\d{1,2})\D*$/);
  if (single) {
    const n = Number(single[1]);
    if (n >= 1 && n <= 12) return { start: n, end: n };
  }
  return null;
}

function rangeWeeks(from: number, to: number, parity?: "odd" | "even"): number[] {
  const out: number[] = [];
  for (let w = from; w <= to; w++) {
    if (parity === "odd" && w % 2 === 0) continue;
    if (parity === "even" && w % 2 === 1) continue;
    out.push(w);
  }
  return out;
}
