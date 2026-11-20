import AsyncStorage from "@react-native-async-storage/async-storage";
import { SCHOOL_BASE } from "./school-config";

const KEY = "college.school.setup.v1";

export type TimetableKind = "STUDENT" | "CLASSES";

export type SchoolSetup = {
  /** 学号（仅作展示，不保存密码） */
  studentId: string;
  /** 个人课表 id */
  personalId: string;
  /** 班级课表 id */
  classId: string;
  yearId: string;
  termId: string;
  defaultKind: TimetableKind;
};

export const DEFAULT_SETUP: SchoolSetup = {
  studentId: "",
  personalId: "208575",
  classId: "17086",
  yearId: "46",
  termId: "3",
  defaultKind: "STUDENT",
};

export async function loadSetup(): Promise<SchoolSetup> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETUP;
    return { ...DEFAULT_SETUP, ...(JSON.parse(raw) as Partial<SchoolSetup>) };
  } catch {
    return DEFAULT_SETUP;
  }
}

export async function saveSetup(setup: SchoolSetup): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(setup));
}

export function isSetupReady(setup: SchoolSetup): boolean {
  return Boolean(setup.personalId.trim() || setup.classId.trim()) && Boolean(setup.yearId.trim() && setup.termId.trim());
}

export function timetableUrl(setup: SchoolSetup, kind: TimetableKind): string {
  const id = kind === "STUDENT" ? setup.personalId : setup.classId;
  const params = new URLSearchParams({
    id: id.trim(),
    yearid: setup.yearId.trim(),
    termid: setup.termId.trim(),
    timetableType: kind,
    sectionType: "BASE",
  });
  return `${SCHOOL_BASE}/academic/manager/coursearrange/showTimetable.do?${params.toString()}`;
}
