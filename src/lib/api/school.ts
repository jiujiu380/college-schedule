import { Course } from "../schedule";
import { SchoolConfig } from "../config";

/**
 * 教务系统适配层（待接入真实接口）。
 *
 * MVP 阶段仅定义契约：拿到「查课表地址 / 登录地址」后，
 * 按目标站点实际接口补全 login() 与 fetchCourses() 即可。
 */

export type SchoolSession = {
  studentId: string;
  /** 会话凭证：cookies 或 token，由具体实现决定 */
  token: string;
  displayName?: string;
};

export type RawCourse = {
  name: string;
  teacher?: string;
  location?: string;
  weekday: number;
  startPeriod: number;
  endPeriod: number;
  weeks: number[];
  credit?: number;
};

export async function login(_cfg: SchoolConfig, _studentId: string, _password: string): Promise<SchoolSession> {
  throw new Error("尚未接入教务系统登录接口");
}

export async function fetchCourses(_cfg: SchoolConfig, _session: SchoolSession): Promise<Course[]> {
  throw new Error("尚未接入课表接口");
}

export function normalize(raw: RawCourse, index: number): Course {
  return {
    id: `remote-${index}`,
    name: raw.name,
    teacher: raw.teacher,
    location: raw.location,
    weekday: raw.weekday,
    startPeriod: raw.startPeriod,
    endPeriod: raw.endPeriod,
    weeks: raw.weeks,
    credit: raw.credit,
  };
}
