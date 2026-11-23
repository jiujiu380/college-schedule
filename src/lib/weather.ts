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
  stale?: boolean;
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

async function fetchCmaWeather(city: string | null): Promise<WeatherNow | null> {
  if (!city) return null;
  const q = city.replace(/(特别行政区|自治州|自治县|地区|盟|市|县|区)$/g, "").trim() || city;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const acRes = await fetch("https://weather.cma.cn/api/autocomplete?q=" + encodeURIComponent(q), { signal: controller.signal });
    if (!acRes.ok) return null;
    const ac = await acRes.json();
    const first = Array.isArray(ac?.data) ? String(ac.data[0] ?? "") : "";
    const stationId = first.split("|")[0];
    if (!stationId) return null;

    const res = await fetch("https://weather.cma.cn/api/weather/view?stationid=" + encodeURIComponent(stationId), { signal: controller.signal });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    const loc = data?.location;
    const now = data?.now;
    if (!loc?.name || !now) return null;

    const temp = Math.round(Number(now.temperature ?? 0));
    const label = String(data?.daily?.[0]?.dayText ?? "未知");
    const days: WeatherDay[] = (Array.isArray(data?.daily) ? data.daily : []).slice(0, 3).map((d: any) => {
      const dayText = String(d.dayText ?? "");
      const rainy = /雨|雪|雷/.test(dayText);
      return {
        date: String(d.date ?? "").replace(/\//g, "-"),
        code: Number(d.dayCode ?? 0),
        label: dayText || "未知",
        min: Math.round(Number(d.low ?? 0)),
        max: Math.round(Number(d.high ?? 0)),
        rain: rainy ? 60 : 0,
      };
    });
    const todayText = String(data?.daily?.[0]?.dayText ?? "");
    return {
      city: String(loc.name),
      temp,
      feels: Math.round(Number(now.feelst ?? temp)),
      humidity: Math.round(Number(now.humidity ?? 0)),
      wind: Math.round(Number(now.windSpeed ?? 0) * 3.6),
      code: Number(data?.daily?.[0]?.dayCode ?? 0),
      label,
      rainAlert: /雨/.test(todayText) ? "今天有雨，出门记得带伞" : /雪/.test(todayText) ? "今天有雪，注意保暖防滑" : null,
      days,
      updatedAt: Date.now(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
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

const CACHE_KEY = "college.weather.cache.v1";

async function saveCache(w: WeatherNow): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(w));
  } catch {
    // ignore
  }
}

async function readCache(): Promise<WeatherNow | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherNow;
    return parsed && typeof parsed.temp === "number" ? parsed : null;
  } catch {
    return null;
  }
}

