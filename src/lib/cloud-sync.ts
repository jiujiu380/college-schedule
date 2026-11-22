import { getAccountToken } from "./account";
import { CalendarEvent, loadEvents, saveEvents } from "./events";
import { Memo, loadMemos, saveMemos } from "./memos";
import { getSiteBase } from "./site-api";
import { Timetable } from "./timetables";

export type CloudData = {
  version: 1;
  savedAt: string;
  tables: Timetable[];
  activeId: string;
  memos: Memo[];
  events: CalendarEvent[];
};

export async function uploadCloud(tables: Timetable[], activeId: string): Promise<boolean> {
  const token = await getAccountToken();
  if (!token) return false;
  const [memos, events] = await Promise.all([loadMemos(), loadEvents()]);
  const data: CloudData = { version: 1, savedAt: new Date().toISOString(), tables, activeId, memos, events };
  const base = await getSiteBase();
  const res = await fetch(base + "/api.php?action=sync_save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "云端同步失败");
  }
  return true;
}

export async function downloadCloud(): Promise<{ data: CloudData | null; updatedAt?: string }> {
  const token = await getAccountToken();
  if (!token) throw new Error("请先登录账号");
  const base = await getSiteBase();
  const res = await fetch(base + "/api.php?action=sync_load&token=" + encodeURIComponent(token));
  if (!res.ok) throw new Error("读取云端数据失败");
  const json = await res.json();
  return { data: (json?.data as CloudData) ?? null, updatedAt: json?.updated_at };
}

export async function applyCloudData(data: CloudData): Promise<void> {
  await Promise.all([saveMemos(data.memos ?? []), saveEvents(data.events ?? [])]);
}
