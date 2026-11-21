import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useSchedule } from "../lib/schedule-store";
import { PERIODS_AUTUMN } from "../lib/season";
import { useTheme } from "../lib/theme-context";
import { Period } from "../lib/time";
import { Colors, radius } from "../theme";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function PeriodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { activeTable, updateTable } = useSchedule();
  const [rows, setRows] = useState<Period[]>(activeTable.periods);

  useEffect(() => {
    setRows(activeTable.periods.length ? activeTable.periods : PERIODS_AUTUMN);
  }, [activeTable.id, activeTable.periods]);

  const setRow = (no: number, patch: Partial<Period>) =>
    setRows((prev) => prev.map((p) => (p.no === no ? { ...p, ...patch } : p)));

  const onSave = () => {
    const invalid = rows.find((p) => !TIME_RE.test(p.start) || !TIME_RE.test(p.end));
    if (invalid) {
      Alert.alert("时间格式不对", `第 ${invalid.no} 节请填写 HH:MM，例如 08:30。`);
      return;
    }
    const badOrder = rows.find((p) => p.start >= p.end);
    if (badOrder) {
      Alert.alert("时间顺序不对", `第 ${badOrder.no} 节的开始时间需要早于结束时间。`);
      return;
    }
    updateTable({ periods: rows });
    Alert.alert("已保存", "节次时间已应用到当前课表。");
    router.back();
  };

  const onReset = () => {
    Alert.alert("恢复默认", "将当前课表的节次时间恢复为学校默认时间。", [
      { text: "取消", style: "cancel" },
      { text: "恢复", onPress: () => setRows(PERIODS_AUTUMN.map((p) => ({ ...p }))) },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>节次时间</Text>
        <Text style={styles.headerText}>按学校作息填写每节课的起止时间，格式 HH:MM，例如 08:30 - 09:15。仅影响当前课表「{activeTable.name}」。</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.headRow}>
          <Text style={styles.headNo}>节次</Text>
          <Text style={styles.headCell}>开始</Text>
          <Text style={styles.headDash}> </Text>
          <Text style={styles.headCell}>结束</Text>
        </View>
        {rows.map((p, idx) => (
          <View key={p.no} style={[styles.row, idx !== rows.length - 1 && styles.divider]}>
            <Text style={styles.no} numberOfLines={1}>第 {p.no} 节</Text>
            <TextInput
              value={p.start}
              onChangeText={(v) => setRow(p.no, { start: v })}
              placeholder="08:30"
              placeholderTextColor={colors.faint}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              style={styles.input}
            />
            <Text style={styles.dash}>–</Text>
            <TextInput
              value={p.end}
              onChangeText={(v) => setRow(p.no, { end: v })}
              placeholder="09:15"
              placeholderTextColor={colors.faint}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              style={styles.input}
            />
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryBtn} onPress={onSave}>
        <Text style={styles.primaryText}>保存节次时间</Text>
      </Pressable>
      <Pressable style={styles.ghostBtn} onPress={onReset}>
        <Ionicons name="refresh-outline" size={15} color={colors.sub} />
        <Text style={styles.ghostText}>恢复学校默认时间</Text>
      </Pressable>
      <Text style={styles.footer}>修改后，课表展示与上课提醒都会按新的时间计算。</Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    headerCard: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14 },
    headerTitle: { fontSize: 14, fontWeight: "700", color: colors.ink },
    headerText: { fontSize: 11.5, color: colors.sub, lineHeight: 18, marginTop: 8 },
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, marginTop: 12, paddingHorizontal: 14, paddingVertical: 4 },
    headRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingLeft: 2 },
    headNo: { width: 70, fontSize: 11, color: colors.faint },
    headCell: { width: 100, fontSize: 11, color: colors.faint, textAlign: "center" },
    headDash: { width: 22 },
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingLeft: 2 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
    no: { width: 70, fontSize: 12.5, color: colors.ink },
    input: { width: 100, height: 38, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 8, fontSize: 13, color: colors.ink, backgroundColor: colors.fieldBg, textAlign: "center" },
    dash: { width: 22, textAlign: "center", fontSize: 13, color: colors.faint },
    primaryBtn: { marginTop: 18, height: 44, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    ghostBtn: { marginTop: 10, height: 42, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    ghostText: { fontSize: 13, color: colors.sub },
    footer: { fontSize: 11, color: colors.faint, textAlign: "center", marginTop: 14, lineHeight: 17 },
  });