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

  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=" + latitude.toFixed(3) + "&longitude=" + longitude.toFixed(3) +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto";
  const res = await fetch(url);
  if (!res.ok) throw new Error("天气服务不可用（" + res.status + "）");
  const data: any = await res.json();

  const days: WeatherDay[] = (data.daily?.time ?? []).map((d: string, i: number) => ({
    date: d,
    code: Number(data.daily.weather_code?.[i] ?? 0),
    label: weatherLabel(Number(data.daily.weather_code?.[i] ?? 0)),
    min: Math.round(Number(data.daily.temperature_2m_min?.[i] ?? 0)),
    max: Math.round(Number(data.daily.temperature_2m_max?.[i] ?? 0)),
    rain: Number(data.daily.precipitation_probability_max?.[i] ?? 0),
  }));

  const rainToday = days[0]?.rain ?? 0;
  const currentCode = Number(data.current?.weather_code ?? 0);
  const rainAlert = rainToday >= 60 ? "今天降雨概率 " + rainToday + "%，出门记得带伞" : null;

  return {
    city: city || "当前位置",
    temp: Math.round(Number(data.current?.temperature_2m ?? 0)),
    feels: Math.round(Number(data.current?.apparent_temperature ?? 0)),
    humidity: Math.round(Number(data.current?.relative_humidity_2m ?? 0)),
    wind: Math.round(Number(data.current?.wind_speed_10m ?? 0)),
    code: currentCode,
    label: weatherLabel(currentCode),
    rainAlert,
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
