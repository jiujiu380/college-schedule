import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CourseEditor } from "../../components/CourseEditor";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { currentNow } from "../../lib/clock";
import { useSchedule } from "../../lib/schedule-store";
import { Course } from "../../lib/schedule";
import { useTheme } from "../../lib/theme-context";
import { ROW_GROUPS, WEEKDAYS, currentPeriodNo, formatToday, groupOfPeriod, todayWeekday } from "../../lib/time";
import { tintFor } from "../../lib/theme-presets";
import { Colors } from "../../theme";

const LABEL_W = 46;

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { week, setWeek, courses, periods, activeTable, tables, activeId, switchTable, addTable, preset, ui, addCourse, updateCourse } = useSchedule();
  const [editor, setEditor] = useState<{ visible: boolean; course: Course | null; weekday: number; start: number }>({ visible: false, course: null, weekday: 1, start: 1 });
  const [w, setW] = useState(360);
  const [nowWeekday] = useState(todayWeekday);
  const now = useMemo(() => currentNow(), []);
  const activeGroup = useMemo(() => groupOfPeriod(currentPeriodNo(periods, now)), [periods, now]);
  const [switcher, setSwitcher] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  const dark = scheme === "dark";
  const colW = Math.max(40, (w - LABEL_W) / 7);
  const rowH = ui.rowHeight;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0.45, duration: 80, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [week, activeId, fade]);

  const monday = useMemo(() => {
    const [y, m, d] = activeTable.startDate.split("-").map(Number);
    const start = new Date(y, (m ?? 1) - 1, d ?? 1);
    start.setDate(start.getDate() + (week - 1) * 7);
    return start;
  }, [activeTable.startDate, week]);

  const cellCourses = (day: number, rowPeriods: number[]): Course[] => {
    if (!rowPeriods.length) return [];
    return courses
      .filter((c) => c.weekday === day && c.startPeriod <= rowPeriods[rowPeriods.length - 1] && c.endPeriod >= rowPeriods[0])
      .sort((a, b) => a.startPeriod - b.startPeriod);
  };

  const empty = courses.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} onLayout={(e) => { const v = e.nativeEvent.layout.width; if (Math.abs(v - w) > 1) setW(v); }}>
      <ScreenStatusBar style={dark ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.titleRow}>
          <Pressable style={styles.tableTitle} onPress={() => setSwitcher(true)}>
            <Text style={styles.title} numberOfLines={1}>{activeTable.name}</Text>
            <Ionicons name="chevron-down" size={15} color={colors.sub} />
          </Pressable>
          <Pressable style={styles.importBtn} onPress={() => router.push("/import")}>
            <Ionicons name="add" size={15} color={colors.brand} />
            <Text style={styles.importText}>导入</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>{formatToday()} · 共 {activeTable.totalWeeks} 周</Text>

        <View style={styles.weekBar}>
          <Pressable style={styles.navBtn} onPress={() => setWeek(week - 1)} hitSlop={6}>
            <Ionicons name="chevron-back" size={16} color={colors.ink} />
          </Pressable>
          <View style={styles.weekCenter}>
            <Text style={styles.weekText}>第 {week} 周</Text>
            <Text style={styles.weekRange}>{monday.getMonth() + 1}/{monday.getDate()} - {new Date(monday.getTime() + 6 * 86400000).getMonth() + 1}/{new Date(monday.getTime() + 6 * 86400000).getDate()}</Text>
          </View>
          <Pressable style={styles.navBtn} onPress={() => setWeek(week + 1)} hitSlop={6}>
            <Ionicons name="chevron-forward" size={16} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      {empty ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="calendar-outline" size={28} color={colors.brand} /></View>
          <Text style={styles.emptyTitle}>还没有课程</Text>
          <Text style={styles.emptyText}>从教务网页导入，或粘贴源码 / CSV 建立你的第一张课表</Text>
          <Pressable style={styles.emptyPrimary} onPress={() => router.push("/import")}>
            <Text style={styles.emptyPrimaryText}>导入课表</Text>
          </Pressable>
          <Pressable style={styles.emptyGhost} onPress={() => { addTable("课表 1"); router.push("/periods"); }}>
            <Text style={styles.emptyGhostText}>新建空白课表</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.board, { opacity: fade }]}>
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: LABEL_W }} />
              {WEEKDAYS.map((d, i) => {
                const date = new Date(monday);
                date.setDate(date.getDate() + i);
                const isToday = nowWeekday === i + 1;
                return (
                  <View key={d} style={[styles.dayHead, { width: colW }, isToday && styles.dayHeadToday]}>
                    <Text style={[styles.dayName, isToday && { color: colors.brand }]}>周{d}</Text>
                    <Text style={styles.dayDate}>{date.getDate()}</Text>
                  </View>
                );
              })}
            </View>

            {ROW_GROUPS.map((g) => {
              const isActiveRow = g.key === activeGroup;
              return (
                <View key={g.key} style={{ flexDirection: "row" }}>
                  <View style={[styles.labelCell, { width: LABEL_W, height: rowH }, isActiveRow && { backgroundColor: colors.brand }]}>
                    <Text style={[styles.labelText, isActiveRow && { color: "#FFFFFF" }]}>{g.label}</Text>
                  </View>
                  {WEEKDAYS.map((d, i) => {
                    const isToday = nowWeekday === i + 1;
                    const isCross = isToday && isActiveRow;
                    const list = cellCourses(i + 1, g.periods);
                    return (
                      <Pressable
                        key={d}
                        onLongPress={() => setEditor({ visible: true, course: null, weekday: i + 1, start: g.periods[0] })}
                        delayLongPress={320}
                        style={[styles.cell, { width: colW, height: rowH }, isToday && styles.cellToday, isCross && { borderWidth: 2, borderColor: colors.brand }, list.length > 1 && { borderWidth: 1.5, borderColor: colors.danger }]}
                      >
                        {list.length > 1 ? <Text style={styles.conflictTag}>冲突</Text> : null}
                        {list.map((c) => {
                          const tint = tintFor(preset, c.id);
                          const inWeek = c.weeks.includes(week);
                          return (
                            <Pressable
                              key={c.id}
                              style={[styles.course, { backgroundColor: dark ? "#232A38" : tint.bg, borderLeftColor: tint.bar, borderRadius: ui.radius, opacity: inWeek ? ui.opacity : 0.35 }]}
                              onPress={() => router.push(`/course/${c.id}`)}
                              onLongPress={() => setEditor({ visible: true, course: c, weekday: c.weekday, start: c.startPeriod })}
                              delayLongPress={320}
                            >
                              <Text style={[styles.courseName, { color: dark ? colors.ink : tint.fg }]} numberOfLines={2}>{c.name}</Text>
                              {c.location ? <Text style={[styles.courseMeta, { color: dark ? colors.sub : tint.fg }]} numberOfLines={1}>{c.location}</Text> : null}
                              {c.teacher ? <Text style={[styles.courseMeta, { color: dark ? colors.faint : tint.fg }]} numberOfLines={1}>{c.teacher}</Text> : null}
                              {!inWeek ? <Text style={[styles.offWeek, { color: dark ? colors.faint : tint.fg }]}>非本周</Text> : null}
                            </Pressable>
                          );
                        })}
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </Animated.View>
          <Text style={styles.footerHint}>点击课程查看详情 · 非本周课程已淡化</Text>
        </ScrollView>
      )}

      <CourseEditor
        visible={editor.visible}
        initial={editor.course}
        defaultWeekday={editor.weekday}
        defaultStart={editor.start}
        onClose={() => setEditor((e) => ({ ...e, visible: false }))}
        onSubmit={(course) => {
          if (editor.course) updateCourse(course);
          else addCourse(course);
          setEditor((e) => ({ ...e, visible: false }));
        }}
      />

      <Modal visible={switcher} transparent animationType="fade" onRequestClose={() => setSwitcher(false)}>
        <Pressable style={styles.mask} onPress={() => setSwitcher(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={styles.sheetTitle}>我的课表</Text>
            {tables.map((t) => (
              <Pressable key={t.id} style={[styles.tableRow, activeId === t.id && { backgroundColor: colors.brandSoft }]} onPress={() => { switchTable(t.id); setSwitcher(false); }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tableName}>{t.name}</Text>
                  <Text style={styles.tableMeta}>{t.courses.length} 门课程 · {t.totalWeeks} 周</Text>
                </View>
                {activeId === t.id ? <Ionicons name="checkmark" size={18} color={colors.brand} /> : null}
              </Pressable>
            ))}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Pressable style={styles.secondaryBtn} onPress={() => { setSwitcher(false); addTable(`课表 ${tables.length + 1}`); }}>
                <Text style={styles.secondaryText}>新建空白课表</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => { setSwitcher(false); router.push("/settings"); }}>
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
    header: { paddingHorizontal: 16, paddingBottom: 12 },
    titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    tableTitle: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
    title: { fontSize: 24, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
    importBtn: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.brandSoft },
    importText: { fontSize: 12.5, color: colors.brand, fontWeight: "600" },
    subtitle: { fontSize: 12, color: colors.faint, marginTop: 5 },
    weekBar: { flexDirection: "row", alignItems: "center", marginTop: 14, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 6 },
    navBtn: { width: 34, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 8 },
    weekCenter: { flex: 1, alignItems: "center" },
    weekText: { fontSize: 15, fontWeight: "700", color: colors.ink },
    weekRange: { fontSize: 10.5, color: colors.faint, marginTop: 2 },
    board: { marginTop: 8, backgroundColor: colors.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
    dayHead: { height: 42, alignItems: "center", justifyContent: "center", gap: 2 },
    dayHeadToday: { backgroundColor: colors.brandSoft },
    dayName: { fontSize: 11, color: colors.sub, fontWeight: "500" },
    dayDate: { fontSize: 13, fontWeight: "700", color: colors.ink },
    labelCell: { alignItems: "center", justifyContent: "center", borderTopWidth: 1, borderRightWidth: 1, borderColor: colors.line, backgroundColor: colors.lineSoft },
    labelText: { fontSize: 12, color: colors.sub, fontWeight: "500" },
    cell: { borderTopWidth: 1, borderRightWidth: 1, borderColor: colors.line, padding: 2.5, backgroundColor: colors.surface },
    cellToday: { backgroundColor: colors.brandSoft + "55" },
    course: { flex: 1, borderLeftWidth: 2.5, paddingHorizontal: 3, paddingVertical: 4, marginBottom: 2, overflow: "hidden" },
    courseName: { fontSize: 11, fontWeight: "700", lineHeight: 14 },
    courseMeta: { fontSize: 8.5, marginTop: 1, lineHeight: 11, opacity: 0.9 },
    offWeek: { fontSize: 9, marginTop: 2 },
    conflictTag: { position: "absolute", top: 1, right: 1, fontSize: 8, color: "#FFFFFF", backgroundColor: colors.danger, paddingHorizontal: 3, paddingVertical: 1, borderRadius: 3, zIndex: 2 },
    footerHint: { fontSize: 11, color: colors.faint, textAlign: "center", marginTop: 12 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, paddingBottom: 60 },
    emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.ink, marginTop: 16 },
    emptyText: { fontSize: 12.5, color: colors.sub, textAlign: "center", lineHeight: 19, marginTop: 8 },
    emptyPrimary: { marginTop: 22, width: "80%", height: 44, borderRadius: 10, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    emptyPrimaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    emptyGhost: { marginTop: 10, width: "80%", height: 42, borderRadius: 10, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center" },
    emptyGhostText: { fontSize: 13, color: colors.ink },
    mask: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, paddingBottom: 28 },
    sheetTitle: { fontSize: 15, fontWeight: "700", color: colors.ink, marginBottom: 10 },
    tableRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 4 },
    tableName: { fontSize: 14, color: colors.ink, fontWeight: "500" },
    tableMeta: { fontSize: 11, color: colors.faint, marginTop: 3 },
    secondaryBtn: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center" },
    secondaryText: { fontSize: 12.5, color: colors.ink },
  });