/**
 * 内蒙古农业大学 教务系统（统一身份认证 + 教务 /academic）固定参数。
 *
 * 说明：
 * - 个人课表 / 班级课表的 id 是身份凭证，id 不对会拿不到数据；
 * - 直接 GET 会 302 到统一身份认证登录页，必须带登录后的会话 Cookie；
 * - yearid=46 / termid=3 对应 2026 秋季学期（可在设置中修改）。
 */
export const SCHOOL_BASE = "https://zyjwxt.imau.edu.cn";

export const TIMETABLE = {
  /** 个人课表 id（学号对应的内部 id） */
  personalId: "208575",
  /** 班级课表 id */
  classId: "17086",
  yearId: "46",
  termId: "3",
  sectionType: "BASE",
} as const;

export type TimetableKind = "STUDENT" | "CLASSES";

export function buildTimetableUrl(kind: TimetableKind, overrides?: { id?: string; yearId?: string; termId?: string }): string {
  const id = overrides?.id ?? (kind === "STUDENT" ? TIMETABLE.personalId : TIMETABLE.classId);
  const yearId = overrides?.yearId ?? TIMETABLE.yearId;
  const termId = overrides?.termId ?? TIMETABLE.termId;
  const params = new URLSearchParams({
    id,
    yearid: yearId,
    termid: termId,
    timetableType: kind,
    sectionType: TIMETABLE.sectionType,
  });
  return `${SCHOOL_BASE}/academic/manager/coursearrange/showTimetable.do?${params.toString()}`;
}

export const SCHOOL_ENDPOINTS = {
  authEntry: `${SCHOOL_BASE}/academic/index.jsp`,
  personalTimetable: buildTimetableUrl("STUDENT"),
  classTimetable: buildTimetableUrl("CLASSES"),
};
