import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { currentNow } from "../../lib/clock";
import { useSchedule } from "../../lib/schedule-store";
import { Course } from "../../lib/schedule";
import { useTheme } from "../../lib/theme-context";
import { ROW_GROUPS, WEEKDAYS, currentPeriodNo, formatToday, groupOfPeriod, mondayOfWeek, todayWeekday } from "../../lib/time";
import { Colors, radius } from "../../theme";
import { tintFor } from "../../lib/theme-presets";

const LABEL_W = 54;
const DAY_W = 88;

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { week, setWeek, courses, periods, seasonText, tables, activeTable, activeId, switchTable, addTable, preset, ui, updateTable } = useSchedule();
  const [nowWeekday] = useState(todayWeekday);
  const now = useMemo(() => currentNow(), []);
  const [activeGroup] = useState(() => groupOfPeriod(currentPeriodNo(periods, now)));
  const [periodText] = useState(() => {
    const g = ROW_GROUPS.find((x) => x.key === groupOfPeriod(currentPeriodNo(periods, now)));
    return g ? g.label + " 节" : "课间休息";
  });
  const scrollRef = useRef<any>(null);
  const [viewportW, setViewportW] = useState(0);
  const tableFade = useRef(new Animated.Value(1)).current;
  const [switcher, setSwitcher] = useState(false);

  const ROW_H = ui.rowHeight;

  useEffect(() => {
    if (viewportW <= 0) return;
    scrollRef.current?.scrollTo({ x: Math.max(0, (nowWeekday - 2) * DAY_W), animated: false });
  }, [viewportW, nowWeekday]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(tableFade, { toValue: 0.35, duration: 90, useNativeDriver: true }),
      Animated.timing(tableFade, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [week, tableFade]);

  const monday = useMemo(() => {
    const [y, m, d] = activeTable.startDate.split("-").map(Number);
    const start = new Date(y, (m ?? 1) - 1, d ?? 1);
    const day = new Date(start);
    day.setDate(start.getDate() + (week - 1) * 7);
    return day;
  }, [activeTable.startDate, week]);

  const cellCourses = (day: number, rowPeriods: number[]): Course[] => {
    if (!rowPeriods.length) return [];
    return courses
      .filter((c) => c.weekday === day && c.startPeriod <= rowPeriods[rowPeriods.length - 1] && c.endPeriod >= rowPeriods[0])
      .sort((a, b) => a.startPeriod - b.startPeriod);
  };

  const border = ui.dividers ? colors.line : "transparent";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Pressable style={styles.titleRow} onPress={() => setSwitcher(true)}>
              <Text style={styles.appTitle}>{activeTable.name}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.sub} />
            </Pressable>
            <Text style={styles.dateLine}>{formatToday()} · 第 {week} 周 / 共 {activeTable.totalWeeks} 周</Text>
          </View>
          <Pressable style={styles.refreshBtn} onPress={() => router.push("/import")}>
            <Ionicons name="add" size={14} color={colors.ink} />
            <Text style={styles.refreshText}>导入</Text>
          </Pressable>
        </View>

        <View style={styles.statusLine}>
          <Text style={styles.statusText}>
            当前：<Text style={{ color: colors.ink, fontWeight: "600" }}>{periodText}</Text>
            <Text style={styles.statusDim}>　{seasonText}</Text>
          </Text>
          <View style={styles.weekNav}>
            <Pressable onPress={() => setWeek(week - 1)} hitSlop={8} style={styles.navBtn}><Ionicons name="chevron-back" size={14} color={colors.ink} /></Pressable>
            <Pressable onPress={() => setWeek(week + 1)} hitSlop={8} style={styles.navBtn}><Ionicons name="chevron-forward" size={14} color={colors.ink} /></Pressable>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ flexDirection: "row", backgroundColor: colors.surface, opacity: tableFade }}>
          <View style={{ width: LABEL_W }}>
            <View style={[styles.cornerCell, { borderBottomWidth: 1, borderBottomColor: border }]}>
              <Text style={styles.cornerText}>节次</Text>
            </View>
            {ROW_GROUPS.map((g) => {
              const active = g.key === activeGroup;
              return (
                <View key={g.key} style={[styles.labelCell, { height: g.key === "noon" ? 38 : ROW_H, borderColor: border }, active && { backgroundColor: preset.brand }]}>
                  <Text style={[styles.labelText, active && { color: "#FFFFFF" }]}>{g.label}</Text>
                </View>
              );
            })}
          </View>

          <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} bounces={false} onLayout={(e) => setViewportW(e.nativeEvent.layout.width)}>
            <View style={{ width: DAY_W * 7 }}>
              <View style={{ flexDirection: "row" }}>
                {WEEKDAYS.map((d, i) => {
                  const date = new Date(monday);
                  date.setDate(date.getDate() + i);
                  const isToday = nowWeekday === i + 1;
                  return (
                    <View key={d} style={[styles.dayHead, { width: DAY_W, borderColor: border }, isToday && styles.dayHeadToday]}>
                      <Text style={[styles.dayName, isToday && styles.dayNameToday]}>周{d}{isToday ? "(今天)" : ""}</Text>
                      <Text style={styles.dayDate}>{date.getMonth() + 1}/{date.getDate()}</Text>
                    </View>
                  );
                })}
              </View>

              {ROW_GROUPS.map((g) => {
                const isActiveRow = g.key === activeGroup;
                return (
                  <View key={g.key} style={{ flexDirection: "row" }}>
                    {WEEKDAYS.map((d, i) => {
                      const isTodayCol = nowWeekday === i + 1;
                      const isCross = isTodayCol && isActiveRow;
                      const list = cellCourses(i + 1, g.periods);
                      return (
                        <View
                          key={d}
                          style={[
                            styles.cell,
                            { width: DAY_W, height: g.key === "noon" ? 38 : ROW_H, borderColor: border },
                            isTodayCol && styles.cellToday,
                            isCross && { borderWidth: 2, borderColor: preset.brand },
                          ]}
                        >
                          {list.map((c) => {
                            const tint = tintFor(preset, c.id);
                            const inWeek = c.weeks.includes(week);
                            return (
                              <Pressable
                                key={c.id}
                                style={[
                                  styles.course,
                                  {
                                    backgroundColor: tint.bg,
                                    borderLeftColor: tint.bar,
                                    borderRadius: ui.radius,
                                    opacity: inWeek ? ui.opacity : 0.28,
                                  },
                                ]}
                                onPress={() => router.push(`/course/${c.id}`)}
                              >
                                <Text style={[styles.courseName, { color: tint.fg }]} numberOfLines={2}>{c.name}</Text>
                                {c.location ? <Text style={[styles.courseMeta, { color: tint.fg }]} numberOfLines={1}>@{c.location}</Text> : null}
                                {c.teacher ? <Text style={[styles.courseMeta, { color: tint.fg }]} numberOfLines={1}>{c.teacher}</Text> : null}
                                {!inWeek ? <Text style={[styles.offWeek, { color: tint.fg }]}>非本周</Text> : null}
                              </Pressable>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>

        <Text style={styles.footerHint}>点击课程查看详情 · 非本周课程已淡化 · 数据仅保存在本机</Text>
      </ScrollView>

      <Modal visible={switcher} transparent animationType="fade" onRequestClose={() => setSwitcher(false)}>
        <Pressable style={styles.modalMask} onPress={() => setSwitcher(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={styles.sheetTitle}>我的课表</Text>
            {tables.map((t) => (
              <Pressable
                key={t.id}
                style={[styles.tableRow, activeId === t.id && { backgroundColor: colors.brandSoft }]}
                onPress={() => { switchTable(t.id); setSwitcher(false); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.tableName}>{t.name}</Text>
                  <Text style={styles.tableMeta}>{t.courses.length} 门课程 · {t.totalWeeks} 周</Text>
                </View>
                {activeId === t.id ? <Ionicons name="checkmark" size={18} color={colors.brand} /> : null}
              </Pressable>
            ))}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Pressable style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => { setSwitcher(false); addTable(`课表 ${tables.length + 1}`); }}>
                <Text style={styles.secondaryText}>新建空白课表</Text>
              </Pressable>
              <Pressable style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => { setSwitcher(false); router.push("/settings"); }}>
                <Text style={styles.secondaryText}>管理</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    header: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
    headerTop: { flexDirection: "row", alignItems: "flex-start" },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    appTitle: { fontSize: 20, fontWeight: "700", color: colors.ink, letterSpacing: -0.3 },
    dateLine: { fontSize: 12, color: colors.sub, marginTop: 5 },
    refreshBtn: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm, backgroundColor: colors.chipBg, borderWidth: 1, borderColor: colors.line },
    refreshText: { fontSize: 12.5, color: colors.ink, fontWeight: "600" },
    statusLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
    statusText: { fontSize: 12.5, color: colors.sub },
    statusDim: { fontSize: 12, color: colors.faint },
    weekNav: { flexDirection: "row", gap: 6 },
    navBtn: { width: 28, height: 26, borderRadius: 4, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
    cornerCell: { height: 44, alignItems: "center", justifyContent: "center", backgroundColor: colors.lineSoft, borderRightWidth: 1 },
    cornerText: { fontSize: 11.5, color: colors.sub },
    labelCell: { alignItems: "center", justifyContent: "center", backgroundColor: colors.lineSoft, borderRightWidth: 1, borderBottomWidth: 1 },
    labelText: { fontSize: 12.5, color: colors.ink, fontWeight: "500" },
    dayHead: { height: 44, alignItems: "center", justifyContent: "center", borderRightWidth: 1, borderBottomWidth: 1, backgroundColor: colors.lineSoft, gap: 2 },
    dayHeadToday: { backgroundColor: colors.brandSoft },
    dayName: { fontSize: 12, color: colors.sub, fontWeight: "500" },
    dayNameToday: { color: colors.brand, fontWeight: "700" },
    dayDate: { fontSize: 10, color: colors.faint },
    cell: { borderRightWidth: 1, borderBottomWidth: 1, backgroundColor: colors.surface, padding: 3 },
    cellToday: { backgroundColor: colors.brandSoft + "44" },
    course: { borderLeftWidth: 3, paddingHorizontal: 4, paddingVertical: 4, marginBottom: 3 },
    courseName: { fontSize: 11.5, fontWeight: "600", lineHeight: 15 },
    courseMeta: { fontSize: 9.5, marginTop: 1.5, lineHeight: 12, opacity: 0.85 },
    offWeek: { fontSize: 9, marginTop: 2, opacity: 0.75 },
    footerHint: { fontSize: 11, color: colors.faint, textAlign: "center", marginTop: 14, paddingHorizontal: 20 },
    modalMask: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
    sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 28 },
    sheetTitle: { fontSize: 15, fontWeight: "700", color: colors.ink, marginBottom: 10 },
    tableRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 8, marginBottom: 4 },
    tableName: { fontSize: 14, color: colors.ink, fontWeight: "500" },
    tableMeta: { fontSize: 11, color: colors.faint, marginTop: 3 },
    secondaryBtn: { height: 40, borderRadius: 6, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center" },
    secondaryText: { fontSize: 12.5, color: colors.ink },
  });
