import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Course, DEMO_COURSES, cellsOfWeek, todayCourses } from "./schedule";
import { Period, TOTAL_WEEKS, weekOf } from "./time";
import { Season, getPeriods, seasonLabel, seasonOf } from "./season";
import {
  StaticMeta,
  clearStaticTimetable,
  loadStaticTimetable,
  saveStaticTimetable,
} from "./static-timetable";

export type ScheduleSource = "demo" | "static" | "api";

type ScheduleValue = {
  courses: Course[];
  week: number;
  setWeek: (w: number) => void;
  weeks: number[];
  cells: ReturnType<typeof cellsOfWeek>;
  todayList: Course[];
  byId: (id: string) => Course | undefined;
  season: Season;
  seasonText: string;
  periods: Period[];
  source: ScheduleSource;
  staticMeta: StaticMeta | null;
  applyStatic: (courses: Course[], name: string) => Promise<void>;
  applyApi: (courses: Course[]) => void;
  clearStatic: () => Promise<void>;
};

const Ctx = createContext<ScheduleValue | null>(null);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>(DEMO_COURSES);
  const [source, setSource] = useState<ScheduleSource>("demo");
  const [staticMeta, setStaticMeta] = useState<StaticMeta | null>(null);
  const [week, setWeekRaw] = useState<number>(() => Math.min(Math.max(weekOf(new Date()), 1), TOTAL_WEEKS));
  const [season] = useState<Season>(() => seasonOf(new Date()));

  useEffect(() => {
    let alive = true;
    loadStaticTimetable().then((payload) => {
      if (!alive || !payload) return;
      setCourses(payload.courses);
      setSource("static");
      setStaticMeta(payload.meta);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setWeek = useCallback((w: number) => setWeekRaw(Math.min(Math.max(w, 1), TOTAL_WEEKS)), []);

  const applyStatic = useCallback(async (list: Course[], name: string) => {
    const meta: StaticMeta = { name, importedAt: new Date().toISOString(), count: list.length };
    await saveStaticTimetable({ meta, courses: list });
    setCourses(list);
    setStaticMeta(meta);
    setSource("static");
  }, []);

  /** 教务接口拉取成功后调用：切换到实时数据 */
  const applyApi = useCallback((list: Course[]) => {
    setCourses(list);
    setSource("api");
    setStaticMeta(null);
  }, []);

  const clearStatic = useCallback(async () => {
    await clearStaticTimetable();
    setCourses(DEMO_COURSES);
    setStaticMeta(null);
    setSource("demo");
  }, []);

  const value = useMemo<ScheduleValue>(() => {
    const cells = cellsOfWeek(courses, week);
    const jsDay = new Date().getDay();
    const weekday = jsDay === 0 ? 7 : jsDay;
    return {
      courses,
      week,
      setWeek,
      weeks: Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1),
      cells,
      todayList: todayCourses(courses, week, weekday),
      byId: (id: string) => courses.find((c) => c.id === id),
      season,
      seasonText: seasonLabel(season),
      periods: getPeriods(season),
      source,
      staticMeta,
      applyStatic,
      applyApi,
      clearStatic,
    };
  }, [courses, week, season, source, staticMeta, applyStatic, applyApi, clearStatic, setWeek]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSchedule(): ScheduleValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSchedule must be used inside ScheduleProvider");
  return v;
}
