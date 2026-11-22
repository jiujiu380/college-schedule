import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useSchedule } from "../lib/schedule-store";
import { mondayISO, weekOfDate } from "../lib/timetables";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function SemesterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { activeTable, updateTable, setWeek } = useSchedule();
  const [name, setName] = useState(activeTable.name);
  const [startDate, setStartDate] = useState(activeTable.startDate);
  const [totalWeeks, setTotalWeeks] = useState(String(activeTable.totalWeeks));

  const currentWeek = useMemo(() => {
    if (!DATE_RE.test(startDate)) return null;
    return weekOfDate(startDate);
  }, [startDate]);

  const save = () => {
    if (!DATE_RE.test(startDate)) {
      Alert.alert("日期格式不对", "请填写 YYYY-MM-DD，例如 2026-09-07");
      return;
    }
    const weeks = Math.min(Math.max(Number(totalWeeks) || 20, 1), 30);
    updateTable({ name: name.trim() || activeTable.name, startDate, totalWeeks: weeks });
    setWeek(Math.min(Math.max(weekOfDate(startDate), 1), weeks));
    Alert.alert("已保存", `开学时间 ${startDate}，共 ${weeks} 周。`);
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.card}>
        <Text style={styles.title}>学期设置</Text>
        <Text style={styles.desc}>不同学校开学时间不同。填写第 1 周的周一，应用据此计算当前周次、显示日期，并决定“非本周课程”的淡化。</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>课表名称</Text>
        <TextInput value={name} onChangeText={setName} placeholder="例如：2026 秋季课表" placeholderTextColor={colors.faint} style={styles.input} />
        <Text style={[styles.label, { marginTop: 16 }]}>开学日期（第 1 周周一）</Text>
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder="2026-09-07"
          placeholderTextColor={colors.faint}
          style={styles.input}
          autoCapitalize="none"
        />
        <View style={styles.quickRow}>
          <Pressable style={styles.quickBtn} onPress={() => setStartDate(mondayISO(new Date()))}>
            <Text style={styles.quickText}>设为本周一</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => { const d = new Date(); d.setDate(d.getDate() - 7); setStartDate(mondayISO(d)); }}>
            <Text style={styles.quickText}>设为上周一</Text>
          </Pressable>
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>学期总周数</Text>
        <TextInput
          value={totalWeeks}
          onChangeText={setTotalWeeks}
          placeholder="20"
          placeholderTextColor={colors.faint}
          keyboardType="number-pad"
          style={styles.input}
        />

        <View style={styles.preview}>
          <Ionicons name="calendar-outline" size={15} color={colors.brand} />
          <Text style={styles.previewText}>
            {currentWeek === null ? "日期格式无效" : `按此设置，今天是第 ${currentWeek} 周`}
          </Text>
        </View>
      </View>

      <Pressable style={styles.primaryBtn} onPress={save}>
        <Text style={styles.primaryText}>保存</Text>
      </Pressable>
      <Text style={styles.footer}>提示：开学日期只影响周次计算，不改变已填写的课程周次。</Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 12 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    desc: { fontSize: 11.5, color: colors.sub, lineHeight: 18, marginTop: 8 },
    label: { fontSize: 11.5, color: colors.sub, marginBottom: 6 },
    input: { height: 44, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 14, color: colors.ink, backgroundColor: colors.fieldBg },
    quickRow: { flexDirection: "row", gap: 8, marginTop: 8 },
    quickBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: colors.fieldBorder, backgroundColor: colors.chipBg },
    quickText: { fontSize: 11.5, color: colors.sub },
    preview: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, padding: 10, borderRadius: 8, backgroundColor: colors.brandSoft },
    previewText: { fontSize: 12, color: colors.brand },
    primaryBtn: { height: 46, borderRadius: 10, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
    footer: { fontSize: 11, color: colors.faint, textAlign: "center", marginTop: 14, lineHeight: 17 },
  });