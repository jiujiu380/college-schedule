import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Course } from "../lib/schedule";
import { useTheme } from "../lib/theme-context";
import { parseWeeks } from "../lib/timetable-html";
import { WEEKDAYS } from "../lib/time";
import { Colors, radius } from "../theme";

type Props = {
  visible: boolean;
  initial?: Course | null;
  defaultWeekday?: number;
  defaultStart?: number;
  onClose: () => void;
  onSubmit: (course: Course) => void;
};

const MAX_PERIOD = 10;

export function CourseEditor({ visible, initial, defaultWeekday = 1, defaultStart = 1, onClose, onSubmit }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [name, setName] = useState("");
  const [teacher, setTeacher] = useState("");
  const [location, setLocation] = useState("");
  const [weekday, setWeekday] = useState(defaultWeekday);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(Math.min(defaultStart + 1, MAX_PERIOD));
  const [weeks, setWeeks] = useState("1-20");

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setName(initial.name);
      setTeacher(initial.teacher ?? "");
      setLocation(initial.location ?? "");
      setWeekday(initial.weekday);
      setStart(initial.startPeriod);
      setEnd(initial.endPeriod);
      setWeeks(formatWeeks(initial.weeks));
    } else {
      setName("");
      setTeacher("");
      setLocation("");
      setWeekday(defaultWeekday);
      setStart(defaultStart);
      setEnd(Math.min(defaultStart + 1, MAX_PERIOD));
      setWeeks("1-20");
    }
  }, [visible, initial, defaultWeekday, defaultStart]);

  const save = () => {
    if (!name.trim()) {
      Alert.alert("请填写课程名");
      return;
    }
    if (start > end) {
      Alert.alert("节次不对", "开始节次不能晚于结束节次");
      return;
    }
    const parsedWeeks = parseWeeks(weeks);
    if (!parsedWeeks.length) {
      Alert.alert("周次格式不对", "例如 1-16、3-4,7-17、4-12/2");
      return;
    }
    onSubmit({
      id: initial?.id ?? `c-${Date.now()}`,
      name: name.trim(),
      teacher: teacher.trim() || undefined,
      location: location.trim() || undefined,
      weekday,
      startPeriod: start,
      endPeriod: end,
      weeks: parsedWeeks,
      credit: initial?.credit,
    });
  };

  const quick = (from: number, to: number, step = 1) => {
    const arr: number[] = [];
    for (let w = from; w <= to; w += step) arr.push(w);
    setWeeks(formatWeeks(arr));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.mask}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>{initial ? "编辑课程" : "添加课程"}</Text>
            <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={20} color={colors.sub} /></Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Field label="课程名" value={name} onChangeText={setName} placeholder="例如 高等数学" colors={colors} styles={styles} />
            <View style={styles.twoCol}>
              <Field label="教师" value={teacher} onChangeText={setTeacher} placeholder="选填" colors={colors} styles={styles} flex />
              <Field label="地点" value={location} onChangeText={setLocation} placeholder="选填" colors={colors} styles={styles} flex />
            </View>

            <Text style={styles.label}>星期</Text>
            <View style={styles.chipRow}>
              {WEEKDAYS.map((d, i) => (
                <Pressable key={d} onPress={() => setWeekday(i + 1)} style={[styles.chip, weekday === i + 1 && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
                  <Text style={[styles.chipText, weekday === i + 1 && { color: "#FFFFFF" }]}>{d}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>节次</Text>
            <View style={styles.periodRow}>
              <Stepper value={start} min={1} max={MAX_PERIOD} onChange={(v: number) => { setStart(v); if (v > end) setEnd(v); }} colors={colors} styles={styles} />
              <Text style={styles.periodDash}>至</Text>
              <Stepper value={end} min={1} max={MAX_PERIOD} onChange={(v: number) => { setEnd(v); if (v < start) setStart(v); }} colors={colors} styles={styles} />
            </View>

            <Text style={styles.label}>周次</Text>
            <TextInput value={weeks} onChangeText={setWeeks} placeholder="1-16 或 3-4,7-17" placeholderTextColor={colors.faint} style={styles.input} autoCapitalize="none" />
            <View style={styles.quickRow}>
              <Quick label="1-16 周" onPress={() => quick(1, 16)} colors={colors} styles={styles} />
              <Quick label="1-16 单周" onPress={() => quick(1, 16, 2)} colors={colors} styles={styles} />
              <Quick label="2-16 双周" onPress={() => quick(2, 16, 2)} colors={colors} styles={styles} />
            </View>

            <Pressable style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveText}>保存</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, value, onChangeText, placeholder, flex, colors, styles }: any) {
  return (
    <View style={[{ marginBottom: 12 }, flex && { flex: 1 }]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.faint} style={styles.input} />
    </View>
  );
}

function Stepper({ value, min, max, onChange, colors, styles }: any) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - 1))}><Text style={styles.stepText}>−</Text></Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.min(max, value + 1))}><Text style={styles.stepText}>＋</Text></Pressable>
    </View>
  );
}

function Quick({ label, onPress, colors, styles }: any) {
  return (
    <Pressable style={[styles.quickChip, { borderColor: colors.fieldBorder }]} onPress={onPress}>
      <Text style={styles.quickText}>{label}</Text>
    </Pressable>
  );
}

export function formatWeeks(weeks: number[]): string {
  if (!weeks.length) return "";
  const sorted = [...weeks].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) { prev = cur; continue; }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    if (cur === undefined) break;
    start = cur;
    prev = cur;
  }
  return parts.join(",");
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    mask: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 26, maxHeight: "88%" },
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
    title: { fontSize: 16, fontWeight: "700", color: colors.ink },
    label: { fontSize: 11.5, color: colors.sub, marginBottom: 6 },
    input: { height: 42, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 10, fontSize: 14, color: colors.ink, backgroundColor: colors.fieldBg },
    twoCol: { flexDirection: "row", gap: 10 },
    chipRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
    chip: { width: 36, height: 34, borderRadius: 8, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center", backgroundColor: colors.fieldBg },
    chipText: { fontSize: 12.5, color: colors.ink },
    periodRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    periodDash: { fontSize: 12, color: colors.faint },
    stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
    stepBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center" },
    stepText: { fontSize: 16, color: colors.ink },
    stepValue: { fontSize: 15, fontWeight: "600", color: colors.ink, minWidth: 24, textAlign: "center" },
    quickRow: { flexDirection: "row", gap: 8, marginTop: 8 },
    quickChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
    quickText: { fontSize: 11.5, color: colors.sub },
    saveBtn: { marginTop: 18, height: 46, borderRadius: 10, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  });
