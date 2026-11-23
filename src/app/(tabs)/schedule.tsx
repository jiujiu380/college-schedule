import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CourseEditor } from "../../components/CourseEditor";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { currentNow } from "../../lib/clock";
import { useSchedule } from "../../lib/schedule-store";
import { weekOfDate } from "../../lib/timetables";
import { useGlobalRefresh, useRefreshTask } from "../../lib/app-refresh";
import { writeWidgetData } from "../../lib/widget-data";
import { Course } from "../../lib/schedule";
import { useTheme } from "../../lib/theme-context";
import { currentPeriodNo, formatToday, todayWeekday, WEEKDAYS } from "../../lib/time";
import { tintFor } from "../../lib/theme-presets";
import { Colors } from "../../theme";

const LABEL_W = 54;
const DAYS = 10;

type Block = { course: Course; lane: number; lanes: number };

function layoutDay(list: Course[]): Block[] {
  const sorted = [...list].sort((a, b) => a.startPeriod - b.startPeriod);
  const clusters: Course[][] = [];
  let cur: Course[] = [];
  let end = 0;
  for (const c of sorted) {
    if (!cur.length || c.startPeriod <= end) {
      cur.push(c);
      end = Math.max(end, c.endPeriod);
    } else {
      clusters.push(cur);
      cur = [c];
      end = c.endPeriod;
    }
  }
  if (cur.length) clusters.push(cur);

  const blocks: Block[] = [];
  for (const cluster of clusters) {
    const lanes: Course[][] = [];
    for (const c of cluster) {
      let placed = false;
      for (const lane of lanes) {
        if (lane[lane.length - 1].endPeriod < c.startPeriod) {
          lane.push(c);
          placed = true;
          break;
        }
      }
      if (!placed) lanes.push([c]);
    }
    lanes.forEach((items, li) => items.forEach((course) => blocks.push({ course, lane: li, lanes: lanes.length })));
  }
  return blocks;
}

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { week, setWeek, courses, periods, activeTable, tables, activeId, switchTable, addTable, preset, ui, addCourse, updateCourse } = useSchedule();
  const [w, setW] = useState(360);
  const [nowWeekday] = useState(todayWeekday);
  const now = useMemo(() => currentNow(), []);
  const activeGroup = useMemo(() => currentPeriodNo(periods, now), [periods, now]);
  const [switcher, setSwitcher] = useState(false);
  const [editor, setEditor] = useState<{ visible: boolean; course: Course | null; weekday: number; start: number }>({ visible: false, course: null, weekday: 1, start: 1 });
  const [bubble, setBubble] = useState<{ day: number; period: number } | null>(null);
  const fade = useRef(new Animated.Value(1)).current;
  const { refreshing, refresh } = useGlobalRefresh();

  const syncWidget = useCallback(async () => {
    await writeWidgetData({
      tableName: activeTable.name,
      week,
      courses: activeTable.courses,
      periods: activeTable.periods,
      startDate: activeTable.startDate,
    });
  }, [activeTable, week]);
  useRefreshTask(syncWidget);

  const dark = scheme === "dark";
  const colW = Math.max(38, (w - LABEL_W) / 7);
  const rowH = ui.rowHeight;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0.45, duration: 80, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [week, activeId, fade]);

  const monday = useMemo(() => {
    const [y, m, d] = activeTable.startDate.split("-").map(Number);
    const date = new Date(y, (m ?? 1) - 1, d ?? 1);
    date.setDate(date.getDate() + (week - 1) * 7);
    return date;
  }, [activeTable.startDate, week]);

  const currentWeek = useMemo(() => weekOfDate(activeTable.startDate), [activeTable.startDate]);
  const isPastCourse = useCallback(
    (c: Course) => week === currentWeek && (c.weekday < nowWeekday || (c.weekday === nowWeekday && c.endPeriod < (activeGroup ?? 0))),
    [week, currentWeek, nowWeekday, activeGroup],
  );

  const moves = useMemo(() => activeTable.moves ?? [], [activeTable.moves]);
  const active = useMemo(() => {
    const movedOut = new Set(moves.filter((m) => m.fromWeek === week).map((m) => m.courseId));
    const base = courses.filter((c) => c.weeks.includes(week) && !movedOut.has(c.id));
    const movedIn = moves
      .filter((m) => m.toWeek === week)
      .map((m) => {
        const origin = courses.find((c) => c.id === m.courseId);
        if (!origin) return null;
        return {
          ...origin,
          id: origin.id + "@move@" + m.id,
          weekday: m.toWeekday,
          startPeriod: m.toStart,
          endPeriod: m.toEnd,
          weeks: [week],
        };
      })
      .filter((c): c is Course => Boolean(c));
    return [...base, ...movedIn];
  }, [courses, week, moves]);
  const offWeek = useMemo(() => courses.filter((c) => !c.weeks.includes(week)), [courses, week]);

  const blocksByDay = useMemo(() => WEEKDAYS.map((_, i) => layoutDay(active.filter((c) => c.weekday === i + 1))), [active]);

  const offBlocksByDay = useMemo(
    () =>
      WEEKDAYS.map((_, i) =>
        offWeek.filter(
          (c) => c.weekday === i + 1 && !active.some((a) => a.weekday === i + 1 && a.startPeriod <= c.endPeriod && a.endPeriod >= c.startPeriod),
        ),
      ),
    [offWeek, active],
  );

  const conflictCells = useMemo(() => {
    const set = new Set<string>();
    WEEKDAYS.forEach((_, i) => {
      const day = active.filter((c) => c.weekday === i + 1);
      for (let p = 1; p <= DAYS; p++) {
        if (day.filter((c) => c.startPeriod <= p && c.endPeriod >= p).length > 1) set.add(`${i + 1}-${p}`);
      }
    });
    return set;
  }, [active]);

  const empty = courses.length === 0;
  const border = ui.dividers ? colors.line : "transparent";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} onLayout={(e) => { const v = e.nativeEvent.layout.width; if (Math.abs(v - w) > 1) setW(v); }}>
      <ScreenStatusBar style={dark ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.titleRow}>
          <Pressable style={styles.tableTitle} onPress={() => setSwitcher(true)}>
            <Text style={styles.title} numberOfLines={1}>{activeTable.name}</Text>
            <Ionicons name="chevron-down" size={15} color={colors.sub} style={{ marginLeft: 2 }} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable style={styles.importBtn} onPress={() => router.push("/import")}>
              <Ionicons name="add" size={15} color={colors.brand} />
              <Text style={styles.importText}>导入</Text>
            </Pressable>
            <Pressable style={styles.todayBtn} onPress={() => setWeek(currentWeek)}>
              <Text style={styles.todayText}>今日</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.subtitle}>{formatToday()} · 共 {activeTable.totalWeeks} 周</Text>

        <View style={styles.weekBar}>
          <Pressable style={styles.navBtn} onPress={() => setWeek(week - 1)} hitSlop={6}><Ionicons name="chevron-back" size={16} color={colors.ink} /></Pressable>
          <View style={styles.weekCenter}>
            <Text style={styles.weekText}>第 {week} 周</Text>
            <Text style={styles.weekRange}>{monday.getMonth() + 1}/{monday.getDate()} - {new Date(monday.getTime() + 6 * 86400000).getMonth() + 1}/{new Date(monday.getTime() + 6 * 86400000).getDate()}</Text>
          </View>
          <Pressable style={styles.navBtn} onPress={() => setWeek(week + 1)} hitSlop={6}><Ionicons name="chevron-forward" size={16} color={colors.ink} /></Pressable>
        </View>
      </View>

      {empty ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="calendar-outline" size={28} color={colors.brand} /></View>
          <Text style={styles.emptyTitle}>还没有课程</Text>
          <Text style={styles.emptyText}>从教务网页导入，或粘贴源码 / CSV 建立你的第一张课表</Text>
          <Pressable style={styles.emptyPrimary} onPress={() => router.push("/import")}><Text style={styles.emptyPrimaryText}>导入课表</Text></Pressable>
          <Pressable style={styles.emptyGhost} onPress={() => { addTable("课表 1"); router.push("/periods"); }}><Text style={styles.emptyGhostText}>新建空白课表</Text></Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 108 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} colors={[colors.brand]} />}
        >
          <Animated.View style={{ opacity: fade }}>
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

            <View style={{ position: "relative", height: rowH * DAYS }}>
              {Array.from({ length: DAYS }).map((_, pIdx) => {
                const p = pIdx + 1;
                const isActiveRow = activeGroup === p;
                return (
                  <View key={p} style={{ flexDirection: "row", height: rowH }}>
                    <View style={[styles.labelCell, { width: LABEL_W }, isActiveRow && { backgroundColor: colors.brand }]}>
                      <Text style={[styles.labelText, isActiveRow && { color: "#FFFFFF" }]}>第{p}节</Text>
                      <Text style={[styles.labelTime, isActiveRow && { color: "rgba(255,255,255,0.85)" }]}>
                        {periods[p - 1]?.start ?? ""}-{periods[p - 1]?.end ?? ""}
                      </Text>
                    </View>
                    {WEEKDAYS.map((d, i) => {
                      const isToday = nowWeekday === i + 1;
                      const conflict = conflictCells.has(`${i + 1}-${p}`);
                      return (
                        <Pressable
                          key={d}
                          onLongPress={() => setEditor({ visible: true, course: null, weekday: i + 1, start: p })}
                          delayLongPress={320}
                          style={[styles.cell, { width: colW, borderColor: border }, isToday && styles.cellToday, conflict && { backgroundColor: colors.danger + "14" }]}
                        >
                          {conflict ? <View style={styles.conflictDot} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}

              <View style={{ position: "absolute", left: LABEL_W, top: 0, width: colW * 7, height: rowH * DAYS }} pointerEvents="box-none">
                {blocksByDay.map((blocks, dayIdx) =>
                  blocks.map((b) => {
                    const tint = tintFor(preset, b.course.id);
                    const laneW = colW / b.lanes;
                    const ended = isPastCourse(b.course);
                    return (
                      <Pressable
                        key={b.course.id + "-" + b.lane}
                        onPress={() => router.push(`/course/${b.course.id}`)}
                        onLongPress={() => setEditor({ visible: true, course: b.course, weekday: b.course.weekday, start: b.course.startPeriod })}
                        delayLongPress={320}
                        style={[
                          styles.block,
                          {
                            left: dayIdx * colW + b.lane * laneW + 1.5,
                            top: (b.course.startPeriod - 1) * rowH + 2,
                            width: Math.max(18, laneW - 3),
                            height: (b.course.endPeriod - b.course.startPeriod + 1) * rowH - 4,
                            backgroundColor: dark ? "#232A38" : tint.bg,
                            borderLeftColor: tint.bar,
                            borderRadius: ui.radius,
                            opacity: ui.opacity * (ended ? 0.42 : 1),
                          },
                        ]}
                      >
                        <Text style={[styles.courseName, { color: ended ? colors.faint : dark ? colors.ink : tint.fg }]} numberOfLines={3}>{b.course.name}</Text>
                        {b.course.location ? <Text style={[styles.courseMeta, { color: ended ? colors.faint : dark ? colors.sub : tint.fg }]} numberOfLines={3}>{b.course.location}</Text> : null}
                        {b.course.teacher ? <Text style={[styles.courseMeta, { color: ended ? colors.faint : dark ? colors.faint : tint.fg }]} numberOfLines={2}>{b.course.teacher}</Text> : null}
                      </Pressable>
                    );
                  }),
                )}
                {offWeek.map((c) => {
                  const overlapsActive = active.some(
                    (a) => a.weekday === c.weekday && a.startPeriod <= c.endPeriod && a.endPeriod >= c.startPeriod,
                  );
                  if (!overlapsActive) return null;
                  const span = c.endPeriod - c.startPeriod + 1;
                  return (
                    <Pressable
                      key={"bubble-" + c.id}
                      onPress={() => setBubble({ day: c.weekday, period: c.startPeriod })}
                      style={[styles.bubble, { left: (c.weekday - 1) * colW + colW - 22, top: (c.startPeriod - 1) * rowH + 4 }]}
                    >
                      <Text style={styles.bubbleText}>{span}</Text>
                    </Pressable>
                  );
                })}
                {offBlocksByDay.map((blocks, dayIdx) =>
                  blocks.map((c) => {
                    const tint = tintFor(preset, c.id);
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => router.push(`/course/${c.id}`)}
                        style={[
                          styles.block,
                          {
                            left: dayIdx * colW + 1.5,
                            top: (c.startPeriod - 1) * rowH + 2,
                            width: colW - 3,
                            height: (c.endPeriod - c.startPeriod + 1) * rowH - 4,
                            backgroundColor: dark ? "#1B2029" : tint.bg,
                            borderLeftColor: colors.faint,
                            borderRadius: ui.radius,
                            opacity: 0.4,
                          },
                        ]}
                      >
                        <Text style={[styles.courseName, { color: dark ? colors.faint : tint.fg }]} numberOfLines={2}>{c.name}</Text>
                        <Text style={[styles.offWeek, { color: dark ? colors.faint : tint.fg }]}>非本周</Text>
                      </Pressable>
                    );
                  }),
                )}
              </View>
            </View>
          </Animated.View>
          <Text style={styles.footerHint}>长按空白格添加 · 长按课程编辑 · 非本周课程已淡化</Text>
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

      <Modal visible={bubble !== null} transparent animationType="fade" onRequestClose={() => setBubble(null)}>
        <Pressable style={styles.mask} onPress={() => setBubble(null)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={styles.sheetTitle}>
              {bubble ? `周${WEEKDAYS[bubble.day - 1]} 第${bubble.period}节` : ""}
            </Text>
            {bubble
              ? courses
                  .filter((c) => c.weekday === bubble.day && c.startPeriod <= bubble.period && c.endPeriod >= bubble.period)
                  .sort((a, b) => (a.weeks.includes(week) === b.weeks.includes(week) ? 0 : a.weeks.includes(week) ? -1 : 1))
                  .map((c) => {
                    const inWeek = c.weeks.includes(week);
                    return (
                      <Pressable
                        key={c.id}
                        style={[styles.listRow, !inWeek && { opacity: 0.6 }]}
                        onPress={() => { setBubble(null); router.push(`/course/${c.id}`); }}
                      >
                        <View style={[styles.listDot, { backgroundColor: inWeek ? colors.brand : colors.faint }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listName}>{c.name}</Text>
                          <Text style={styles.listMeta}>{c.startPeriod}-{c.endPeriod} 节 · {inWeek ? "本周" : "非本周"}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color={colors.faint} />
                      </Pressable>
                    );
                  })
              : null}
            <Pressable style={styles.secondaryBtn} onPress={() => setBubble(null)}>
              <Text style={styles.secondaryText}>关闭</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

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
              <Pressable style={styles.secondaryBtn} onPress={() => { setSwitcher(false); addTable(`课表 ${tables.length + 1}`); }}><Text style={styles.secondaryText}>新建空白课表</Text></Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => { setSwitcher(false); router.push("/settings"); }}><Text style={styles.secondaryText}>管理</Text></Pressable>
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
    titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    headerActions: { alignItems: "flex-end", gap: 6, flexShrink: 0 },
    todayBtn: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7, backgroundColor: colors.chipBg },
    todayText: { fontSize: 10.5, color: colors.sub, fontWeight: "500" },
    tableTitle: { flexDirection: "row", alignItems: "center", gap: 2, flex: 1, minWidth: 0 },
    title: { fontSize: 22, fontWeight: "800", color: colors.ink, letterSpacing: -0.5, flexShrink: 1 },
    importBtn: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.brandSoft },
    importText: { fontSize: 12.5, color: colors.brand, fontWeight: "600" },
    subtitle: { fontSize: 12, color: colors.faint, marginTop: 5 },
    weekBar: { flexDirection: "row", alignItems: "center", marginTop: 14, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 6 },
    navBtn: { width: 34, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 8 },
    weekCenter: { flex: 1, alignItems: "center" },
    weekText: { fontSize: 15, fontWeight: "700", color: colors.ink },
    weekRange: { fontSize: 10.5, color: colors.faint, marginTop: 2 },
    dayHead: { height: 42, alignItems: "center", justifyContent: "center", gap: 2 },
    dayHeadToday: { backgroundColor: colors.brandSoft },
    dayName: { fontSize: 11, color: colors.sub, fontWeight: "500" },
    dayDate: { fontSize: 13, fontWeight: "700", color: colors.ink },
    labelCell: { alignItems: "center", justifyContent: "center", borderTopWidth: 1, borderRightWidth: 1, borderColor: colors.line, backgroundColor: colors.lineSoft },
    labelText: { fontSize: 10.5, color: colors.sub, fontWeight: "500" },
    cell: { borderTopWidth: 1, borderRightWidth: 1, backgroundColor: colors.surface, padding: 2 },
    cellToday: { backgroundColor: colors.brandSoft + "55" },
    conflictDot: { position: "absolute", top: 3, right: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.danger },
    block: { position: "absolute", borderLeftWidth: 2.5, paddingHorizontal: 3, paddingVertical: 3, overflow: "hidden", justifyContent: "center" },
    courseName: { fontSize: 10.5, fontWeight: "700", lineHeight: 13.5 },
    courseMeta: { fontSize: 7.8, marginTop: 1, lineHeight: 10, opacity: 0.9 },
    offWeek: { fontSize: 8.5, marginTop: 1 },
    labelTime: { fontSize: 8, color: colors.faint, marginTop: 2 },
    bubble: { position: "absolute", width: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center", zIndex: 5 },
    bubbleText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
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
    listRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
    listDot: { width: 7, height: 7, borderRadius: 4 },
    listName: { fontSize: 14, color: colors.ink, fontWeight: "500" },
    listMeta: { fontSize: 11, color: colors.faint, marginTop: 3 },
  });