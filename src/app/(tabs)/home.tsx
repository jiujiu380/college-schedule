import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FadeIn } from "../../components/Anim";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { useAuth } from "../../lib/auth";
import { currentNow } from "../../lib/clock";
import { useSchedule } from "../../lib/schedule-store";
import { useTheme } from "../../lib/theme-context";
import { useUpdate } from "../../lib/update-store";
import { currentPeriodNo, formatToday, todayWeekday } from "../../lib/time";
import { Colors, radius } from "../../theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { studentId } = useAuth();
  const { courses, week, periods, source } = useSchedule();
  const { result: updateResult } = useUpdate();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const today = todayWeekday();
  const current = currentPeriodNo(periods, currentNow());

  const todayList = useMemo(
    () => courses.filter((c) => c.weekday === today && c.weeks.includes(week)).sort((a, b) => a.startPeriod - b.startPeriod),
    [courses, today, week],
  );
  const weekList = useMemo(() => courses.filter((c) => c.weeks.includes(week)), [courses, week]);
  const credits = weekList.reduce((sum, c) => sum + (c.credit ?? 0), 0);

  const Stat = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={styles.statValue}>
        {value}
        <Text style={styles.statUnit}> {unit}</Text>
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <FadeIn>
        <View style={styles.header}>
          <Text style={styles.title}>主站</Text>
          <Text style={styles.date}>{formatToday()}</Text>
        </View>
      </FadeIn>

      {updateResult?.status === "available" ? (
        <FadeIn delay={30}>
          <Pressable style={styles.updateBar} onPress={() => router.push("/update")}>
            <Ionicons name="arrow-up-circle" size={16} color={colors.brand} />
            <Text style={styles.updateText}>发现新版本 v{updateResult.latest}</Text>
            <Text style={styles.updateAction}>去更新</Text>
          </Pressable>
        </FadeIn>
      ) : null}

      <FadeIn delay={60}>
        <View style={styles.stats}>
          <Stat label="本周课程" value={String(weekList.length)} unit="节" />
          <View style={styles.statDivider} />
          <Stat label="本周学分" value={credits.toFixed(1)} unit="分" />
          <View style={styles.statDivider} />
          <Stat label="当前周次" value={String(week)} unit="周" />
        </View>
      </FadeIn>

      <FadeIn delay={120}>
        <View style={styles.sectionHead}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.sectionTitle}>今日课程</Text>
            {source === "static" ? <Text style={styles.staticTag}>静态数据</Text> : null}
          </View>
          <Text style={styles.sectionMore}>{studentId ?? ""}</Text>
        </View>

        <View style={styles.list}>
          {todayList.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>今天没有课程安排</Text>
            </View>
          ) : (
            todayList.map((c, idx) => {
              const active = current !== null && c.startPeriod <= current && c.endPeriod >= current;
              return (
                <Pressable key={c.id} onPress={() => router.push(`/course/${c.id}`)} style={[styles.row, idx !== todayList.length - 1 && styles.rowBorder]}>
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeStart, active && { color: colors.brand }]}>{periods[c.startPeriod - 1]?.start}</Text>
                    <Text style={styles.timePeriod}>{c.startPeriod}-{c.endPeriod} 节</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseName}>{c.name}</Text>
                    <Text style={styles.courseMeta}>{c.location ?? "地点待定"} · {c.teacher ?? "教师待定"}</Text>
                  </View>
                  {active ? <Text style={styles.badge}>进行中</Text> : null}
                </Pressable>
              );
            })
          )}
        </View>
      </FadeIn>

      <FadeIn delay={180}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>教务通知</Text>
        </View>
        <View style={styles.list}>
          {[
            { t: "关于 2026-2027 学年第一学期选课的通知", d: "11-18" },
            { t: "期中教学检查学生座谈安排", d: "11-12" },
            { t: "体育馆开放时间调整说明", d: "11-05" },
          ].map((n, i, arr) => (
            <View key={n.t} style={[styles.notice, i !== arr.length - 1 && styles.rowBorder]}>
              <Text style={styles.noticeTitle} numberOfLines={1}>{n.t}</Text>
              <Text style={styles.noticeDate}>{n.d}</Text>
            </View>
          ))}
        </View>
      </FadeIn>

      <Text style={styles.footer}>
        {source === "static"
          ? "当前为导入的静态课表，接口恢复后重新登录即可切换回实时数据"
          : source === "api"
            ? "课表数据来自教务系统"
            : "数据为演示内容，接入教务系统后自动更新"}
      </Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    header: { paddingHorizontal: 16, paddingBottom: 14 },
    title: { fontSize: 22, fontWeight: "700", color: colors.ink },
    date: { fontSize: 12.5, color: colors.sub, marginTop: 6 },
    updateBar: { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.infoBorder, backgroundColor: colors.infoBg },
    updateText: { flex: 1, fontSize: 12.5, color: colors.brand },
    updateAction: { fontSize: 12, color: colors.brand, fontWeight: "600" },
    stats: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingVertical: 14 },
    statValue: { fontSize: 20, fontWeight: "700", color: colors.ink },
    statUnit: { fontSize: 11, fontWeight: "400", color: colors.sub },
    statLabel: { fontSize: 11, color: colors.faint, marginTop: 4 },
    statDivider: { width: 1, height: 26, backgroundColor: colors.line },
    sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginTop: 22, marginBottom: 8 },
    sectionTitle: { fontSize: 14, fontWeight: "600", color: colors.ink },
    sectionMore: { fontSize: 11.5, color: colors.faint },
    staticTag: { fontSize: 10, color: colors.warnText, backgroundColor: colors.warnBg, borderWidth: 1, borderColor: colors.warnBorder, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
    list: { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
    row: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
    timeCol: { width: 56 },
    timeStart: { fontSize: 13.5, fontWeight: "600", color: colors.ink },
    timePeriod: { fontSize: 10.5, color: colors.faint, marginTop: 3 },
    courseName: { fontSize: 14, fontWeight: "600", color: colors.ink },
    courseMeta: { fontSize: 11.5, color: colors.sub, marginTop: 4 },
    badge: { fontSize: 10, color: colors.brand, borderWidth: 1, borderColor: colors.brand, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
    empty: { padding: 24, alignItems: "center" },
    emptyText: { fontSize: 12.5, color: colors.faint },
    notice: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
    noticeTitle: { flex: 1, fontSize: 13, color: colors.ink },
    noticeDate: { fontSize: 11, color: colors.faint },
    footer: { textAlign: "center", fontSize: 11, color: colors.faint, marginTop: 22, paddingHorizontal: 20 },
  });
