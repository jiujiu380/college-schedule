import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "college.quote.v1";
const FALLBACK = [
  "一篙之成，当尽毕生之力。",
  "慢慢来，比较快。",
  "今天也要认真上课。",
  "把小事做好，就是了不起。",
  "不必追赶，按自己的节奏走。",
];

type Cache = { date: string; text: string };

function today(): string {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

function decode(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export async function loadQuote(force = false): Promise<string> {
  try {
    if (!force) {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const cache = JSON.parse(raw) as Cache;
        if (cache.date === today() && cache.text) return cache.text;
      }
    }
  } catch {
    // ignore
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://v.api.aa1.cn/api/yiyan/index.php", { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const text = decode(await res.text());
      if (text) {
        await AsyncStorage.setItem(KEY, JSON.stringify({ date: today(), text })).catch(() => {});
        return text;
      }
    }
  } catch {
    // fall through
  }

  return FALLBACK[new Date().getDate() % FALLBACK.length];
}
