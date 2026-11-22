import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import {
  WeatherNow,
  isWeatherReminderOn,
  loadWeather,
  scheduleWeatherReminder,
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
    void load();
    isWeatherReminderOn().then(setRemind);
  }, []);

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
                <Text style={styles.feels}>体感 {weather.feels}° · 湿度 {weather.humidity}% · 风速 {weather.wind}km/h</Text>
              </View>
            </View>
            {weather.rainAlert ? (
              <View style={styles.alert}>
                <Ionicons name="umbrella-outline" size={15} color={colors.brand} />
                <Text style={styles.alertText}>{weather.rainAlert}</Text>
              </View>
            ) : null}
            <View style={styles.days}>
              {weather.days.map((d, i) => (
                <View key={d.date} style={styles.day}>
                  <Text style={styles.dayName}>{i === 0 ? "今天" : i === 1 ? "明天" : "后天"}</Text>
                  <Text style={styles.dayIcon}>{d.rain >= 60 ? "🌧" : d.code === 0 ? "☀️" : d.code <= 3 ? "⛅" : "☁️"}</Text>
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
            <Text style={styles.remindSub}>每天 07:00 推送本地天气与降雨提示</Text>
          </View>
          <Switch value={remind} onValueChange={toggleRemind} trackColor={{ false: colors.line, true: colors.brand }} thumbColor="#FFFFFF" />
        </View>
      </View>

      <Text style={styles.footer}>天气数据来自中央气象台（weather.cma.cn），不可用时自动切换备用源；定位仅用于获取本地天气。</Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 12 },
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