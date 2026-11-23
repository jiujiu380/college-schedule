import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CourseEditor } from "../../components/CourseEditor";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { useSchedule } from "../../lib/schedule-store";
import { Homework, addHomework, deleteHomework, loadHomework, occurrenceDate, toggleHomework } from "../../lib/homework";
import { CourseMove } from "../../lib/timetables";
import { useTheme } from "../../lib/theme-context";
import { WEEKDAYS } from "../../lib/time";
import { Colors, radius } from "../../theme";
import { tintFor } from "../../lib/theme-presets";

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { byId, periods, preset, updateCourse, deleteCourse, activeTable, updateTable, week } = useSchedule();
  const { colors, scheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [hwVisible, setHwVisible] = useState(false);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [hwText, setHwText] = useState("");
  const [moveVisible, setMoveVisible] = useState(false);
  const [targetWeek, setTargetWeek] = useState(week);
  const [targetWeekday, setTargetWeekday] = useState(1);
  const [targetStart, setTargetStart] = useState(1);
  const [targetEnd, setTargetEnd] = useState(1);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const course = byId(String(id));

  if (!course) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <Text style={{ color: colors.sub }}>课程不存在</Text>
      </View>
    );
  }

  const tint = tintFor(preset, course.id);
  const hours = course.weeks.length * (course.endPeriod - course.startPeriod + 1);
  const occurrence = occurrenceDate(activeTable.startDate, week, course.weekday);
  const move = (activeTable.moves ?? []).find((m) => m.courseId === course.id && m.fromWeek === week);

  const openHomework = async () => {
    const list = await loadHomework();
    setHomework(list.filter((h) => h.courseId === course.id && h.date === occurrence));
    setHwVisible(true);
  };

  const submitHomework = async () => {
    if (!hwText.trim()) return;
    const list = await addHomework(course.id, occurrence, hwText);
    setHomework(list.filter((h) => h.courseId === course.id && h.date === occurrence));
    setHwText("");
  };

  const openMove = () => {
    setTargetWeek(week);
    setTargetWeekday(course.weekday);
    setTargetStart(course.startPeriod);
    setTargetEnd(course.endPeriod);
    setMoveVisible(true);
  };

  const saveMove = () => {
    if (targetEnd < targetStart) {
      Alert.alert("节次不正确", "结束节不能早于开始节。");
      return;
    }
    const next: CourseMove[] = (activeTable.moves ?? []).filter((m) => !(m.courseId === course.id && m.fromWeek === week));
    next.push({
      id: "mv-" + Date.now().toString(36),
      courseId: course.id,
      fromWeek: week,
      toWeek: targetWeek,
      toWeekday: targetWeekday,
      toStart: targetStart,
      toEnd: targetEnd,
      createdAt: Date.now(),
    });
    updateTable({ moves: next });
    setMoveVisible(false);
    Alert.alert("已调课", `第 ${week} 周的这节课已移到第 ${targetWeek} 周 周${WEEKDAYS[targetWeekday - 1]}。`);
  };

  const undoMove = () => {
    if (!move) return;
    updateTable({ moves: (activeTable.moves ?? []).filter((m) => m.id !== move.id) });
    setMoveVisible(false);
  };

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

      <View style={styles.extraRow}>
        <Pressable style={styles.extraBtn} onPress={openHomework}>
          <Ionicons name="checkbox-outline" size={16} color={colors.brand} />
          <Text style={styles.extraText}>本周作业</Text>
        </Pressable>
        <Pressable style={styles.extraBtn} onPress={openMove}>
          <Ionicons name="swap-horizontal-outline" size={16} color={colors.brand} />
          <Text style={styles.extraText}>调课</Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.editBtn} onPress={() => setEditing(true)}>
          <Ionicons name="create-outline" size={16} color={colors.brand} />
          <Text style={styles.editText}>编辑</Text>
        </Pressable>
        <Pressable
          style={styles.deleteBtn}
          onPress={() =>
            Alert.alert("删除课程", `确定删除「${course.name}」？`, [
              { text: "取消", style: "cancel" },
              { text: "删除", style: "destructive", onPress: () => { deleteCourse(course.id); router.back(); } },
            ])
          }
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={styles.deleteText}>删除</Text>
        </Pressable>
      </View>

      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>关闭</Text>
      </Pressable>

      <Modal visible={hwVisible} transparent animationType="slide" onRequestClose={() => setHwVisible(false)}>
        <View style={styles.mask}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHead}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.ink }]}>本周作业</Text>
                <Text style={[styles.sheetSub, { color: colors.faint }]}>{course.name} · {occurrence}</Text>
              </View>
              <Pressable onPress={() => setHwVisible(false)}><Ionicons name="close" size={22} color={colors.sub} /></Pressable>
            </View>
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {homework.length === 0 ? <Text style={[styles.hwEmpty, { color: colors.faint }]}>还没有作业，添加一条吧</Text> : null}
              {homework.map((h) => (
                <Pressable key={h.id} style={styles.hwRow} onPress={async () => setHomework((await toggleHomework(h.id)).filter((x) => x.courseId === course.id && x.date === occurrence))}>
                  <Ionicons name={h.done ? "checkbox" : "square-outline"} size={18} color={h.done ? colors.brand : colors.faint} />
                  <Text style={[styles.hwText, { color: h.done ? colors.faint : colors.ink, textDecorationLine: h.done ? "line-through" : "none" }]}>{h.text}</Text>
                  <Pressable hitSlop={8} onPress={async () => setHomework((await deleteHomework(h.id)).filter((x) => x.courseId === course.id && x.date === occurrence))}>
                    <Ionicons name="trash-outline" size={15} color={colors.faint} />
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.hwAddRow}>
              <TextInput value={hwText} onChangeText={setHwText} placeholder="新增作业…" placeholderTextColor={colors.faint} style={[styles.input, { flex: 1 }]} onSubmitEditing={submitHomework} />
              <Pressable style={styles.hwAddBtn} onPress={submitHomework}><Text style={styles.hwAddText}>添加</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={moveVisible} transparent animationType="slide" onRequestClose={() => setMoveVisible(false)}>
        <View style={styles.mask}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHead}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.ink }]}>调课</Text>
                <Text style={[styles.sheetSub, { color: colors.faint }]}>把第 {week} 周的这节课移动到其他周/星期</Text>
              </View>
              <Pressable onPress={() => setMoveVisible(false)}><Ionicons name="close" size={22} color={colors.sub} /></Pressable>
            </View>

            <Text style={[styles.inputLabel, { color: colors.sub }]}>目标周次</Text>
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} onPress={() => setTargetWeek((v) => Math.max(1, v - 1))}><Text style={styles.stepText}>−</Text></Pressable>
              <Text style={[styles.stepValue, { color: colors.ink }]}>第 {targetWeek} 周</Text>
              <Pressable style={styles.stepBtn} onPress={() => setTargetWeek((v) => Math.min(activeTable.totalWeeks, v + 1))}><Text style={styles.stepText}>＋</Text></Pressable>
            </View>

            <Text style={[styles.inputLabel, { color: colors.sub }]}>目标星期</Text>
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((d, i) => (
                <Pressable key={d} onPress={() => setTargetWeekday(i + 1)} style={[styles.weekdayChip, { borderColor: colors.fieldBorder }, targetWeekday === i + 1 && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
                  <Text style={[styles.weekdayText, { color: targetWeekday === i + 1 ? "#FFFFFF" : colors.sub }]}>{d}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.sub }]}>节次</Text>
            <View style={styles.periodRow}>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => setTargetStart((v) => Math.max(1, v - 1))}><Text style={styles.stepText}>−</Text></Pressable>
                <Text style={[styles.stepValue, { color: colors.ink }]}>第 {targetStart} 节</Text>
                <Pressable style={styles.stepBtn} onPress={() => setTargetStart((v) => Math.min(10, v + 1))}><Text style={styles.stepText}>＋</Text></Pressable>
              </View>
              <Text style={{ color: colors.faint }}>至</Text>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => setTargetEnd((v) => Math.max(1, v - 1))}><Text style={styles.stepText}>−</Text></Pressable>
                <Text style={[styles.stepValue, { color: colors.ink }]}>第 {targetEnd} 节</Text>
                <Pressable style={styles.stepBtn} onPress={() => setTargetEnd((v) => Math.min(10, v + 1))}><Text style={styles.stepText}>＋</Text></Pressable>
              </View>
            </View>

            <Pressable style={styles.primary} onPress={saveMove}><Text style={styles.primaryText}>保存调课</Text></Pressable>
            {move ? <Pressable style={styles.ghost} onPress={undoMove}><Text style={styles.ghostText}>撤销本周调课</Text></Pressable> : null}
          </View>
        </View>
      </Modal>

      <CourseEditor
        visible={editing}
        initial={course}
        onClose={() => setEditing(false)}
        onSubmit={(next) => { updateCourse(next); setEditing(false); }}
      />
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
    actionRow: { flexDirection: "row", gap: 10, marginTop: 20 },
    editBtn: { flex: 1, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.brand, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, backgroundColor: colors.brandSoft },
    editText: { color: colors.brand, fontSize: 13.5, fontWeight: "600" },
    deleteBtn: { flex: 1, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.danger, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
    deleteText: { color: colors.danger, fontSize: 13.5, fontWeight: "600" },
    extraRow: { flexDirection: "row", gap: 10, marginTop: 18 },
    extraBtn: { flex: 1, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.infoBorder, backgroundColor: colors.brandSoft, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    extraText: { fontSize: 13, color: colors.brand, fontWeight: "600" },
    mask: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
    sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    sheetTitle: { fontSize: 16, fontWeight: "700" },
    sheetSub: { fontSize: 11, marginTop: 3 },
    hwEmpty: { fontSize: 12, textAlign: "center", paddingVertical: 18 },
    hwRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
    hwText: { flex: 1, fontSize: 13.5 },
    hwAddRow: { flexDirection: "row", gap: 8, marginTop: 12 },
    hwAddBtn: { width: 64, height: 44, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    hwAddText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
    input: { height: 44, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 13, color: colors.ink, backgroundColor: colors.fieldBg },
    inputLabel: { fontSize: 11.5, marginTop: 12, marginBottom: 6 },
    stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, overflow: "hidden" },
    stepBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center", backgroundColor: colors.chipBg },
    stepText: { fontSize: 18, color: colors.ink },
    stepValue: { minWidth: 78, textAlign: "center", fontSize: 12.5 },
    weekdayRow: { flexDirection: "row", gap: 6 },
    weekdayChip: { flex: 1, height: 34, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    weekdayText: { fontSize: 12 },
    periodRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    primary: { marginTop: 18, height: 46, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    ghost: { marginTop: 10, height: 42, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center" },
    ghostText: { fontSize: 13, color: colors.ink },
    close: { marginTop: 26, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
    closeText: { fontSize: 14, color: colors.ink },
  });