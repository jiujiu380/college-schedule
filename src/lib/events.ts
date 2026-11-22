import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ensureChannel } from "./notifications";

const KEY = "college.events.v1";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  note?: string;
  notificationId?: string;
};

export async function loadEvents(): Promise<CalendarEvent[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveEvents(list: CalendarEvent[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function addEvent(input: Omit<CalendarEvent, "id">): Promise<CalendarEvent[]> {
  const list = await loadEvents();
  const ev: CalendarEvent = { ...input, id: "e-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) };
  try {
    await ensureChannel();
    const when = new Date(ev.date + "T" + (ev.time || "09:00") + ":00");
    when.setMinutes(when.getMinutes() - 10);
    if (when.getTime() > Date.now()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: "日程提醒：" + ev.title, body: ev.date + " " + ev.time, sound: "default" },
        trigger: Platform.OS === "android"
          ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: "calendar-events" }
          : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      });
      ev.notificationId = id;
    }
  } catch {
    // 通知失败不影响保存
  }
  const next = [ev, ...list];
  await saveEvents(next);
  return next;
}

export async function removeEvent(id: string): Promise<CalendarEvent[]> {
  const list = await loadEvents();
  const target = list.find((e) => e.id === id);
  if (target?.notificationId) {
    try { await Notifications.cancelScheduledNotificationAsync(target.notificationId); } catch { /* ignore */ }
  }
  const next = list.filter((e) => e.id !== id);
  await saveEvents(next);
  return next;
}
