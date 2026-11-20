import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { useSchedule } from "../../lib/schedule-store";
import { useTheme } from "../../lib/theme-context";
import { WEEKDAYS } from "../../lib/time";
import { Colors, courseTint, radius } from "../../theme";

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { byId, periods } = useSchedule();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const course = byId(String(id));

  if (!course) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <Text style={{ color: colors.sub }}>课程不存在</Text>
      </View>
    );
  }

  const tint = courseTint(course.id, scheme);
  const hours = course.weeks.length * (course.endPeriod - course.startPeriod + 1);

  const Row = ({ label, value, last }: { label: string; value: string; last?: boolean }) => (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={[styles.card, { backgroundColor: tint.bg, borderColor: tint.bg }]}>
        <Text style={[styles.name, { color: tint.fg }]}>{course.name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={13} color={tint.fg} />
          <Text style={[styles.metaText, { color: tint.fg }]}>{course.teacher ?? "—"}</Text>
          <Ionicons name="location-outline" size={13} color={tint.fg} style={{ marginLeft: 14 }} />
          <Text style={[styles.metaText, { color: tint.fg }]}>{course.location ?? "—"}</Text>
        </View>
      </View>

      <Text style={styles.section}>课程安排</Text>
      <View style={styles.card}>
        <Row label="星期" value={`周${WEEKDAYS[course.weekday - 1]}`} />
        <Row label="节次" value={`第 ${course.startPeriod}-${course.endPeriod} 节`} />
        <Row label="时间" value={`${periods[course.startPeriod - 1]?.start} - ${periods[course.endPeriod - 1]?.end}`} />
        <Row label="周次" value={compressWeeks(course.weeks)} />
        <Row label="学分" value={course.credit ? String(course.credit) : "—"} />
        <Row label="总课时" value={String(hours)} last />
      </View>

      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>关闭</Text>
      </Pressable>
    </ScrollView>
  );
}

function compressWeeks(weeks: number[]): string {
  if (!weeks.length) return "—";
  const sorted = [...weeks].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    if (cur === undefined) break;
    start = cur;
    prev = cur;
  }
  return `第 ${parts.join("、")} 周`;
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14 },
    name: { fontSize: 19, fontWeight: "700", paddingTop: 16, paddingBottom: 10 },
    metaRow: { flexDirection: "row", alignItems: "center", paddingBottom: 16, gap: 5 },
    metaText: { fontSize: 12 },
    section: { fontSize: 12, color: colors.faint, marginTop: 22, marginBottom: 8, marginLeft: 4 },
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 13 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
    rowLabel: { flex: 1, fontSize: 13, color: colors.sub },
    rowValue: { fontSize: 13, color: colors.ink, fontWeight: "500", maxWidth: "70%", textAlign: "right" },
    close: { marginTop: 26, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
    closeText: { fontSize: 14, color: colors.ink },
  });