async function fetchOpenMeteo(lat: number, lon: number, city: string | null): Promise<WeatherNow | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=" + lat.toFixed(3) + "&longitude=" + lon.toFixed(3) +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto";
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data: any = await res.json();
    const code = Number(data.current?.weather_code ?? 0);
    const days: WeatherDay[] = (data.daily?.time ?? []).map((d: string, i: number) => {
      const dc = Number(data.daily.weather_code?.[i] ?? 0);
      return {
        date: String(d),
        code: dc,
        label: weatherLabel(dc),
        min: Math.round(Number(data.daily.temperature_2m_min?.[i] ?? 0)),
        max: Math.round(Number(data.daily.temperature_2m_max?.[i] ?? 0)),
        rain: Number(data.daily.precipitation_probability_max?.[i] ?? 0),
      };
    });
    const rain = days[0]?.rain ?? 0;
    return {
      city: city || "当前位置",
      temp: Math.round(Number(data.current?.temperature_2m ?? 0)),
      feels: Math.round(Number(data.current?.apparent_temperature ?? 0)),
      humidity: Math.round(Number(data.current?.relative_humidity_2m ?? 0)),
      wind: Math.round(Number(data.current?.wind_speed_10m ?? 0)),
      code,
      label: weatherLabel(code),
      rainAlert: rain >= 60 ? "今天降雨概率 " + rain + "%，出门记得带伞" : null,
      days,
      updatedAt: Date.now(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const MANUAL_PROVINCE_KEY = "college.weather.province.v1";
const MANUAL_CITY_KEY = "college.weather.manualCity.v1";

export async function getManualLocation(): Promise<{ province: string; city: string }> {
  try {
    const [province, city] = await Promise.all([
      AsyncStorage.getItem(MANUAL_PROVINCE_KEY),
      AsyncStorage.getItem(MANUAL_CITY_KEY),
    ]);
    return { province: province ?? "", city: city ?? "" };
  } catch {
    return { province: "", city: "" };
  }
}

export async function setManualLocation(province: string, city: string): Promise<void> {
  await AsyncStorage.multiSet([
    [MANUAL_PROVINCE_KEY, province.trim()],
    [MANUAL_CITY_KEY, city.trim()],
  ]);
}

export async function getManualCity(): Promise<string> {
  return (await getManualLocation()).city;
}

export async function setManualCity(city: string): Promise<void> {
  await setManualLocation("", city);
}

const EN_PROVINCE: Record<string, string> = {
  "inner mongolia": "内蒙古", beijing: "北京", shanghai: "上海", tianjin: "天津", chongqing: "重庆",
  guangdong: "广东", sichuan: "四川", zhejiang: "浙江", jiangsu: "江苏", hubei: "湖北", hunan: "湖南",
  shaanxi: "陕西", shandong: "山东", henan: "河南", fujian: "福建", anhui: "安徽", jiangxi: "江西",
  yunnan: "云南", guizhou: "贵州", guangxi: "广西", hainan: "海南", gansu: "甘肃", qinghai: "青海",
  ningxia: "宁夏", xinjiang: "新疆", tibet: "西藏", liaoning: "辽宁", jilin: "吉林",
  heilongjiang: "黑龙江", shanxi: "山西", hebei: "河北",
};

const EN_CITY: Record<string, string> = {
  beijing: "北京", shanghai: "上海", tianjin: "天津", chongqing: "重庆", guangzhou: "广州",
  shenzhen: "深圳", chengdu: "成都", hangzhou: "杭州", wuhan: "武汉", "xi'an": "西安", xian: "西安",
  nanjing: "南京", suzhou: "苏州", qingdao: "青岛", jinan: "济南", zhengzhou: "郑州", changsha: "长沙",
  kunming: "昆明", hefei: "合肥", fuzhou: "福州", xiamen: "厦门", ningbo: "宁波", shenyang: "沈阳",
  dalian: "大连", harbin: "哈尔滨", changchun: "长春", shijiazhuang: "石家庄", taiyuan: "太原",
  nanchang: "南昌", guiyang: "贵阳", nanning: "南宁", haikou: "海口", lanzhou: "兰州", xining: "西宁",
  yinchuan: "银川", urumqi: "乌鲁木齐", lhasa: "拉萨", hohhot: "呼和浩特", baotou: "包头", ordos: "鄂尔多斯",
};

const PROVINCE_CAPITAL: Record<string, string> = {
  内蒙古: "呼和浩特", 北京: "北京", 上海: "上海", 天津: "天津", 重庆: "重庆", 广东: "广州",
  四川: "成都", 浙江: "杭州", 江苏: "南京", 湖北: "武汉", 湖南: "长沙", 陕西: "西安",
  山东: "济南", 河南: "郑州", 福建: "福州", 安徽: "合肥", 江西: "南昌", 云南: "昆明",
  贵州: "贵阳", 广西: "南宁", 海南: "海口", 甘肃: "兰州", 青海: "西宁", 宁夏: "银川",
  新疆: "乌鲁木齐", 西藏: "拉萨", 辽宁: "沈阳", 吉林: "长春", 黑龙江: "哈尔滨",
  山西: "太原", 河北: "石家庄",
};

function stripRegionSuffix(value: string): string {
  return value.replace(/(特别行政区|壮族自治区|回族自治区|维吾尔自治区|自治区|省|市)$/g, "").trim();
}

function provinceForCity(city: string): string {
  for (const [p, c] of Object.entries(PROVINCE_CAPITAL)) {
    if (c === city) return p;
  }
  return "";
}

async function fetchJson(url: string, timeoutMs = 9000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchIpLocation(): Promise<{ province: string; city: string } | null> {
  let ipapi: any = null;
  let ipipProvince = "";
  await Promise.all([
    fetchJson("https://api.ipapi.is/", 8000).then((j) => { ipapi = j; }),
    fetchJson("https://myip.ipip.net/json", 8000).then((j) => {
      ipipProvince = String(j?.data?.location?.[1] ?? "").trim();
    }),
  ]);

  const region = String(ipapi?.region ?? "").toLowerCase();
  const province = stripRegionSuffix(ipipProvince) || EN_PROVINCE[region] || "";
  const cityEn = String(ipapi?.city ?? "").toLowerCase();
  const city = EN_CITY[cityEn] || (province ? PROVINCE_CAPITAL[province] : "") || cityEn;
  if (!province && !city) return null;
  return { province: province || provinceForCity(city), city: city || province };
}

async function fetchMojiWeather(province: string, city: string | null): Promise<WeatherNow | null> {
  if (!city) return null;
  const sheng = province || provinceForCity(city) || city;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const url =
      "https://cn.apihz.cn/api/tianqi/tqybmoji15.php?id=88888888&key=88888888" +
      "&sheng=" + encodeURIComponent(sheng) +
      "&place=" + encodeURIComponent(city);
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const j: any = await res.json();
    if (Number(j?.code) !== 200 || !Array.isArray(j?.data) || !j.data.length) return null;

    const year = new Date().getFullYear();
    const days: WeatherDay[] = j.data.slice(0, 7).map((d: any) => {
      const md = String(d?.week2 ?? "");
      const [mm, dd] = md.split("/").map(Number);
      const date = mm && dd ? year + "-" + String(mm).padStart(2, "0") + "-" + String(dd).padStart(2, "0") : "";
      const wea1 = String(d?.wea1 ?? "").trim();
      const wea2 = String(d?.wea2 ?? "").trim();
      const label = wea1 && wea2 && wea2 !== wea1 ? wea1 + "转" + wea2 : wea1 || wea2 || "未知";
      const max = Math.round(Number(String(d?.wendu1 ?? "").replace(/[^\d-]/g, "")));
      const min = Math.round(Number(String(d?.wendu2 ?? "").replace(/[^\d-]/g, "")));
      return {
        date,
        code: 0,
        label,
        min: Number.isFinite(min) ? min : max,
        max: Number.isFinite(max) ? max : min,
        rain: /雨|雪|雷/.test(label) ? 60 : 0,
      };
    });
    if (!days.length) return null;

    const today = days[0];
    const temp = Math.round((today.min + today.max) / 2);
    const rainy = /雨|雪|雷/.test(today.label);
    return {
      city: String(j?.place ?? city),
      temp,
      feels: temp,
      humidity: -1,
      wind: -1,
      code: 0,
      label: today.label,
      rainAlert: rainy ? "今天有雨雪，出门记得带伞并注意保暖" : null,
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
  const manual = await getManualLocation();
  let province = manual.province;
  let city: string | null = manual.city || null;
  let coords: { latitude: number; longitude: number } | null = null;

  // 自动模式：先通过 IP 接口获取省市；失败再用系统定位兜底
  if (!city) {
    const ip = await fetchIpLocation();
    if (ip) {
      province = ip.province;
      city = ip.city;
    }
  }

  if (!city) {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.granted) {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      try {
        const geo = await Location.reverseGeocodeAsync(coords);
        if (geo.length) {
          city = geo[0].city || geo[0].district || geo[0].region || "当前位置";
          province = stripRegionSuffix(String(geo[0].region ?? ""));
        }
      } catch {
        city = "当前位置";
      }
    }
  }

  if (!city) {
    const cached = await readCache();
    if (cached) return { ...cached, stale: true };
    throw new Error("无法获取当前位置，可切换为手动城市");
  }

  if (!province) province = provinceForCity(city);
  if (!coords) {
    try {
      const geo = await Location.geocodeAsync(city);
      if (geo.length) coords = { latitude: geo[0].latitude, longitude: geo[0].longitude };
    } catch {
      coords = null;
    }
  }
  await setWeatherCity(city);

  // 1) 墨迹天气 15 日（接口盒子）
  const moji = await fetchMojiWeather(province, city);
  if (moji) {
    await saveCache(moji);
    return moji;
  }

  // 2) 中央气象台
  const cma = await fetchCmaWeather(city);
  if (cma) {
    await saveCache(cma);
    return cma;
  }

  // 3) Open-Meteo（需要坐标）
  if (coords) {
    const openMeteo = await fetchOpenMeteo(coords.latitude, coords.longitude, city);
    if (openMeteo) {
      await saveCache(openMeteo);
      return openMeteo;
    }
  }

  // 4) vvhan
  const domestic = await fetchDomesticWeather(city);
  if (domestic) {
    await saveCache(domestic);
    return domestic;
  }

  // 5) wttr.in
  if (coords) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const url = "https://wttr.in/" + coords.latitude.toFixed(3) + "," + coords.longitude.toFixed(3) + "?format=j1";
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data: any = await res.json();
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
        const result: WeatherNow = {
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
        await saveCache(result);
        return result;
      }
    } catch {
      // fall through
    }
  }

  const cached = await readCache();
  if (cached) return { ...cached, stale: true };
  throw new Error("天气获取失败，请检查网络或切换城市");
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