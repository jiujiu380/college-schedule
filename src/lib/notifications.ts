import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Course } from "./schedule";
import { Period, weekOf } from "./time";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = "class-reminders";
export const NOTIFY_KEY = "college.notify.enabled.v1";

export async function isNotifyEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(NOTIFY_KEY)) === "1";
}

export async function setNotifyEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIFY_KEY, on ? "1" : "0");
}

/** 应用启动时创建 Android 通知渠道（幂等） */
export async function ensureChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "上课提醒",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 220, 250],
      lightColor: "#2F5BFF",
    });
  } catch {
    // 渠道创建失败不阻塞启动
  }
}

export async function ensureNotifyPermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "上课提醒",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 220, 250],
      lightColor: "#2F5BFF",
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return Boolean(req.granted);
}

export type ReminderOptions = { days?: number; leadMinutes?: number };

/**
 * 按作息表（夏季/秋季）为未来若干天的课程排本地提醒。
 * 返回实际排期的提醒数量。
 */
export async function scheduleClassReminders(
  courses: Course[],
  periods: Period[],
  options: ReminderOptions = {},
): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const days = options.days ?? 14;
  const lead = options.leadMinutes ?? 10;
  const now = new Date();
  let count = 0;

  for (let i = 0; i < days; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const weekday = day.getDay() === 0 ? 7 : day.getDay();
    const week = weekOf(day);
    for (const c of courses) {
      if (c.weekday !== weekday || !c.weeks.includes(week)) continue;
      const p = periods[c.startPeriod - 1];
      if (!p) continue;
      const [h, m] = p.start.split(":").map(Number);
      const when = new Date(day.getTime());
      when.setHours(h, m, 0, 0);
      when.setMinutes(when.getMinutes() - lead);
      if (when.getTime() <= Date.now() + 5000) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `即将上课 · ${c.name}`,
          body: `${p.start} ${c.location ?? ""} · ${c.teacher ?? ""}`,
          sound: true,
          data: { courseId: c.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: CHANNEL_ID,
        },
      });
      count++;
    }
  }
  return count;
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
