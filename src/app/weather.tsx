import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import {
  WeatherNow,
  isWeatherReminderOn,
  getManualLocation,
  loadWeather,
  scheduleWeatherReminder,
  setManualLocation,
  setWeatherReminderOn,
} from "../lib/weather";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [remind, setRemind] = useState(false);
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const w = await loadWeather();
      setWeather(w);
      if (await isWeatherReminderOn()) {
        await scheduleWeatherReminder(w);
      }
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getManualLocation().then((loc) => {
      if (loc.city) {
        setCity(loc.city);
        setProvince(loc.province);
        setMode("manual");
      }
    });
    void load();
    isWeatherReminderOn().then(setRemind);
  }, []);

  const chooseAuto = async () => {
    setMode("auto");
    await setManualLocation("", "");
    void load();
  };

  const chooseManual = async () => {
    setMode("manual");
    if (city.trim()) {
      await setManualLocation(province.trim(), city.trim());
      void load();
    }
  };

  const saveCity = async () => {
    if (!city.trim()) return;
    await setManualLocation(province.trim(), city.trim());
    void load();
  };

  const toggleRemind = async (on: boolean) => {
    setRemind(on);
    await setWeatherReminderOn(on);
    if (on && weather) {
      const ok = await scheduleWeatherReminder(weather);
      if (!ok) setError("通知权限未开启，无法每天推送天气");
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.card}>
        <View style={styles.modeRow}>
          <Pressable style={[styles.modeBtn, mode === "auto" && styles.modeActive]} onPress={chooseAuto}>
            <Ionicons name="locate-outline" size={14} color={mode === "auto" ? colors.brand : colors.sub} />
            <Text style={[styles.modeText, mode === "auto" && { color: colors.brand, fontWeight: "600" }]}>自动定位</Text>
          </Pressable>
          <Pressable style={[styles.modeBtn, mode === "manual" && styles.modeActive]} onPress={chooseManual}>
            <Ionicons name="map-outline" size={14} color={mode === "manual" ? colors.brand : colors.sub} />
            <Text style={[styles.modeText, mode === "manual" && { color: colors.brand, fontWeight: "600" }]}>手动城市</Text>
          </Pressable>
        </View>
        {mode === "manual" ? (
          <View style={{ gap: 8, marginTop: 10 }}>
            <TextInput value={province} onChangeText={setProvince} placeholder="省份，如 内蒙古" placeholderTextColor={colors.faint} style={styles.cityInput} />
            <View style={styles.cityRow}>
              <TextInput value={city} onChangeText={setCity} placeholder="城市，如 呼和浩特" placeholderTextColor={colors.faint} style={styles.cityInput} />
              <Pressable style={styles.cityBtn} onPress={saveCity}><Text style={styles.cityBtnText}>保存</Text></Pressable>
            </View>
          </View>
        ) : (
          <Text style={styles.modeHint}>自动通过 IP 接口获取当前省市；失败时再用系统定位兜底。</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.city}>{weather?.city ?? "定位中…"}</Text>
            <Text style={styles.updated}>{weather ? "更新于 " + new Date(weather.updatedAt).toLocaleTimeString().slice(0, 5) : ""}</Text>
          </View>
          <Pressable onPress={load} hitSlop={8} style={styles.refresh}>
            <Ionicons name="refresh" size={16} color={colors.brand} />
          </Pressable>
        </View>

        {loading ? <ActivityIndicator color={colors.brand} style={{ marginVertical: 30 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {weather ? (
          <>
            <View style={styles.nowRow}>
              <Text style={styles.temp}>{weather.temp}°</Text>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.label}>{weather.label}</Text>
                <Text style={styles.feels}>{weather.humidity >= 0 ? `体感 ${weather.feels}° · 湿度 ${weather.humidity}% · 风速 ${weather.wind}km/h` : `最高 ${weather.days[0]?.max ?? weather.temp}° · 最低 ${weather.days[0]?.min ?? weather.temp}°`}</Text>
              </View>
            </View>
            {weather.stale ? (
              <View style={styles.alert}>
                <Ionicons name="cloud-offline-outline" size={15} color={colors.warnText} />
                <Text style={[styles.alertText, { color: colors.warnText }]}>网络不可用，显示上次缓存 · {new Date(weather.updatedAt).toLocaleString()}</Text>
              </View>
            ) : null}
            {weather.rainAlert ? (
              <View style={styles.alert}>
                <Ionicons name="umbrella-outline" size={15} color={colors.brand} />
                <Text style={styles.alertText}>{weather.rainAlert}</Text>
              </View>
            ) : null}
            <View style={styles.days}>
              {weather.days.map((d, i) => (
                <View key={d.date} style={styles.day}>
                  <Text style={styles.dayName}>{i === 0 ? "今天" : i === 1 ? "明天" : i === 2 ? "后天" : d.date ? d.date.slice(5) : "第" + (i + 1) + "天"}</Text>
                  <Text style={styles.dayIcon}>{/雨|雪/.test(d.label) ? "🌧" : /阴|云|雾/.test(d.label) ? "⛅" : "☀️"}</Text>
                  <Text style={styles.dayTemp}>{d.min}° / {d.max}°</Text>
                  <Text style={styles.dayRain}>{d.rain}%</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.remindRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.remindTitle}>每日天气提醒</Text>
            <Text style={styles.remindSub}>每天 07:00 推送天气 + 今日课程</Text>
          </View>
          <Switch value={remind} onValueChange={toggleRemind} trackColor={{ false: colors.line, true: colors.brand }} thumbColor="#FFFFFF" />
        </View>
      </View>

    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 12 },
    modeRow: { flexDirection: "row", backgroundColor: colors.chipBg, borderRadius: radius.sm, padding: 3, gap: 2 },
    modeBtn: { flex: 1, height: 34, borderRadius: 6, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
    modeActive: { backgroundColor: colors.surface },
    modeText: { fontSize: 12, color: colors.sub },
    modeHint: { fontSize: 10.5, color: colors.faint, marginTop: 10, lineHeight: 16 },
    cityRow: { flexDirection: "row", gap: 8, marginTop: 10 },
    cityInput: { flex: 1, height: 42, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 10, fontSize: 13, color: colors.ink, backgroundColor: colors.fieldBg },
    cityBtn: { width: 64, height: 42, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    cityBtnText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "600" },
    head: { flexDirection: "row", alignItems: "center" },
    city: { fontSize: 15, fontWeight: "600", color: colors.ink },
    updated: { fontSize: 10.5, color: colors.faint, marginTop: 3 },
    refresh: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    nowRow: { flexDirection: "row", alignItems: "center", marginTop: 18 },
    temp: { fontSize: 58, fontWeight: "300", color: colors.ink, letterSpacing: -2 },
    label: { fontSize: 16, color: colors.ink, fontWeight: "600" },
    feels: { fontSize: 11, color: colors.sub, marginTop: 6 },
    alert: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, padding: 10, borderRadius: 8, backgroundColor: colors.brandSoft },
    alertText: { fontSize: 12, color: colors.brand, flex: 1 },
    days: { flexDirection: "row", marginTop: 18, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14 },
    day: { flex: 1, alignItems: "center", gap: 5 },
    dayName: { fontSize: 11, color: colors.sub },
    dayIcon: { fontSize: 20 },
    dayTemp: { fontSize: 11.5, color: colors.ink },
    dayRain: { fontSize: 10, color: colors.faint },
    error: { fontSize: 12, color: colors.danger, marginTop: 14, lineHeight: 18 },
    remindRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    remindTitle: { fontSize: 14, color: colors.ink, fontWeight: "500" },
    remindSub: { fontSize: 11, color: colors.faint, marginTop: 4 },
    footer: { fontSize: 10.5, color: colors.faint, textAlign: "center", lineHeight: 17, marginTop: 8 },
  });