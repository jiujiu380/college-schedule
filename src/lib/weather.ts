import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ensureChannel } from "./notifications";

const CITY_KEY = "college.weather.city.v1";
const REMIND_KEY = "college.weather.remind.v1";
const REMIND_ID_KEY = "college.weather.remindId.v1";

export type WeatherDay = { date: string; code: number; label: string; min: number; max: number; rain: number };
export type WeatherNow = {
  city: string;
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  code: number;
  label: string;
  rainAlert: string | null;
  days: WeatherDay[];
  updatedAt: number;
};

const CODE_MAP: Record<number, string> = {
  0: "晴", 1: "晴间多云", 2: "多云", 3: "阴", 45: "雾", 48: "雾凇",
  51: "小毛毛雨", 53: "毛毛雨", 55: "大毛毛雨", 61: "小雨", 63: "中雨", 65: "大雨",
  66: "冻雨", 67: "强冻雨", 71: "小雪", 73: "中雪", 75: "大雪", 77: "雪粒",
  80: "阵雨", 81: "强阵雨", 82: "暴雨", 85: "阵雪", 86: "强阵雪",
  95: "雷阵雨", 96: "雷阵雨伴冰雹", 99: "强雷暴",
  113: "晴", 116: "多云", 119: "阴", 122: "阴", 143: "薄雾", 176: "阵雨",
  179: "阵雪", 182: "雨夹雪", 185: "冻雨", 200: "雷阵雨", 227: "小雪", 230: "暴雪",
  248: "雾", 260: "雾", 263: "小雨", 266: "小雨", 281: "冻雨", 284: "冻雨",
  293: "小雨", 296: "小雨", 299: "中雨", 302: "中雨", 305: "大雨", 308: "大雨",
  311: "小雨", 314: "中雨", 317: "小雨", 320: "中雨", 323: "小雪", 326: "小雪",
  329: "中雪", 332: "中雪", 335: "大雪", 338: "大雪", 350: "冰粒", 353: "阵雨",
  356: "强阵雨", 359: "暴雨", 362: "阵雪", 365: "阵雪", 368: "小雪", 371: "大雪",
  374: "冰粒", 377: "冰粒", 386: "雷阵雨", 389: "强雷雨", 392: "雷雪", 395: "雷雪",
};

export function weatherLabel(code: number): string {
  return CODE_MAP[code] ?? "未知";
}

export async function getWeatherCity(): Promise<string | null> {
  return AsyncStorage.getItem(CITY_KEY);
}

export async function setWeatherCity(city: string): Promise<void> {
  await AsyncStorage.setItem(CITY_KEY, city);
}

export async function isWeatherReminderOn(): Promise<boolean> {
  return (await AsyncStorage.getItem(REMIND_KEY)) === "1";
}

export async function setWeatherReminderOn(on: boolean): Promise<void> {
  await AsyncStorage.setItem(REMIND_KEY, on ? "1" : "0");
  if (!on) await cancelWeatherReminder();
}

export async function cancelWeatherReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(REMIND_ID_KEY);
  if (id) {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch { /* ignore */ }
    await AsyncStorage.removeItem(REMIND_ID_KEY);
  }
}

