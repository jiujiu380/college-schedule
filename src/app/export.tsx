import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { buildExportHtml, buildIcs, courseOccurrences, coursesForWeek, weekRange } from "../lib/export-schedule";
import { useSchedule } from "../lib/schedule-store";
import { useTheme } from "../lib/theme-context";
import { presetById, tintFor } from "../lib/theme-presets";
import { Colors, radius } from "../theme";
import { WEEKDAYS } from "../lib/time";
import { weekOfDate } from "../lib/timetables";

export default function ExportScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tables, activeId, periods } = useSchedule();
  const active = tables.find((t) => t.id === activeId) ?? tables[0];
  const [week, setWeek] = useState(() => (active ? weekOfDate(active.startDate) : 1));
  const [busy, setBusy] = useState("");
  const shotRef = useRef<any>(null);
  const [gridWidth, setGridWidth] = useState(0);

  const courses = useMemo(() => (active ? coursesForWeek(active, week) : []), [active, week]);
  const rowH = 44;
  const timeW = 34;
  const dayW = gridWidth > 0 ? (gridWidth - timeW) / 7 : 0;

  const shareFile = async (uri: string, mimeType: string) => {
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType });
    else Alert.alert("文件已生成", uri);
  };

  const exportImage = async () => {
    if (!active) return;
    setBusy("image");
    try {
      const uri = await captureRef(shotRef, { format: "png", quality: 1, result: "tmpfile" });
      await shareFile(uri, "image/png");
    } catch (e) {
      Alert.alert("导出失败", String(e instanceof Error ? e.message : e));
    } finally {
      setBusy("");
    }
  };

  const exportPdf = async () => {
    if (!active) return;
    setBusy("pdf");
    try {
      const { uri } = await Print.printToFileAsync({ html: buildExportHtml(active, week, periods) });
      await shareFile(uri, "application/pdf");
    } catch (e) {
      Alert.alert("导出失败", String(e instanceof Error ? e.message : e));
    } finally {
      setBusy("");
    }
  };

  const exportIcs = async () => {
    if (!active) return;
    setBusy("ics");
    try {
      const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!dir) throw new Error("没有可写的临时目录");
      const uri = dir + "zhiku-timetable.ics";
      await FileSystem.writeAsStringAsync(uri, buildIcs(active), { encoding: FileSystem.EncodingType.UTF8 });
      await shareFile(uri, "text/calendar");
    } catch (e) {
      Alert.alert("导出失败", String(e instanceof Error ? e.message : e));
    } finally {
      setBusy("");
    }
  };

  const addToCalendar = async () => {
    if (!active) return;
    if (Platform.OS === "web") {
      Alert.alert("电脑端", "网页版无法直接写入系统日历，请使用「日历文件 .ics」导入日历。");
      return;
    }
    setBusy("calendar");
    try {
      const perm = await Calendar.requestCalendarPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("没有日历权限", "请在系统设置中允许访问日历后重试。");
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const target = calendars.find((c) => c.allowsModifications) ?? calendars[0];
      if (!target) {
        Alert.alert("没有可用日历", "请先在系统日历中创建一个日历。");
        return;
      }
      const monday = new Date(active.startDate + "T00:00:00");
      monday.setDate(monday.getDate() + (week - 1) * 7);
      const end = new Date(monday);
      end.setDate(end.getDate() + 7);
      const occurrences = courseOccurrences(active).filter((o) => o.start >= monday && o.start < end);
      for (const o of occurrences) {
        await Calendar.createEventAsync(target.id, {
          title: o.title,
          startDate: o.start,
          endDate: o.end,
          location: o.location,
          notes: o.notes,
          timeZone: "Asia/Shanghai",
        });
      }
      Alert.alert("已加入日历", `本周 ${occurrences.length} 节课已写入「${target.title}」。`);
    } catch (e) {
      Alert.alert("写入失败", String(e instanceof Error ? e.message : e));
    } finally {
      setBusy("");
    }
  };

  if (!active) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, padding: 30 }}><Text style={{ color: colors.sub }}>还没有课表</Text></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.weekBar}>
        <Pressable style={styles.navBtn} onPress={() => setWeek((w) => Math.max(1, w - 1))}><Ionicons name="chevron-back" size={16} color={colors.ink} /></Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.weekText}>第 {week} 周</Text>
          <Text style={styles.weekSub}>{weekRange(active, week)}</Text>
        </View>
        <Pressable style={styles.navBtn} onPress={() => setWeek((w) => Math.min(active.totalWeeks, w + 1))}><Ionicons name="chevron-forward" size={16} color={colors.ink} /></Pressable>
      </View>

      <View
        ref={shotRef}
        collapsable={false}
        style={styles.paper}
        onLayout={(e) => setGridWidth(e.nativeEvent.layout.width - 28)}
      >
        <Text style={styles.paperTitle}>{active.name}</Text>
        <Text style={styles.paperSub}>第 {week} 周 · {weekRange(active, week)} · {active.courses.length} 门课程</Text>
        <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
          <View style={styles.headRow}>
            <View style={[styles.timeCell, { width: timeW }]}><Text style={styles.headText}>节次</Text></View>
            {WEEKDAYS.map((d) => <View key={d} style={styles.headDay}><Text style={styles.headText}>{d}</Text></View>)}
          </View>
          <View style={{ height: rowH * 10, position: "relative" }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={i} style={[styles.gridRow, { top: i * rowH, height: rowH }]}>
                <View style={[styles.timeCell, { width: timeW }]}>
                  <Text style={styles.periodNo}>第{i + 1}节</Text>
                  <Text style={styles.periodTime}>{periods[i]?.start}</Text>
                </View>
                {WEEKDAYS.map((d) => <View key={d} style={styles.cell} />)}
              </View>
            ))}
            {dayW > 0 && courses.map((c) => {
              const tint = tintFor(presetById(active.themeId), c.id);
              const top = (c.startPeriod - 1) * rowH + 2;
              const height = (c.endPeriod - c.startPeriod + 1) * rowH - 4;
              return (
                <View key={c.id} style={[styles.block, { left: timeW + (c.weekday - 1) * dayW + 2, top, width: dayW - 4, height, backgroundColor: tint.bg }]}>
                  <Text style={[styles.blockName, { color: tint.fg }]} numberOfLines={3}>{c.name}</Text>
                  {c.location ? <Text style={[styles.blockMeta, { color: tint.fg }]} numberOfLines={2}>{c.location}</Text> : null}
                </View>
              );
            })}
          </View>
        </View>
        <Text style={styles.paperFoot}>知酷课程表 · 导出于 {new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={exportImage} disabled={Boolean(busy)}>
          {busy === "image" ? <ActivityIndicator color={colors.brand} /> : <Ionicons name="image-outline" size={18} color={colors.brand} />}
          <Text style={styles.actionText}>导出图片</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={exportPdf} disabled={Boolean(busy)}>
          {busy === "pdf" ? <ActivityIndicator color={colors.brand} /> : <Ionicons name="document-text-outline" size={18} color={colors.brand} />}
          <Text style={styles.actionText}>导出 PDF</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={addToCalendar} disabled={Boolean(busy)}>
          {busy === "calendar" ? <ActivityIndicator color={colors.brand} /> : <Ionicons name="calendar-outline" size={18} color={colors.brand} />}
          <Text style={styles.actionText}>加入系统日历</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={exportIcs} disabled={Boolean(busy)}>
          {busy === "ics" ? <ActivityIndicator color={colors.brand} /> : <Ionicons name="download-outline" size={18} color={colors.brand} />}
          <Text style={styles.actionText}>日历文件 .ics</Text>
        </Pressable>
      </View>
      <Text style={styles.tip}>图片和 PDF 导出的是当前周；「加入系统日历」只写入本周课程；.ics 包含整学期全部课程，可导入任何日历 App。</Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    weekBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12, marginBottom: 12 },
    navBtn: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.chipBg, alignItems: "center", justifyContent: "center" },
    weekText: { fontSize: 15, fontWeight: "700", color: colors.ink },
    weekSub: { fontSize: 10.5, color: colors.faint, marginTop: 3 },
    paper: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E6ECF6" },
    paperTitle: { fontSize: 17, fontWeight: "800", color: "#16233B" },
    paperSub: { fontSize: 10, color: "#5C6B85", marginTop: 4, marginBottom: 10 },
    grid: { width: "100%" },
    headRow: { flexDirection: "row", backgroundColor: "#F3F7FF", borderTopLeftRadius: 6, borderTopRightRadius: 6, overflow: "hidden" },
    headDay: { flex: 1, height: 26, alignItems: "center", justifyContent: "center", borderLeftWidth: 1, borderLeftColor: "#E8EEF8" },
    headText: { fontSize: 9, color: "#1A6DFF", fontWeight: "700" },
    timeCell: { height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "#FAFCFF", borderRightWidth: 1, borderRightColor: "#E8EEF8" },
    periodNo: { fontSize: 8, fontWeight: "600", color: "#16233B" },
    periodTime: { fontSize: 6.5, color: "#8A98B0", marginTop: 2 },
    gridRow: { position: "absolute", left: 0, right: 0, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#EDF2FA" },
    cell: { flex: 1, borderLeftWidth: 1, borderLeftColor: "#EDF2FA" },
    block: { position: "absolute", borderRadius: 4, padding: 3, overflow: "hidden" },
    blockName: { fontSize: 8, fontWeight: "700", lineHeight: 11 },
    blockMeta: { fontSize: 6.5, marginTop: 2, lineHeight: 9, opacity: 0.85 },
    paperFoot: { fontSize: 8, color: "#8A98B0", marginTop: 10, textAlign: "right" },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
    action: { width: "48%", flexGrow: 1, height: 52, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center", gap: 4 },
    actionText: { fontSize: 11.5, color: colors.ink },
    tip: { fontSize: 10.5, color: colors.faint, lineHeight: 17, marginTop: 12 },
  });