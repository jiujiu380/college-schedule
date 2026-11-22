import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FadeIn } from "../../components/Anim";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { TourOverlay, hasSeenTour } from "../../components/TourOverlay";
import { currentNow } from "../../lib/clock";
import { useGlobalRefresh, useRefreshTask } from "../../lib/app-refresh";
import { useSchedule } from "../../lib/schedule-store";
import { useTheme } from "../../lib/theme-context";
import { currentPeriodNo, formatToday, todayWeekday } from "../../lib/time";
import { Announcement, fetchAnnouncements, htmlToText } from "../../lib/site-api";
import { Colors } from "../../theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { courses, week, periods, activeTable } = useSchedule();
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [tourVisible, setTourVisible] = useState(false);
  const { refreshing, refresh } = useGlobalRefresh();

  const loadAnnouncement = useCallback(async () => {
    try {
      const list = await fetchAnnouncements();
      setAnnouncement(list.length ? list[0] : null);
    } catch {
      // 官网不可用时保留旧公告
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadAnnouncement(); }, [loadAnnouncement]));
  useRefreshTask(loadAnnouncement);

  React.useEffect(() => {
    let alive = true;
    hasSeenTour().then((seen) => {
      if (alive && !seen) setTimeout(() => setTourVisible(true), 700);
    });
    return () => { alive = false; };
  }, []);

  React.useEffect(() => {
    if (tour === "1") setTourVisible(true);
  }, [tour]);

  const today = todayWeekday();
  const now = currentNow();
  const current = currentPeriodNo(periods, now);

  const todayList = useMemo(
    () => courses.filter((c) => c.weekday === today && c.weeks.includes(week)).sort((a, b) => a.startPeriod - b.startPeriod),
    [courses, today, week],
  );
  const weekCount = useMemo(() => courses.filter((c) => c.weeks.includes(week)).length, [courses, week]);
  const nextCourse = todayList.find((c) => c.endPeriod >= (current ?? 0));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} colors={[colors.brand]} />}
    >
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <FadeIn>
        <View style={styles.header}>
          <Text style={styles.date}>{formatToday()}</Text>
          <Text style={styles.title}>今天</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{activeTable.name} · 第 {week} 周</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.meta}>{todayList.length} 节课</Text>
          </View>
        </View>
      </FadeIn>

      {announcement ? (
        <FadeIn delay={30}>
          <Pressable style={styles.annBar} onPress={() => router.push("/announcements")}>
            <Ionicons name="megaphone-outline" size={15} color={colors.brand} />
            <Text style={styles.annText} numberOfLines={1}>{announcement.title}</Text>
            <Text style={styles.annMore}>查看</Text>
          </Pressable>
        </FadeIn>
      ) : null}

      {nextCourse ? (
        <FadeIn delay={50}>
          <Pressable style={styles.nextCard} onPress={() => router.push(`/course/${nextCourse.id}`)}>
            <View style={styles.nextHead}>
              <View style={styles.liveDot} />
              <Text style={styles.nextLabel}>{current && nextCourse.startPeriod <= current ? "正在上课" : "下一节"}</Text>
              <Text style={styles.nextTime}>{periods[nextCourse.startPeriod - 1]?.start} - {periods[nextCourse.endPeriod - 1]?.end}</Text>
            </View>
            <Text style={styles.nextName}>{nextCourse.name}</Text>
            <Text style={styles.nextMeta}>{nextCourse.location ?? "地点待定"} · {nextCourse.teacher ?? "教师待定"}</Text>
          </Pressable>
        </FadeIn>
      ) : null}

      <FadeIn delay={100}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>今日课程</Text>
          <Text style={styles.sectionMore}>本周 {weekCount} 节</Text>
        </View>

        {todayList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cafe-outline" size={22} color={colors.faint} />
            <Text style={styles.emptyText}>{courses.length ? "今天没有课，休息一下" : "还没有课表，先去导入一份"}</Text>
            {courses.length === 0 ? (
              <Pressable style={styles.importBtn} onPress={() => router.push("/import")}>
                <Text style={styles.importText}>导入课表</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.list}>
            {todayList.map((c, i) => {
              const active = current !== null && c.startPeriod <= current && c.endPeriod >= current;
              return (
                <Pressable key={c.id} onPress={() => router.push(`/course/${c.id}`)} style={[styles.row, i !== todayList.length - 1 && styles.rowBorder]}>
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeStart, active && { color: colors.brand }]}>{periods[c.startPeriod - 1]?.start}</Text>
                    <Text style={styles.timeEnd}>{periods[c.endPeriod - 1]?.end}</Text>
                  </View>
                  <View style={[styles.rail, active && { backgroundColor: colors.brand }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseName}>{c.name}</Text>
                    <Text style={styles.courseMeta}>{c.location ?? "地点待定"} · {c.teacher ?? "教师待定"}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </FadeIn>

      <FadeIn delay={160}>
        <View style={styles.quickRow}>
          <Pressable style={styles.quick} onPress={() => router.push("/import")}>
            <Ionicons name="download-outline" size={18} color={colors.brand} />
            <Text style={styles.quickText}>导入课表</Text>
          </Pressable>
          <Pressable style={styles.quick} onPress={() => router.push("/settings")}>
            <Ionicons name="options-outline" size={18} color={colors.brand} />
            <Text style={styles.quickText}>外观与提醒</Text>
          </Pressable>
        </View>
      </FadeIn>

      <Text style={styles.footer}>完全离线 · 数据只保存在本机</Text>

      <TourOverlay visible={tourVisible} onDone={() => setTourVisible(false)} />
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    header: { paddingHorizontal: 18 },
    date: { fontSize: 12.5, color: colors.faint },
    title: { fontSize: 30, fontWeight: "800", color: colors.ink, marginTop: 6, letterSpacing: -0.8 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
    meta: { fontSize: 12, color: colors.sub },
    metaDot: { fontSize: 12, color: colors.faint },
    annBar: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 18, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.infoBorder, backgroundColor: colors.infoBg },
    annText: { flex: 1, fontSize: 12, color: colors.ink },
    annMore: { fontSize: 11.5, color: colors.brand, fontWeight: "600" },
    nextCard: { marginHorizontal: 18, marginTop: 18, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
    nextHead: { flexDirection: "row", alignItems: "center", gap: 6 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
    nextLabel: { fontSize: 11, color: colors.success, fontWeight: "600" },
    nextTime: { marginLeft: "auto", fontSize: 11, color: colors.faint },
    nextName: { fontSize: 18, fontWeight: "700", color: colors.ink, marginTop: 10 },
    nextMeta: { fontSize: 12, color: colors.sub, marginTop: 5 },
    sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, marginTop: 24, marginBottom: 8 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
    sectionMore: { fontSize: 11.5, color: colors.faint },
    list: { marginHorizontal: 18, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, gap: 10 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
    timeCol: { width: 46 },
    timeStart: { fontSize: 13, fontWeight: "700", color: colors.ink },
    timeEnd: { fontSize: 10, color: colors.faint, marginTop: 2 },
    rail: { width: 3, alignSelf: "stretch", borderRadius: 2, backgroundColor: colors.line },
    courseName: { fontSize: 14.5, fontWeight: "600", color: colors.ink },
    courseMeta: { fontSize: 11.5, color: colors.sub, marginTop: 4 },
    emptyCard: { marginHorizontal: 18, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: "center", gap: 8 },
    emptyText: { fontSize: 12.5, color: colors.faint },
    importBtn: { marginTop: 6, paddingHorizontal: 18, height: 36, borderRadius: 8, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    importText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "600" },
    quickRow: { flexDirection: "row", gap: 10, marginHorizontal: 18, marginTop: 20 },
    quick: { flex: 1, height: 52, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    quickText: { fontSize: 12.5, color: colors.ink },
    footer: { textAlign: "center", fontSize: 11, color: colors.faint, marginTop: 24 },
  });