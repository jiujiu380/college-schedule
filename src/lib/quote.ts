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

const BLOCKED = /性欲|做爱|色情|淫|强奸|勾引|约炮|自慰|生殖器|乳房|床事|情色|黄片|嫖娼|妓女|裸体|裸照|射精|高潮|血腥|虐杀|自杀|杀人/i;

function safeQuote(text: string): boolean {
  return Boolean(text) && !BLOCKED.test(text);
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
        if (cache.date === today() && cache.text && safeQuote(cache.text)) return cache.text;
      }
    }
  } catch {
    // ignore
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://v1.hitokoto.cn/?c=d&c=i&c=k&encode=json", { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const json: any = await res.json();
      const text = decode(String(json?.hitokoto ?? ""));
      if (text && safeQuote(text)) {
        await AsyncStorage.setItem(KEY, JSON.stringify({ date: today(), text })).catch(() => {});
        return text;
      }
    }
  } catch {
    // fall through
  }

  return FALLBACK[new Date().getDate() % FALLBACK.length];
}