import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { useAuth } from "../../lib/auth";
import { currentNow } from "../../lib/clock";
import { useSchedule } from "../../lib/schedule-store";
import { Course } from "../../lib/schedule";
import { useTheme } from "../../lib/theme-context";
import { ROW_GROUPS, WEEKDAYS, currentPeriodNo, formatToday, groupOfPeriod, mondayOfWeek, todayWeekday, weekOf } from "../../lib/time";
import { Colors, courseTint, radius } from "../../theme";

const LABEL_W = 54;
const DAY_W = 88;
const ROW_H = 100;

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { studentId } = useAuth();
  const { week, setWeek, courses, periods, seasonText, source, staticMeta } = useSchedule();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [nowWeekday] = useState(todayWeekday);
  const now = useMemo(() => currentNow(), []);
  const currentWeek = useMemo(() => weekOf(now), [now]);
  const [activeGroup] = useState(() => groupOfPeriod(currentPeriodNo(periods, now)));
  const [periodText] = useState(() => {
    const g = ROW_GROUPS.find((x) => x.key === groupOfPeriod(currentPeriodNo(periods, now)));
    return g ? g.label + " 节" : "课间休息";
  });
  const scrollRef = useRef<any>(null);
  const [viewportW, setViewportW] = useState(0);
  const tableFade = useRef(new Animated.Value(1)).current;

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

  const weekCourses = useMemo(() => courses.filter((c) => c.weeks.includes(week)), [courses, week]);

  const cellCourses = (day: number, rowPeriods: number[]): Course[] => {
    if (!rowPeriods.length) return [];
    return weekCourses
      .filter((c) => c.weekday === day && c.startPeriod <= rowPeriods[rowPeriods.length - 1] && c.endPeriod >= rowPeriods[0])
      .sort((a, b) => a.startPeriod - b.startPeriod);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>课表</Text>
            <Text style={styles.dateLine}>{formatToday()}</Text>
          </View>
          <Pressable style={styles.refreshBtn} onPress={() => Alert.alert("已刷新", "课表数据已更新至当前周次。")}>
            <Text style={styles.refreshText}>刷新</Text>
          </Pressable>
        </View>

        <View style={styles.statusLine}>
          <Text style={styles.statusText}>
            当前：<Text style={{ color: colors.ink, fontWeight: "600" }}>{periodText}</Text>
            <Text style={styles.statusDim}>　第 {week} 周</Text>
          </Text>
          <View style={styles.seasonTag}>
            <Text style={styles.seasonText}>{seasonText}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar}>
          <Chip label="本周实时课表" active colors={colors} styles={styles} onPress={() => {}} />
          <Chip label="原始课表" colors={colors} styles={styles} onPress={() => Alert.alert("提示", "原始课表视图即将开放。")} />
          <Chip label="查其他班级" colors={colors} styles={styles} onPress={() => Alert.alert("提示", "跨班级查询需要教务系统接口权限。")} />
          <Chip label="回到今天" icon="refresh-outline" colors={colors} styles={styles} onPress={() => setWeek(currentWeek)} />
          <Chip label="上一周" icon="chevron-back" colors={colors} styles={styles} onPress={() => setWeek(week - 1)} />
          <Chip label="下一周" icon="chevron-forward" colors={colors} styles={styles} onPress={() => setWeek(week + 1)} />
        </ScrollView>
      </View>

      {source === "static" ? (
        <Pressable style={styles.banner} onPress={() => router.push("/import")}>
          <Ionicons name="cloud-offline-outline" size={14} color={colors.warnText} />
          <Text style={styles.bannerText} numberOfLines={1}>静态课表 · {staticMeta?.count ?? courses.length} 门 · 非教务实时数据</Text>
          <Text style={styles.bannerAction}>管理</Text>
        </Pressable>
      ) : source === "demo" ? (
        <Pressable style={[styles.banner, styles.bannerDemo]} onPress={() => router.push("/import")}>
          <Ionicons name="flask-outline" size={14} color={colors.sub} />
          <Text style={[styles.bannerText, { color: colors.sub }]} numberOfLines={1}>当前为演示数据，可导入静态课表或接入教务接口</Text>
          <Text style={[styles.bannerAction, { color: colors.sub }]}>导入</Text>
        </Pressable>
      ) : null}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ flexDirection: "row", backgroundColor: colors.surface, opacity: tableFade }}>
          <View style={{ width: LABEL_W }}>
            <View style={[styles.cornerCell, { borderBottomWidth: 1 }]}>
              <Text style={styles.cornerText}>节次</Text>
            </View>
            {ROW_GROUPS.map((g) => {
              const active = g.key === activeGroup;
              return (
                <View key={g.key} style={[styles.labelCell, { height: g.key === "noon" ? 38 : ROW_H }, active && { backgroundColor: colors.brand }]}>
                  <Text style={[styles.labelText, active && { color: "#FFFFFF" }]}>{g.label}</Text>
                </View>
              );
            })}
          </View>

          <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} bounces={false} onLayout={(e) => setViewportW(e.nativeEvent.layout.width)}>
            <View style={{ width: DAY_W * 7 }}>
              <View style={{ flexDirection: "row" }}>
                {WEEKDAYS.map((d, i) => {
                  const date = new Date(mondayOfWeek(week));
                  date.setDate(date.getDate() + i);
                  const isToday = nowWeekday === i + 1;
                  return (
                    <View key={d} style={[styles.dayHead, { width: DAY_W }, isToday && styles.dayHeadToday]}>
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
                            { width: DAY_W, height: g.key === "noon" ? 38 : ROW_H },
                            isTodayCol && styles.cellToday,
                            isActiveRow && styles.cellActiveRow,
                            isCross && styles.cellCross,
                          ]}
                        >
                          {list.map((c) => {
                            const tint = courseTint(c.id, scheme);
                            return (
                              <Pressable
                                key={c.id}
                                style={[styles.course, { backgroundColor: tint.bg, borderLeftColor: tint.bar }]}
                                onPress={() => router.push(`/course/${c.id}`)}
                              >
                                <Text style={[styles.courseName, { color: tint.fg }]} numberOfLines={2}>{c.name}</Text>
                                {c.location ? <Text style={[styles.courseMeta, { color: tint.fg }]} numberOfLines={1}>@{c.location}</Text> : null}
                                {c.teacher ? <Text style={[styles.courseMeta, { color: tint.fg }]} numberOfLines={1}>{c.teacher}</Text> : null}
                              </Pressable>
                            );
                          })}
                          {isCross && list.length === 0 ? (
                            <View style={styles.freeBox}><Text style={styles.freeText}>空闲</Text></View>
                          ) : null}
                          {isCross ? <View style={styles.crossMark} /> : null}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>

        <Text style={styles.footerHint}>点击课程查看详情 · 左右滑动查看周末 · 数据来源：{studentId ?? "演示账号"}</Text>
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  active,
  icon,
  onPress,
  colors,
  styles,
}: {
  label: string;
  active?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: Colors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      {icon ? <Ionicons name={icon} size={12} color={active ? colors.ink : colors.sub} /> : null}
      <Text style={[styles.chipText, active && { color: colors.ink, fontWeight: "600" }]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    header: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
    headerTop: { flexDirection: "row", alignItems: "flex-start" },
    appTitle: { fontSize: 21, fontWeight: "700", color: colors.ink, letterSpacing: -0.3 },
    dateLine: { fontSize: 12.5, color: colors.sub, marginTop: 5 },
    refreshBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.sm, backgroundColor: colors.chipBg, borderWidth: 1, borderColor: colors.line },
    refreshText: { fontSize: 12.5, color: colors.ink, fontWeight: "600" },
    statusLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
    statusText: { fontSize: 12.5, color: colors.sub },
    statusDim: { fontSize: 12, color: colors.faint },
    seasonTag: { borderWidth: 1, borderColor: colors.infoBorder, backgroundColor: colors.infoBg, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
    seasonText: { fontSize: 10.5, color: colors.brand },
    toolbar: { gap: 8, paddingTop: 12, paddingRight: 12 },
    chip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.sm, backgroundColor: colors.chipBg, borderWidth: 1, borderColor: "transparent" },
    chipActive: { backgroundColor: colors.chipActiveBg, borderColor: colors.chipBorder },
    chipText: { fontSize: 12.5, color: colors.sub },
    cornerCell: { height: 44, alignItems: "center", justifyContent: "center", backgroundColor: colors.lineSoft, borderRightWidth: 1, borderColor: colors.line },
    cornerText: { fontSize: 11.5, color: colors.sub },
    labelCell: { alignItems: "center", justifyContent: "center", backgroundColor: colors.lineSoft, borderRightWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
    labelText: { fontSize: 12.5, color: colors.ink, fontWeight: "500" },
    dayHead: { height: 44, alignItems: "center", justifyContent: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: colors.line, backgroundColor: colors.lineSoft, gap: 2 },
    dayHeadToday: { backgroundColor: colors.infoBg },
    dayName: { fontSize: 12, color: colors.sub, fontWeight: "500" },
    dayNameToday: { color: colors.brand, fontWeight: "700" },
    dayDate: { fontSize: 10, color: colors.faint },
    cell: { borderRightWidth: 1, borderBottomWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, padding: 4 },
    cellToday: { backgroundColor: colors.infoBg },
    cellActiveRow: { backgroundColor: colors.bg },
    cellCross: { backgroundColor: colors.infoBg, borderWidth: 2, borderColor: colors.brand },
    course: { borderLeftWidth: 3, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 5, marginBottom: 4 },
    courseName: { fontSize: 12, fontWeight: "600", lineHeight: 16 },
    courseMeta: { fontSize: 10, marginTop: 2, lineHeight: 13, opacity: 0.85 },
    freeBox: { flex: 1, alignItems: "center", justifyContent: "center" },
    freeText: { fontSize: 12, color: colors.brand },
    crossMark: { position: "absolute", top: 0, left: 0, width: 6, height: 6, backgroundColor: colors.brand },
    footerHint: { fontSize: 11, color: colors.faint, textAlign: "center", marginTop: 14, paddingHorizontal: 20 },
    banner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.warnBg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.warnBorder, paddingHorizontal: 12, paddingVertical: 9 },
    bannerDemo: { backgroundColor: colors.chipBg, borderColor: colors.line },
    bannerText: { flex: 1, fontSize: 11.5, color: colors.warnText },
    bannerAction: { fontSize: 11.5, color: colors.warnText, fontWeight: "600" },
  });