async function fetchDomesticWeather(city: string | null): Promise<WeatherNow | null> {
  if (!city) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch("https://api.vvhan.com/api/weather?city=" + encodeURIComponent(city), { signal: controller.signal });
    if (!res.ok) return null;
    const j: any = await res.json();
    if (j && j.success === false) return null;
    const d: any = j.data ?? j;
    const temp = Math.round(Number(d.temp ?? d.temperature ?? 0));
    if (!Number.isFinite(temp) || (temp === 0 && !d.weather)) return null;
    const label = String(d.weather ?? d.wea ?? "未知");
    const today = new Date();
    const iso = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    const forecast = Array.isArray(d.forecast) ? d.forecast : Array.isArray(j.forecast) ? j.forecast : [];
    const days: WeatherDay[] = forecast.slice(0, 3).map((x: any) => ({
      date: String(x.date ?? x.day ?? iso),
      code: 0,
      label: String(x.weather ?? x.wea ?? label),
      min: Math.round(Number(x.temp_min ?? x.min ?? temp)),
      max: Math.round(Number(x.temp_max ?? x.max ?? temp)),
      rain: Math.round(Number(x.rain ?? x.precip ?? 0)),
    }));
    if (!days.length) {
      days.push({ date: iso, code: 0, label, min: temp, max: temp, rain: 0 });
    }
    return {
      city: String(j.city ?? city),
      temp,
      feels: temp,
      humidity: Math.round(Number(d.humidity ?? 0)),
      wind: Math.round(Number(d.wind ?? d.win ?? 0)),
      code: 0,
      label,
      rainAlert: null,
      days,
      updatedAt: Date.now(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function loadWeather(): Promise<WeatherNow> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) throw new Error("没有定位权限，无法获取本地天气");

  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const { latitude, longitude } = pos.coords;

  let city = await getWeatherCity();
  if (!city) {
    try {
      const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo.length) city = geo[0].city || geo[0].district || geo[0].region || "当前位置";
    } catch {
      city = "当前位置";
    }
    if (city) await setWeatherCity(city);
  }

  const domestic = await fetchDomesticWeather(city);
  if (domestic) return domestic;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let data: any;
  try {
    const url = "https://wttr.in/" + latitude.toFixed(3) + "," + longitude.toFixed(3) + "?format=j1";
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error("天气服务不可用（" + res.status + "）");
    data = await res.json();
  } catch (e) {
    throw new Error("天气获取失败，请检查网络后重试");
  } finally {
    clearTimeout(timer);
  }

  const cur = data.current_condition?.[0] ?? {};
  const currentCode = Number(cur.weatherCode ?? 113);
  const currentTemp = Math.round(Number(cur.temp_C ?? 0));

  const days: WeatherDay[] = (data.weather ?? []).slice(0, 3).map((d: any) => {
    const hourly = Array.isArray(d.hourly) ? d.hourly : [];
    const rain = hourly.reduce((mx: number, h: any) => Math.max(mx, Number(h.chanceofrain ?? 0)), 0);
    const code = Number(hourly[0]?.weatherCode ?? currentCode);
    return {
      date: String(d.date ?? ""),
      code,
      label: weatherLabel(code),
      min: Math.round(Number(d.mintempC ?? 0)),
      max: Math.round(Number(d.maxtempC ?? 0)),
      rain,
    };
  });

  const rainToday = days[0]?.rain ?? 0;

  return {
    city: city || "当前位置",
    temp: currentTemp,
    feels: Math.round(Number(cur.FeelsLikeC ?? currentTemp)),
    humidity: Math.round(Number(cur.humidity ?? 0)),
    wind: Math.round(Number(cur.windspeedKmph ?? 0)),
    code: currentCode,
    label: weatherLabel(currentCode),
    rainAlert: rainToday >= 60 ? "今天降雨概率 " + rainToday + "%，出门记得带伞" : null,
    days,
    updatedAt: Date.now(),
  };
}

export async function scheduleWeatherReminder(w: WeatherNow): Promise<boolean> {
  await cancelWeatherReminder();
  await ensureChannel();
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== "granted") return false;
  }
  const today = w.days[0];
  const body = today
    ? `${w.city} ${w.label} ${today.min}~\u00A0${today.max}℃，降雨概率 ${today.rain}%${w.rainAlert ? "，记得带伞" : ""}`
    : `${w.city} ${w.label} ${w.temp}℃`;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: "今日天气", body, sound: "default" },
      trigger: Platform.OS === "android"
        ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 7, minute: 0, channelId: "weather-alerts" }
        : { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 7, minute: 0 },
    });
    await AsyncStorage.setItem(REMIND_ID_KEY, id);
    return true;
  } catch {
    return false;
  }
}