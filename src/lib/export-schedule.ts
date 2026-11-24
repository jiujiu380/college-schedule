import { Period } from "./time";
import { Timetable } from "./timetables";
import { presetById, tintFor } from "./theme-presets";

export type ExportOccurrence = {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  notes?: string;
};

function parseTime(value?: string): { h: number; m: number } {
  const [h, m] = String(value || "08:00").split(":").map(Number);
  return { h: Number.isFinite(h) ? h : 8, m: Number.isFinite(m) ? m : 0 };
}

export function coursesForWeek(table: Timetable, week: number) {
  const moves = table.moves ?? [];
  const movedOut = new Set(moves.filter((m) => m.fromWeek === week).map((m) => m.courseId));
  const base = table.courses.filter((c) => c.weeks.includes(week) && !movedOut.has(c.id));
  const movedIn = moves
    .filter((m) => m.toWeek === week)
    .map((m) => {
      const origin = table.courses.find((c) => c.id === m.courseId);
      if (!origin) return null;
      return { ...origin, id: origin.id + "@move@" + m.id, weekday: m.toWeekday, startPeriod: m.toStart, endPeriod: m.toEnd };
    })
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  return [...base, ...movedIn];
}

export function weekRange(table: Timetable, week: number): string {
  const [y, m, d] = table.startDate.split("-").map(Number);
  const start = new Date(y, (m ?? 1) - 1, d ?? 1);
  start.setDate(start.getDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const sm = start.getMonth() + 1;
  const em = end.getMonth() + 1;
  return sm + "/" + start.getDate() + " - " + em + "/" + end.getDate();
}

export function courseOccurrences(table: Timetable): ExportOccurrence[] {
  const out: ExportOccurrence[] = [];
  const [y, m, d] = table.startDate.split("-").map(Number);
  const base = new Date(y, (m ?? 1) - 1, d ?? 1);
  for (const course of table.courses) {
    for (const week of course.weeks) {
      const day = new Date(base);
      day.setDate(day.getDate() + (week - 1) * 7 + (course.weekday - 1));
      const s = parseTime(table.periods[course.startPeriod - 1]?.start);
      const e = parseTime(table.periods[course.endPeriod - 1]?.end);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), s.h, s.m, 0, 0);
      const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), e.h, e.m, 0, 0);
      if (end <= start) end.setHours(start.getHours() + 1);
      out.push({
        title: course.name,
        start,
        end,
        location: course.location,
        notes: [course.teacher ? "教师：" + course.teacher : "", "周次：" + week].filter(Boolean).join("\n"),
      });
    }
  }
  return out;
}

function esc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function icsTime(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return date.getFullYear() + p(date.getMonth() + 1) + p(date.getDate()) + "T" + p(date.getHours()) + p(date.getMinutes()) + "00";
}

function fold(line: string): string {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    parts.push(rest.slice(0, 73));
    rest = " " + rest.slice(73);
  }
  parts.push(rest);
  return parts.join("\r\n");
}

