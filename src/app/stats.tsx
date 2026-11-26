import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { coursesForWeek } from "../lib/export-schedule";
import { loadHomework } from "../lib/homework";
import { useSchedule } from "../lib/schedule-store";
import { StudySession, cancelStudy, loadActiveStart, loadSessions, startStudy, stopStudy } from "../lib/study";
import { useTheme } from "../lib/theme-context";
import { weekOfDate } from "../lib/timetables";
import { Colors, radius } from "../theme";
import { WEEKDAYS } from "../lib/time";

function toMin(t?: string): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fmtHours(min: number): string {
  if (min < 60) return min + " 分钟";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h + " 小时" + (m ? " " + m + " 分" : "");
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tables, activeId, periods } = useSchedule();
  const active = tables.find((t) => t.id === activeId) ?? tables[0];
  const currentWeek = useMemo(() => (active ? weekOfDate(active.startDate) : 1), [active?.startDate]);
  const courses = useMemo(() => (active ? coursesForWeek(active, currentWeek) : []), [active, currentWeek]);

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeStart, setActiveStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [homework, setHomework] = useState<{ done: number; total: number; overdue: number }>({ done: 0, total: 0, overdue: 0 });

  const load = useCallback(async () => {
    setSessions(await loadSessions());
    setActiveStart(await loadActiveStart());
    const hw = await loadHomework();
    setHomework({
      done: hw.filter((h) => h.done).length,
      total: hw.length,
      overdue: hw.filter((h) => !h.done && h.due && new Date(h.due).getTime() < Date.now()).length,
    });
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const classByDay = useMemo(() => {
    const arr = Array(7).fill(0) as number[];
    for (const c of courses) {
      const mins = Math.max(0, toMin(periods[c.endPeriod - 1]?.end) - toMin(periods[c.startPeriod - 1]?.start));
      arr[c.weekday - 1] += mins;
    }
    return arr;
  }, [courses, periods]);

  const classMinutes = classByDay.reduce((a, b) => a + b, 0);

  const weekSessions = useMemo(() => {
    const today = new Date();
    const wd = today.getDay() === 0 ? 7 : today.getDay();
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (wd - 1));
    const end = new Date(monday);
    end.setDate(end.getDate() + 7);
    return sessions.filter((s) => s.start >= monday.getTime() && s.start < end.getTime());
  }, [sessions]);

  const studyByDay = useMemo(() => {
    const arr = Array(7).fill(0) as number[];
    const today = new Date();
    const wd = today.getDay() === 0 ? 7 : today.getDay();
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (wd - 1));
    monday.setHours(0, 0, 0, 0);
    for (const s of weekSessions) {
      const idx = Math.floor((s.start - monday.getTime()) / 86400000);
      if (idx >= 0 && idx < 7) arr[idx] += s.minutes;
    }
    return arr;
  }, [weekSessions]);

  const studyMinutes = weekSessions.reduce((sum, s) => sum + s.minutes, 0);
  const activeMinutes = activeStart ? Math.max(0, Math.floor((now - activeStart) / 60000)) : 0;
  const elapsedSec = activeStart ? Math.max(0, Math.floor((now - activeStart) / 1000)) : 0;
  const clock = Math.floor(elapsedSec / 3600) + ":" + String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, "0") + ":" + String(elapsedSec % 60).padStart(2, "0");
  const rate = homework.total ? Math.round((homework.done / homework.total) * 100) : null;
  const maxBar = Math.max(60, ...classByDay, ...studyByDay);

  const toggleStudy = async () => {
    if (activeStart) {
      const s = await stopStudy();
      setActiveStart(null);
      if (s) {
        setSessions((prev) => [...prev, s]);
        Alert.alert("已保存", `本次自习 ${s.minutes} 分钟。`);
      }
    } else {
      setActiveStart(await startStudy());
    }
  };

  const cancel = () => {
    Alert.alert("放弃本次自习", "本次计时不会保存。", [
      { text: "取消", style: "cancel" },
      { text: "放弃", style: "destructive", onPress: async () => { await cancelStudy(); setActiveStart(null); } },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Text style={styles.title}>学习统计</Text>
      <Text style={styles.sub}>第 {currentWeek} 周 · {active?.name ?? "当前课表"}</Text>

      <View style={styles.focusCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.focusLabel}>自习计时</Text>
          <Text style={styles.focusTime}>{activeStart ? clock : "未开始"}</Text>
          <Text style={styles.focusHint}>{activeStart ? "计时中，结束后自动保存" : "开始后切换到其他页面也会继续计时"}</Text>
        </View>
        <Pressable style={[styles.focusBtn, activeStart ? { backgroundColor: colors.danger } : null]} onPress={toggleStudy}>
          <Ionicons name={activeStart ? "stop" : "play"} size={16} color="#FFFFFF" />
          <Text style={styles.focusBtnText}>{activeStart ? "结束" : "开始"}</Text>
        </Pressable>
      </View>
      {activeStart ? <Pressable onPress={cancel} style={styles.cancelRow}><Text style={styles.cancelText}>放弃本次计时</Text></Pressable> : null}

      <View style={styles.grid}>
        <View style={styles.statCard}><Text style={styles.statLabel}>本周课时</Text><Text style={styles.statValue}>{fmtHours(classMinutes)}</Text><Text style={styles.statMeta}>{courses.length} 门课程</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>本周自习</Text><Text style={styles.statValue}>{fmtHours(studyMinutes + activeMinutes)}</Text><Text style={styles.statMeta}>{weekSessions.length} 次记录</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>作业完成率</Text><Text style={styles.statValue}>{rate === null ? "—" : rate + "%"}</Text><Text style={styles.statMeta}>{homework.done}/{homework.total} 已完成</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>逾期作业</Text><Text style={[styles.statValue, homework.overdue > 0 && { color: colors.danger }]}>{homework.overdue}</Text><Text style={styles.statMeta}>待处理</Text></View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHead}>
          <Text style={styles.chartTitle}>本周分布</Text>
          <View style={styles.legend}><View style={[styles.dot, { backgroundColor: colors.brand }]} /><Text style={styles.legendText}>课程</Text><View style={[styles.dot, { backgroundColor: "#10B981" }]} /><Text style={styles.legendText}>自习</Text></View>
        </View>
        <View style={styles.chart}>
          {WEEKDAYS.map((d, i) => (
            <View key={d} style={styles.dayCol}>
              <View style={styles.bars}>
                <View style={[styles.bar, { height: Math.max(2, (classByDay[i] / maxBar) * 92), backgroundColor: colors.brand }]} />
                <View style={[styles.bar, { height: Math.max(2, (studyByDay[i] / maxBar) * 92), backgroundColor: "#10B981" }]} />
              </View>
              <Text style={styles.dayLabel}>{d}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.chartHint}>课程按当前周课表计算；自习时间来自上方计时记录。</Text>
      </View>

      <Text style={styles.footer}>坚持记录，比一次学很久更重要。</Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    title: { fontSize: 24, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
    sub: { fontSize: 11.5, color: colors.faint, marginTop: 5, marginBottom: 16 },
    focusCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 16 },
    focusLabel: { fontSize: 11, color: colors.faint },
    focusTime: { fontSize: 24, fontWeight: "800", color: colors.ink, marginTop: 4, letterSpacing: -0.5 },
    focusHint: { fontSize: 10, color: colors.faint, marginTop: 3 },
    focusBtn: { width: 70, height: 44, borderRadius: 11, backgroundColor: colors.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
    focusBtnText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "600" },
    cancelRow: { alignSelf: "flex-end", paddingVertical: 8 },
    cancelText: { fontSize: 10.5, color: colors.faint },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
    statCard: { width: "48%", flexGrow: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14 },
    statLabel: { fontSize: 10.5, color: colors.faint },
    statValue: { fontSize: 18, fontWeight: "800", color: colors.ink, marginTop: 6, letterSpacing: -0.3 },
    statMeta: { fontSize: 9.5, color: colors.faint, marginTop: 4 },
    chartCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 16, marginTop: 12 },
    chartHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    chartTitle: { fontSize: 13, fontWeight: "700", color: colors.ink },
    legend: { flexDirection: "row", alignItems: "center", gap: 5 },
    dot: { width: 6, height: 6, borderRadius: 3, marginLeft: 5 },
    legendText: { fontSize: 9, color: colors.faint },
    chart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 130, marginTop: 14 },
    dayCol: { flex: 1, alignItems: "center" },
    bars: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 100 },
    bar: { width: 7, borderRadius: 3 },
    dayLabel: { fontSize: 9.5, color: colors.faint, marginTop: 7 },
    chartHint: { fontSize: 9.5, color: colors.faint, lineHeight: 15, marginTop: 10 },
    footer: { fontSize: 10, color: colors.faint, textAlign: "center", marginTop: 20 },
  });