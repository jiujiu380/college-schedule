import { TOTAL_WEEKS } from "./time";

export type Course = {
  id: string;
  name: string;
  teacher?: string;
  location?: string;
  weekday: number; // 1-7
  startPeriod: number; // 1-12
  endPeriod: number;
  weeks: number[]; // 上课周
  credit?: number;
  note?: string;
};

export type WeekCell = Course & { rowStart: number; rowEnd: number };

export const DEMO_COURSES: Course[] = [
  { id: "c1", name: "高等数学 A(2)", teacher: "张伟", location: "致远楼 302", weekday: 1, startPeriod: 1, endPeriod: 2, weeks: weeks(1, 16), credit: 5 },
  { id: "c2", name: "大学英语 III", teacher: "李娜", location: "博学楼 105", weekday: 1, startPeriod: 3, endPeriod: 4, weeks: weeks(1, 16), credit: 3 },
  { id: "c3", name: "线性代数", teacher: "王强", location: "致远楼 201", weekday: 1, startPeriod: 9, endPeriod: 10, weeks: weeks(1, 12), credit: 2.5 },
  { id: "c4", name: "数据结构", teacher: "陈晨", location: "信息楼 401", weekday: 2, startPeriod: 1, endPeriod: 2, weeks: weeks(1, 17), credit: 4 },
  { id: "c5", name: "大学物理实验", teacher: "刘洋", location: "物理实验中心 B2", weekday: 2, startPeriod: 5, endPeriod: 7, weeks: weeks(3, 14, 2), credit: 1.5 },
  { id: "c6", name: "体育（篮球）", teacher: "赵磊", location: "东区体育馆", weekday: 2, startPeriod: 11, endPeriod: 12, weeks: weeks(1, 16), credit: 1 },
  { id: "c7", name: "离散数学", teacher: "孙敏", location: "博学楼 208", weekday: 3, startPeriod: 3, endPeriod: 4, weeks: weeks(1, 16), credit: 3 },
  { id: "c8", name: "数据结构实验", teacher: "陈晨", location: "信息楼 305", weekday: 3, startPeriod: 5, endPeriod: 6, weeks: weeks(2, 16, 2), credit: 1 },
  { id: "c9", name: "思想道德与法治", teacher: "周涛", location: "明德楼 101", weekday: 4, startPeriod: 1, endPeriod: 2, weeks: weeks(1, 12), credit: 2 },
  { id: "c10", name: "计算机网络", teacher: "吴迪", location: "信息楼 402", weekday: 4, startPeriod: 5, endPeriod: 6, weeks: weeks(1, 16), credit: 3.5 },
  { id: "c11", name: "概率论与数理统计", teacher: "郑爽", location: "致远楼 305", weekday: 4, startPeriod: 9, endPeriod: 10, weeks: weeks(1, 16), credit: 3 },
  { id: "c12", name: "操作系统", teacher: "何静", location: "信息楼 403", weekday: 5, startPeriod: 3, endPeriod: 4, weeks: weeks(1, 16), credit: 3.5 },
  { id: "c13", name: "创新创业实践", teacher: "马超", location: "创客空间", weekday: 5, startPeriod: 7, endPeriod: 8, weeks: weeks(4, 12, 2), credit: 1 },
  { id: "c14", name: "学术英语听说", teacher: "Linda", location: "语音室 A", weekday: 6, startPeriod: 1, endPeriod: 2, weeks: weeks(1, 8), credit: 1 },
];

function weeks(from: number, to: number, step = 1): number[] {
  const out: number[] = [];
  for (let w = from; w <= to; w += step) out.push(w);
  return out;
}

export function coursesOfWeek(courses: Course[], week: number): Course[] {
  return courses.filter((c) => c.weeks.includes(week));
}

export function cellsOfWeek(courses: Course[], week: number): WeekCell[] {
  return coursesOfWeek(courses, week)
    .map((c) => ({ ...c, rowStart: c.startPeriod, rowEnd: Math.min(c.endPeriod, 12) }))
    .sort((a, b) => a.weekday - b.weekday || a.rowStart - b.rowStart);
}

export function todayCourses(courses: Course[], week: number, weekday: number): Course[] {
  return coursesOfWeek(courses, week)
    .filter((c) => c.weekday === weekday)
    .sort((a, b) => a.startPeriod - b.startPeriod);
}

export const TOTAL_WEEKS_SAFE = TOTAL_WEEKS;
