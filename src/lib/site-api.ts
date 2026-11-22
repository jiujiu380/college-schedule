import AsyncStorage from "@react-native-async-storage/async-storage";

/** 官网地址：可在设置里修改，默认 class.zcoow.cn */
export const DEFAULT_SITE_BASE = "https://class.zcoow.cn";
const SITE_KEY = "college.site.base.v1";
const DEVICE_KEY = "college.device.id.v1";

export type SiteInfo = {
  name: string;
  desc: string;
  logo: string;
  download: string;
  contact: { email: string; qq: string; wechat: string; site: string };
  captcha?: { enabled: boolean; id: string };
  sms?: { enabled: boolean; provider: string };
};

export type Announcement = {
  id: number;
  title: string;
  content: string;
  pinned: number;
  created_at: string;
};

export type SiteUpdate = { version: string; url: string; notes: string; force: number; created_at: string };

export type Ticket = {
  id: number;
  title: string;
  content: string;
  status: string;
  reply: string | null;
  created_at: string;
  updated_at: string | null;
};

export async function getSiteBase(): Promise<string> {
  const v = await AsyncStorage.getItem(SITE_KEY);
  return (v || DEFAULT_SITE_BASE).replace(/\/$/, "");
}

export async function setSiteBase(url: string): Promise<void> {
  await AsyncStorage.setItem(SITE_KEY, url.trim().replace(/\/$/, ""));
}

export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const id = "d-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  await AsyncStorage.setItem(DEVICE_KEY, id);
  return id;
}

async function getJson<T>(path: string, timeoutMs = 8000): Promise<T> {
  const base = await getSiteBase();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(base + path, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSiteInfo(): Promise<SiteInfo> {
  return getJson<SiteInfo>("/api.php?action=site");
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const data = await getJson<{ items: Announcement[] }>("/api.php?action=announcements");
  return data.items ?? [];
}

export async function fetchSiteUpdate(): Promise<SiteUpdate | null> {
  const data = await getJson<{ update: SiteUpdate | null }>("/api.php?action=update");
  return data.update;
}

export async function fetchTickets(): Promise<Ticket[]> {
  const device = await getDeviceId();
  const data = await getJson<{ items: Ticket[] }>(`/api.php?action=tickets&device_id=${encodeURIComponent(device)}`);
  return data.items ?? [];
}

export async function createTicket(input: { title: string; content: string; contact?: string }): Promise<void> {
  const base = await getSiteBase();
  const device = await getDeviceId();
  const res = await fetch(base + "/api.php?action=ticket_create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: device, title: input.title, content: input.content, contact: input.contact ?? "" }),
  });
  if (!res.ok) throw new Error("提交失败 HTTP " + res.status);
}

export function htmlToText(html: string): string {
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}