export function buildIcs(table: Timetable): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zhiku Schedule//CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  courseOccurrences(table).forEach((o, i) => {
    lines.push("BEGIN:VEVENT");
    lines.push(fold("UID:zhiku-" + Date.now().toString(36) + "-" + i + "@zcoow.cn"));
    lines.push("DTSTAMP:" + stamp);
    lines.push("DTSTART:" + icsTime(o.start));
    lines.push("DTEND:" + icsTime(o.end));
    lines.push(fold("SUMMARY:" + esc(o.title)));
    if (o.location) lines.push(fold("LOCATION:" + esc(o.location)));
    if (o.notes) lines.push(fold("DESCRIPTION:" + esc(o.notes)));
    lines.push("BEGIN:VALARM");
    lines.push("TRIGGER:-PT10M");
    lines.push("ACTION:DISPLAY");
    lines.push("DESCRIPTION:上课提醒");
    lines.push("END:VALARM");
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export function buildExportHtml(table: Timetable, week: number, periods: Period[]): string {
  const courses = coursesForWeek(table, week);
  const cells: string[] = [];
  for (let p = 1; p <= 10; p++) {
    cells.push('<div class="time" style="grid-column:1;grid-row:' + (p + 1) + '"><b>第' + p + '节</b><span>' + (periods[p - 1]?.start || "") + "</span><span>" + (periods[p - 1]?.end || "") + "</span></div>");
    for (let d = 1; d <= 7; d++) {
      cells.push('<div class="cell" style="grid-column:' + (d + 1) + ";grid-row:" + (p + 1) + '"></div>');
    }
  }
  for (const c of courses) {
    const tint = tintFor(presetById(table.themeId), c.id);
    const span = Math.max(1, c.endPeriod - c.startPeriod + 1);
    cells.push(
      '<div class="course" style="grid-column:' + (c.weekday + 1) + ";grid-row:" + (c.startPeriod + 1) + " / span " + span + ";background:" + tint.bg + ";color:" + tint.fg + '">' +
        '<div class="cname">' + escapeHtml(c.name) + "</div>" +
        (c.location ? '<div class="cmeta">' + escapeHtml(c.location) + "</div>" : "") +
        (c.teacher ? '<div class="cmeta">' + escapeHtml(c.teacher) + "</div>" : "") +
      "</div>"
    );
  }
  const list = table.courses
    .map((c) => '<li><b>' + escapeHtml(c.name) + "</b> · 周" + DAYS[c.weekday - 1] + " 第" + c.startPeriod + "-" + c.endPeriod + "节 · " + weeksText(c.weeks) + (c.teacher ? " · " + escapeHtml(c.teacher) : "") + (c.location ? " · " + escapeHtml(c.location) : "") + "</li>")
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: "PingFang SC","Microsoft YaHei",sans-serif; color: #16233b; margin: 0; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { font-size: 11px; color: #5c6b85; margin-bottom: 12px; }
  .grid { display: grid; grid-template-columns: 54px repeat(7,1fr); grid-template-rows: 34px repeat(10,42px); border: 1px solid #dbe4f3; border-radius: 6px; overflow: hidden; position: relative; }
  .head { background:#f3f7ff; color:#1a6dff; font-weight:700; font-size:11px; display:flex; align-items:center; justify-content:center; border-right:1px solid #e8eef8; border-bottom:1px solid #e8eef8; }
  .time { display:flex; flex-direction:column; align-items:center; justify-content:center; border-right:1px solid #e8eef8; border-bottom:1px solid #e8eef8; background:#fafcff; font-size:8px; color:#8a98b0; }
  .time b { font-size:9px; color:#16233b; margin-bottom:1px; }
  .cell { border-right:1px solid #edf2fa; border-bottom:1px solid #edf2fa; }
  .course { margin:2px; border-radius:4px; padding:4px; font-size:9px; line-height:1.35; overflow:hidden; z-index:2; }
  .cname { font-weight:700; font-size:10px; }
  .cmeta { opacity:.8; font-size:8px; margin-top:2px; }
  .foot { margin-top:12px; font-size:9px; color:#8a98b0; display:flex; justify-content:space-between; }
  ul { margin: 12px 0 0; padding-left: 16px; columns: 2; column-gap: 28px; font-size: 9px; color:#5c6b85; line-height:1.7; }
  li { break-inside: avoid; margin-bottom:2px; }
  </style></head><body>
  <h1>${escapeHtml(table.name)}</h1>
  <div class="sub">第 ${week} 周 · ${weekRange(table, week)} · ${table.courses.length} 门课程</div>
  <div class="grid">
  <div class="head" style="grid-column:1;grid-row:1">节次</div>
  ${DAYS.map((d, i) => '<div class="head" style="grid-column:' + (i + 2) + ';grid-row:1">' + d + "</div>").join("")}
  ${cells.join("")}
  </div>
  <ul>${list}</ul>
  <div class="foot"><span>知酷课程表 · 导出于 ${new Date().toLocaleString()}</span><span>共 ${table.totalWeeks} 周</span></div>
  </body></html>`;
}

function weeksText(weeks: number[]): string {
  if (!weeks.length) return "未设置周次";
  const sorted = [...weeks].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const n = sorted[i];
    if (n === prev + 1) { prev = n; continue; }
    parts.push(start === prev ? String(start) : start + "-" + prev);
    start = n;
    prev = n;
  }
  return "第 " + parts.join(",") + " 周";
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}