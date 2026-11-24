import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Period, WEEKDAYS } from "../lib/time";
import { Timetable } from "../lib/timetables";
import { coursesForWeek, weekRange } from "../lib/export-schedule";
import { presetById, tintFor } from "../lib/theme-presets";

export const BOARD_WIDTH = 900;
const TIME_W = 56;
const HEADER_H = 40;
const ROW_H = 54;
const TITLE_H = 64;
const FOOT_H = 26;
export const BOARD_HEIGHT = TITLE_H + HEADER_H + ROW_H * 10 + FOOT_H;

type Props = {
  table: Timetable;
  week: number;
  periods: Period[];
};

export function TimetableBoard({ table, week, periods }: Props) {
  const courses = coursesForWeek(table, week);
  const dayW = (BOARD_WIDTH - TIME_W) / 7;
  const preset = presetById(table.themeId);

  return (
    <View style={[styles.board, { width: BOARD_WIDTH, height: BOARD_HEIGHT }]}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{table.name}</Text>
        <Text style={styles.sub}>第 {week} 周 · {weekRange(table, week)} · {table.courses.length} 门课程</Text>
      </View>

      <View style={{ flexDirection: "row", height: HEADER_H, marginLeft: 0 }}>
        <View style={[styles.headCell, { width: TIME_W }]}><Text style={styles.headText}>节次</Text></View>
        {WEEKDAYS.map((d) => (
          <View key={d} style={[styles.headCell, { width: dayW }]}><Text style={styles.headText}>周{d}</Text></View>
        ))}
      </View>

      <View style={{ height: ROW_H * 10, position: "relative" }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={i} style={[styles.row, { top: i * ROW_H, height: ROW_H }]}>
            <View style={[styles.timeCell, { width: TIME_W }]}>
              <Text style={styles.period}>第 {i + 1} 节</Text>
              <Text style={styles.time}>{periods[i]?.start ?? ""} - {periods[i]?.end ?? ""}</Text>
            </View>
            {WEEKDAYS.map((d) => <View key={d} style={[styles.cell, { width: dayW }]} />)}
          </View>
        ))}
        {courses.map((c) => {
          const tint = tintFor(preset, c.id);
          const top = (c.startPeriod - 1) * ROW_H + 3;
          const height = (c.endPeriod - c.startPeriod + 1) * ROW_H - 6;
          return (
            <View key={c.id} style={[styles.block, { left: TIME_W + (c.weekday - 1) * dayW + 3, top, width: dayW - 6, height, backgroundColor: tint.bg }]}>
              <Text style={[styles.courseName, { color: tint.fg }]} numberOfLines={2}>{c.name}</Text>
              {c.location ? <Text style={[styles.courseMeta, { color: tint.fg }]} numberOfLines={1}>{c.location}</Text> : null}
              {c.teacher && height >= 70 ? <Text style={[styles.courseMeta, { color: tint.fg }]} numberOfLines={1}>{c.teacher}</Text> : null}
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>知酷课程表 · 第 {week} 周</Text>
        <Text style={styles.footerText}>导出于 {new Date().toLocaleDateString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: { backgroundColor: "#FFFFFF", paddingTop: 16 },
  titleRow: { height: TITLE_H - 16, paddingHorizontal: 18, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: "#16233B", letterSpacing: -0.4 },
  sub: { fontSize: 10, color: "#7C879B", marginTop: 3 },
  headCell: { height: HEADER_H, backgroundColor: "#F3F7FF", alignItems: "center", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: "#E3EBF8", borderRightWidth: 1, borderRightColor: "#E8EEF8" },
  headText: { fontSize: 12, fontWeight: "700", color: "#2563EB" },
  row: { position: "absolute", left: 0, right: 0, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#EDF2FA" },
  timeCell: { alignItems: "center", justifyContent: "center", backgroundColor: "#FAFCFF", borderRightWidth: 1, borderRightColor: "#E8EEF8" },
  period: { fontSize: 9.5, fontWeight: "600", color: "#16233B" },
  time: { fontSize: 7.5, color: "#8A98B0", marginTop: 2 },
  cell: { borderRightWidth: 1, borderRightColor: "#EDF2FA" },
  block: { position: "absolute", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 4, overflow: "hidden" },
  courseName: { fontSize: 12, fontWeight: "700", lineHeight: 15 },
  courseMeta: { fontSize: 8.5, marginTop: 2, lineHeight: 11, opacity: 0.9 },
  footer: { height: FOOT_H, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
  footerText: { fontSize: 8.5, color: "#98A3B6" },
});
