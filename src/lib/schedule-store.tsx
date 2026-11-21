import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Course, cellsOfWeek, todayCourses } from "./schedule";
import { Period, TOTAL_WEEKS } from "./time";
import { Season, getPeriods, seasonLabel, seasonOf } from "./season";
import {
  DEFAULT_UI,
  DEMO_TABLES,
  TableUi,
  Timetable,
  loadTables,
  mondayISO,
  newTable,
  saveTables,
  weekOfDate,
} from "./timetables";
import { StaticMeta } from "./static-timetable";
import { ThemePreset, presetById } from "./theme-presets";

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
  totalWeeks: number;
  startDate: string;
  source: ScheduleSource;
  staticMeta: StaticMeta | null;
  preset: ThemePreset;
  ui: TableUi;
  tables: Timetable[];
  activeTable: Timetable;
  activeId: string;
  switchTable: (id: string) => void;
  addTable: (name: string) => Timetable;
  updateTable: (patch: Partial<Timetable>) => void;
  deleteTable: (id: string) => void;
  importCourses: (courses: Course[], periods: Period[] | undefined, name: string, source: ScheduleSource) => Promise<void>;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  applyStatic: (courses: Course[], name: string) => Promise<void>;
  applyApi: (courses: Course[], periods?: Period[]) => Promise<void>;
  clearStatic: () => Promise<void>;
};

const Ctx = createContext<ScheduleValue | null>(null);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [tables, setTables] = useState<Timetable[]>(DEMO_TABLES);
  const [activeId, setActiveId] = useState<string>(DEMO_TABLES[0].id);
  const [week, setWeekRaw] = useState(1);
  const [season] = useState<Season>(() => seasonOf(new Date()));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadTables().then(({ tables: t, activeId: a }) => {
      if (!alive) return;
      setTables(t);
      setActiveId(a);
      const cur = t.find((x) => x.id === a) ?? t[0];
      setWeekRaw(Math.min(Math.max(weekOfDate(cur.startDate), 1), cur.totalWeeks));
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (ready) void saveTables({ tables, activeId });
  }, [tables, activeId, ready]);

  const activeTable = useMemo(() => tables.find((t) => t.id === activeId) ?? tables[0] ?? DEMO_TABLES[0], [tables, activeId]);

  const setWeek = useCallback(
    (w: number) => setWeekRaw(Math.min(Math.max(w, 1), activeTable.totalWeeks)),
    [activeTable.totalWeeks],
  );

  const switchTable = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const addTable = useCallback((name: string) => {
    const t = newTable(name);
    setTables((prev) => [...prev, t]);
    setActiveId(t.id);
    return t;
  }, []);

  const updateTable = useCallback((patch: Partial<Timetable>) => {
    setTables((prev) => prev.map((t) => (t.id === activeId ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)));
  }, [activeId]);

  const deleteTable = useCallback((id: string) => {
    setTables((prev) => {
      const next = prev.filter((t) => t.id !== id);
      const safe = next.length ? next : [newTable("新课表")];
      setActiveId((cur) => (cur === id ? safe[0].id : cur));
      return safe;
    });
  }, []);

  const importCourses = useCallback(
    async (courses: Course[], periods: Period[] | undefined, name: string, source: ScheduleSource) => {
      const t: Timetable = {
        id: `t-${Date.now()}`,
        name,
        courses,
        periods: periods?.length ? periods : activeTable.periods,
        totalWeeks: Math.max(activeTable.totalWeeks, ...courses.flatMap((c) => c.weeks), 1),
        startDate: activeTable.startDate,
        themeId: activeTable.themeId,
        ui: activeTable.ui,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: source === "api" ? "api" : "import",
      };
      setTables((prev) => [...prev, t]);
      setActiveId(t.id);
    },
    [activeTable],
  );

  const addCourse = useCallback((course: Course) => {
    setTables((prev) => prev.map((t) => (t.id === activeId ? { ...t, courses: [...t.courses, course], updatedAt: new Date().toISOString() } : t)));
  }, [activeId]);

  const updateCourse = useCallback((course: Course) => {
    setTables((prev) => prev.map((t) => (t.id === activeId ? { ...t, courses: t.courses.map((c) => (c.id === course.id ? course : c)), updatedAt: new Date().toISOString() } : t)));
  }, [activeId]);

  const deleteCourse = useCallback((id: string) => {
    setTables((prev) => prev.map((t) => (t.id === activeId ? { ...t, courses: t.courses.filter((c) => c.id !== id), updatedAt: new Date().toISOString() } : t)));
  }, [activeId]);

  const applyStatic = useCallback(async (courses: Course[], name: string) => importCourses(courses, undefined, name, "static"), [importCourses]);
  const applyApi = useCallback(async (courses: Course[], periods?: Period[]) => importCourses(courses, periods, activeTable.name, "api"), [importCourses, activeTable.name]);
  const clearStatic = useCallback(async () => {
    setTables((prev) => prev.map((t) => (t.id === activeId ? { ...t, courses: [], source: "demo", updatedAt: new Date().toISOString() } : t)));
  }, [activeId]);

  const value = useMemo<ScheduleValue>(() => {
    const courses = activeTable.courses;
    const periods = activeTable.periods?.length ? activeTable.periods : getPeriods(season);
    const cells = cellsOfWeek(courses, week);
    const jsDay = new Date().getDay();
    const weekday = jsDay === 0 ? 7 : jsDay;
    const source: ScheduleSource = activeTable.source === "api" ? "api" : activeTable.source === "import" ? "static" : "demo";
    return {
      courses,
      week,
      setWeek,
      weeks: Array.from({ length: activeTable.totalWeeks }, (_, i) => i + 1),
      cells,
      todayList: todayCourses(courses, week, weekday),
      byId: (id: string) => courses.find((c) => c.id === id),
      season,
      seasonText: seasonLabel(season),
      periods,
      totalWeeks: activeTable.totalWeeks,
      startDate: activeTable.startDate,
      source,
      staticMeta: source === "static" ? { name: activeTable.name, importedAt: activeTable.updatedAt, count: courses.length } : null,
      preset: presetById(activeTable.themeId),
      ui: activeTable.ui ?? DEFAULT_UI,
      tables,
      activeTable,
      activeId,
      switchTable,
      addTable,
      updateTable,
      deleteTable,
      importCourses,
      addCourse,
      updateCourse,
      deleteCourse,
      applyStatic,
      applyApi,
      clearStatic,
    };
  }, [activeTable, tables, activeId, week, season, setWeek, switchTable, addTable, updateTable, deleteTable, importCourses, addCourse, updateCourse, deleteCourse, applyStatic, applyApi, clearStatic]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSchedule(): ScheduleValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSchedule must be used inside ScheduleProvider");
  return v;
}