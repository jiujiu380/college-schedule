import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "college.dailynews.v1";
const API = "https://60s.viki.moe/v2/60s";

export type DailyNews = {
  date: string;
  items: string[];
  link: string;
  tip: string;
  cover: string;
  created: string;
};

let memory: DailyNews | null = null;

function normalize(j: any): DailyNews | null {
  const data = j?.data;
  if (!data || !Array.isArray(data.news) || !data.news.length) return null;
  return {
    date: String(data.date ?? ""),
    items: data.news.map((x: any) => String(x ?? "")).filter(Boolean),
    link: String(data.link ?? ""),
    tip: String(data.tip ?? ""),
    cover: String(data.cover ?? ""),
    created: String(data.created ?? ""),
  };
}

export async function loadDailyNews(force = false): Promise<DailyNews> {
  if (!force && memory) return memory;
  if (!force) {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const cached = JSON.parse(raw) as DailyNews;
        if (cached?.items?.length) {
          memory = cached;
          return cached;
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(API, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const parsed = normalize(await res.json());
      if (parsed) {
        memory = parsed;
        await AsyncStorage.setItem(KEY, JSON.stringify(parsed)).catch(() => {});
        return parsed;
      }
    }
  } catch {
    // fall through to cache
  }

  if (memory) return memory;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const cached = JSON.parse(raw) as DailyNews;
      if (cached?.items?.length) return cached;
    }
  } catch {
    // ignore
  }
  throw new Error("今日新闻获取失败，请检查网络后重试");
}
