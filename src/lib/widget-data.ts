import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { Course } from "./schedule";
import { Period, WEEKDAYS, todayWeekday } from "./time";

export type WidgetPayload = {
  title: string;
  days: { label: string; lines: string[] }[];
  todayTitle: string;
  todaySub: string;
  todayItems: { time: string; name: string; room: string }[];
};

export function buildWidgetPayload(params: {
  tableName: string;
  week: number;
  courses: Course[];
  periods: Period[];
  startDate: string;
}): WidgetPayload {
  const { tableName, week, courses, periods, startDate } = params;
  const today = todayWeekday();
  const [y, m, d] = startDate.split("-").map(Number);
  const monday = new Date(y || new Date().getFullYear(), (m || 1) - 1, d || 1);
  monday.setDate(monday.getDate() + (week - 1) * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    const list = courses
      .filter((c) => c.weekday === i + 1 && c.weeks.includes(week))
      .sort((a, b) => a.startPeriod - b.startPeriod)
      .slice(0, 4);
    return {
      label: `周${WEEKDAYS[i]} ${date.getDate()}`,
      lines: list.map((c) => (c.name.length > 6 ? c.name.slice(0, 6) : c.name)),
    };
  });

  const todayList = courses
    .filter((c) => c.weekday === today && c.weeks.includes(week))
    .sort((a, b) => a.startPeriod - b.startPeriod)
    .slice(0, 6);

  return {
    title: `${tableName} · 第${week}周`,
    days,
    todayTitle: `今天 · 周${WEEKDAYS[today - 1]} ${monday.getMonth() + 1}/${new Date(monday.getTime() + (today - 1) * 86400000).getDate()}`,
    todaySub: todayList.length ? `共 ${todayList.length} 节课` : "今天没有课",
    todayItems: todayList.map((c) => ({
      time: periods[c.startPeriod - 1]?.start ?? "",
      name: c.name,
      room: c.location ?? "",
    })),
  };
}

export async function writeWidgetData(params: Parameters<typeof buildWidgetPayload>[0]): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    const dir = FileSystem.documentDirectory;
    if (!dir) return;
    const payload = buildWidgetPayload(params);
    await FileSystem.writeAsStringAsync(dir + "widget-data.json", JSON.stringify(payload));
  } catch {
    // 小组件数据写入失败不影响主流程
  }
}
