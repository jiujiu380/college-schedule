import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { BOARD_HEIGHT, BOARD_WIDTH, TimetableBoard } from "../components/TimetableBoard";
import { buildIcs, courseOccurrences, coursesForWeek, weekRange } from "../lib/export-schedule";
import { useSchedule } from "../lib/schedule-store";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";
import { WEEKDAYS } from "../lib/time";
import { weekOfDate } from "../lib/timetables";

function formatTime(t?: string): string {
  return t || "";
}

export default function ExportScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tables, activeId, periods, restore } = useSchedule();
  const active = tables.find((t) => t.id === activeId) ?? tables[0];
  const [week, setWeek] = useState(() => (active ? weekOfDate(active.startDate) : 1));
  const [busy, setBusy] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const hiddenRef = useRef<any>(null);

  const weekPeriods = active?.periods?.length ? active.periods : periods;
  const courses = useMemo(() => (active ? coursesForWeek(active, week) : []), [active, week]);
  const scale = Math.max(0.25, Math.min(1, (width - 32) / BOARD_WIDTH));
  const previewW = BOARD_WIDTH * scale;
  const previewH = BOARD_HEIGHT * scale;

  const shareFile = async (uri: string, mimeType: string) => {
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType });
    else Alert.alert("文件已生成", uri);
  };

  const captureBoard = async (result: "tmpfile" | "base64") => {
    if (!active) throw new Error("没有课表");
    if (!hiddenRef.current) throw new Error("导出画布还没准备好，请重试");
    return await captureRef(hiddenRef, { format: "png", quality: 1, result });
  };

  const exportImage = async () => {
    setBusy("image");
    try {
      const uri = await captureBoard("tmpfile");
      await shareFile(uri as string, "image/png");
    } catch (e) {
      Alert.alert("导出失败", String(e instanceof Error ? e.message : e));
    } finally {
      setBusy("");
    }
  };

  const buildPdfHtml = (base64: string) => {
    if (!active) return "";
    const list = active.courses
      .map((c) => '<li><b>' + c.name + "</b> · 周" + WEEKDAYS[c.weekday - 1] + " · 第" + c.startPeriod + "-" + c.endPeriod + "节" + (c.teacher ? " · " + c.teacher : "") + (c.location ? " · " + c.location : "") + "</li>")
      .join("");
    return `<!doctype html><html><head><meta charset="utf-8"><style>
      @page { size: A4 landscape; margin: 8mm; }
      body { font-family: "PingFang SC","Microsoft YaHei",sans-serif; color:#16233B; margin:0; }
      img { width:100%; display:block; }
      h3 { font-size:12px; margin:12px 0 6px; }
      ul { margin:0; padding-left:16px; columns:2; column-gap:24px; font-size:9px; color:#5C6B85; line-height:1.8; }
      li { break-inside:avoid; }
    </style></head><body>
      <img src="data:image/png;base64,${base64}">
      <h3>课程清单</h3><ul>${list}</ul>
    </body></html>`;
  };

  const exportPdf = async () => {
    setBusy("pdf");
    try {
      const base64 = (await captureBoard("base64")) as string;
      const { uri } = await Print.printToFileAsync({ html: buildPdfHtml(base64) });
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

  const openCalendar = () => {
    if (Platform.OS === "web") {
      Alert.alert("电脑端", "网页版无法直接写入系统日历，请使用「日历文件 .ics」导入日历。");
      return;
    }
    setCalendarOpen(true);
  };

  const writeCalendar = async (scope: "week" | "all") => {
    if (!active) return;
    setCalendarOpen(false);
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
      const all = courseOccurrences(active);
      let occurrences = all;
      if (scope === "week") {
        const monday = new Date(active.startDate + "T00:00:00");
        monday.setDate(monday.getDate() + (week - 1) * 7);
        const end = new Date(monday);
        end.setDate(end.getDate() + 7);
        occurrences = all.filter((o) => o.start >= monday && o.start < end);
      }
      if (!occurrences.length) {
        Alert.alert("没有课程", "当前范围里没有可写入的课程。");
        return;
      }
      const limited = occurrences.slice(0, 300);
      for (const o of limited) {
        await Calendar.createEventAsync(target.id, {
          title: o.title,
          startDate: o.start,
          endDate: o.end,
          location: o.location,
          notes: o.notes,
          timeZone: "Asia/Shanghai",
        });
      }
      Alert.alert("已加入日历", scope === "week" ? `本周 ${limited.length} 节课已写入「${target.title}」。` : `整学期 ${limited.length} 节课已写入「${target.title}」。`);
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

      <View style={styles.previewHead}>
        <Text style={styles.previewTitle}>完整周课表</Text>
        <Text style={styles.previewHint}>已按屏幕宽度缩放，导出为 2 倍高清图</Text>
      </View>

      <View style={[styles.previewBox, { height: previewH, width: previewW }]}>
        <View style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, transform: [{ scale }], transformOrigin: "top left" }}>
          <TimetableBoard table={active} week={week} periods={weekPeriods} />
        </View>
      </View>

      <View style={styles.listCard}>
        <Text style={styles.listTitle}>本周课程</Text>
        {courses.length === 0 ? <Text style={styles.empty}>本周没有课程</Text> : null}
        {courses.map((c) => (
          <View key={c.id} style={styles.listRow}>
            <Text style={styles.listDay}>周{WEEKDAYS[c.weekday - 1]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.listName}>{c.name}</Text>
              <Text style={styles.listMeta}>第 {c.startPeriod}-{c.endPeriod} 节 · {formatTime(weekPeriods[c.startPeriod - 1]?.start)}-{formatTime(weekPeriods[c.endPeriod - 1]?.end)}{c.location ? " · " + c.location : ""}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={exportImage} disabled={Boolean(busy)}>
          {busy === "image" ? <ActivityIndicator color={colors.brand} /> : <Ionicons name="image-outline" size={19} color={colors.brand} />}
          <Text style={styles.actionText}>保存图片</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={exportPdf} disabled={Boolean(busy)}>
          {busy === "pdf" ? <ActivityIndicator color={colors.brand} /> : <Ionicons name="document-text-outline" size={19} color={colors.brand} />}
          <Text style={styles.actionText}>导出 PDF</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={openCalendar} disabled={Boolean(busy)}>
          {busy === "calendar" ? <ActivityIndicator color={colors.brand} /> : <Ionicons name="calendar-outline" size={19} color={colors.brand} />}
          <Text style={styles.actionText}>加入系统日历</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={exportIcs} disabled={Boolean(busy)}>
          {busy === "ics" ? <ActivityIndicator color={colors.brand} /> : <Ionicons name="download-outline" size={19} color={colors.brand} />}
          <Text style={styles.actionText}>日历文件 .ics</Text>
        </Pressable>
      </View>

      <Text style={styles.tip}>图片和 PDF 导出当前周，包含完整 7 天和全部节次；「加入系统日历」可以只写本周，也可以写整学期；.ics 包含全部课程。</Text>

      <View pointerEvents="none" style={styles.offscreen}>
        <View ref={hiddenRef} collapsable={false} style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}>
          <TimetableBoard table={active} week={week} periods={weekPeriods} />
        </View>
      </View>

      <Modal visible={calendarOpen} transparent animationType="slide" onRequestClose={() => setCalendarOpen(false)}>
        <View style={styles.mask}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>加入系统日历</Text>
              <Pressable onPress={() => setCalendarOpen(false)}><Ionicons name="close" size={22} color={colors.sub} /></Pressable>
            </View>
            <Text style={styles.sheetHint}>会写入系统默认日历，并带课前 10 分钟提醒。重复写入会产生重复日程。</Text>
            <Pressable style={styles.primary} onPress={() => writeCalendar("week")}>
              <Text style={styles.primaryText}>只写入本周课程</Text>
            </Pressable>
            <Pressable style={styles.ghost} onPress={() => writeCalendar("all")}>
              <Text style={styles.ghostText}>写入整学期全部课程</Text>
            </Pressable>
            <Pressable style={styles.cancel} onPress={() => setCalendarOpen(false)}><Text style={styles.cancelText}>取消</Text></Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    weekBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12, marginBottom: 12 },
    navBtn: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.chipBg, alignItems: "center", justifyContent: "center" },
    weekText: { fontSize: 15, fontWeight: "700", color: colors.ink },
    weekSub: { fontSize: 10.5, color: colors.faint, marginTop: 3 },
    previewHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 },
    previewTitle: { fontSize: 13, fontWeight: "700", color: colors.ink },
    previewHint: { fontSize: 9.5, color: colors.faint },
    previewBox: { alignSelf: "center", borderRadius: 10, backgroundColor: "#FFFFFF", overflow: "hidden", borderWidth: 1, borderColor: colors.line, marginBottom: 12 },
    listCard: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 12 },
    listTitle: { fontSize: 13, fontWeight: "700", color: colors.ink, marginBottom: 6 },
    empty: { fontSize: 11, color: colors.faint, paddingVertical: 8 },
    listRow: { flexDirection: "row", gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.line },
    listDay: { width: 34, fontSize: 10.5, color: colors.brand, fontWeight: "600", paddingTop: 2 },
    listName: { fontSize: 12.5, color: colors.ink, fontWeight: "600" },
    listMeta: { fontSize: 10, color: colors.faint, marginTop: 3 },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    action: { width: "48%", flexGrow: 1, height: 54, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center", gap: 4 },
    actionText: { fontSize: 11.5, color: colors.ink },
    tip: { fontSize: 10.5, color: colors.faint, lineHeight: 17, marginTop: 12 },
    offscreen: { position: "absolute", left: -4000, top: 0, width: BOARD_WIDTH, height: BOARD_HEIGHT },
    mask: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
    sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    sheetTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
    sheetHint: { fontSize: 11.5, color: colors.faint, lineHeight: 18, marginBottom: 14 },
    primary: { height: 46, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "600" },
    ghost: { marginTop: 10, height: 46, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center" },
    ghostText: { fontSize: 13, color: colors.ink },
    cancel: { marginTop: 8, height: 40, alignItems: "center", justifyContent: "center" },
    cancelText: { fontSize: 12.5, color: colors.faint },
  });
