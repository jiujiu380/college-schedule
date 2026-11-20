export type Season = "summer" | "autumn";

export type Period = { no: number; start: string; end: string };

/** 作息切换点：10 月 7 日（含）起为秋季作息，之前为夏季作息 */
export const SEASON_SPLIT = { month: 10, day: 7 };

export const PERIODS_SUMMER: Period[] = [
  { no: 1, start: "08:00", end: "08:45" },
  { no: 2, start: "08:55", end: "09:40" },
  { no: 3, start: "10:00", end: "10:45" },
  { no: 4, start: "10:55", end: "11:40" },
  { no: 5, start: "14:30", end: "15:15" },
  { no: 6, start: "15:25", end: "16:10" },
  { no: 7, start: "16:30", end: "17:15" },
  { no: 8, start: "17:25", end: "18:10" },
  { no: 9, start: "19:30", end: "20:15" },
  { no: 10, start: "20:25", end: "21:10" },
  { no: 11, start: "21:20", end: "22:05" },
  { no: 12, start: "22:15", end: "23:00" },
];

export const PERIODS_AUTUMN: Period[] = [
  { no: 1, start: "08:00", end: "08:45" },
  { no: 2, start: "08:55", end: "09:40" },
  { no: 3, start: "10:00", end: "10:45" },
  { no: 4, start: "10:55", end: "11:40" },
  { no: 5, start: "14:00", end: "14:45" },
  { no: 6, start: "14:55", end: "15:40" },
  { no: 7, start: "16:00", end: "16:45" },
  { no: 8, start: "16:55", end: "17:40" },
  { no: 9, start: "19:00", end: "19:45" },
  { no: 10, start: "19:55", end: "20:40" },
  { no: 11, start: "20:50", end: "21:35" },
  { no: 12, start: "21:45", end: "22:30" },
];

export function seasonOf(date: Date = new Date()): Season {
  const split = new Date(date.getFullYear(), SEASON_SPLIT.month - 1, SEASON_SPLIT.day, 0, 0, 0, 0);
  return date.getTime() >= split.getTime() ? "autumn" : "summer";
}

export function seasonLabel(season: Season): string {
  return season === "summer" ? "夏季作息" : "秋季作息";
}

export function getPeriods(season: Season): Period[] {
  return season === "summer" ? PERIODS_SUMMER : PERIODS_AUTUMN;
}
