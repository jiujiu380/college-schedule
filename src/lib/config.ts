import AsyncStorage from "@react-native-async-storage/async-storage";

export type SchoolConfig = {
  /** 教务系统登录地址，例如 https://jw.example.edu.cn/login */
  loginUrl: string;
  /** 课表查询地址，例如 https://jw.example.edu.cn/student/course */
  scheduleUrl: string;
  /** 账号类型，教务系统要求时使用 */
  accountType: string;
};

export const DEFAULT_CONFIG: SchoolConfig = {
  loginUrl: "",
  scheduleUrl: "",
  accountType: "student",
};

const KEY = "college.school.config.v1";

export async function loadConfig(): Promise<SchoolConfig> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<SchoolConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(cfg: SchoolConfig): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(cfg));
}

export function isConfigured(cfg: SchoolConfig): boolean {
  return /^https?:\/\//.test(cfg.loginUrl.trim()) && /^https?:\/\//.test(cfg.scheduleUrl.trim());
}
