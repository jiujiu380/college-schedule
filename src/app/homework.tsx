import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { Homework, addHomework, deleteHomework, loadHomework, toggleHomework } from "../lib/homework";
import { useSchedule } from "../lib/schedule-store";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

function formatDue(due?: string): { text: string; danger: boolean } {
  if (!due) return { text: "未设截止", danger: false };
  const t = new Date(due).getTime();
  if (!Number.isFinite(t)) return { text: due, danger: false };
  const diff = t - Date.now();
  const day = Math.floor(diff / 86400000);
  const date = new Date(t);
  const label = date.getMonth() + 1 + "/" + date.getDate() + " " + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
  if (diff < 0) return { text: "已逾期 · " + label, danger: true };
  if (day === 0) return { text: "今天截止 · " + label, danger: true };
  if (day === 1) return { text: "明天截止 · " + label, danger: true };
  if (day <= 3) return { text: "剩 " + day + " 天 · " + label, danger: true };
  return { text: label, danger: false };
}

function defaultDue(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " 23:59";
}

export default function HomeworkScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tables, activeId } = useSchedule();
  const active = tables.find((t) => t.id === activeId) ?? tables[0];
  const courses = active?.courses ?? [];

  const [list, setList] = useState<Homework[]>([]);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [courseId, setCourseId] = useState("");
  const [due, setDue] = useState(defaultDue());

  const load = useCallback(async () => setList(await loadHomework()), []);
  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(() => {
    return [...list].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const ta = a.due ? new Date(a.due).getTime() : Number.MAX_SAFE_INTEGER;
      const tb = b.due ? new Date(b.due).getTime() : Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });
  }, [list]);

  const pending = list.filter((h) => !h.done).length;
  const overdue = list.filter((h) => !h.done && h.due && new Date(h.due).getTime() < Date.now()).length;

  const submit = async () => {
    if (!text.trim()) {
      Alert.alert("请填写作业内容");
      return;
    }
    let dueIso: string | undefined;
    if (due.trim()) {
      const parsed = new Date(due.trim().replace(" ", "T"));
      if (!Number.isFinite(parsed.getTime())) {
        Alert.alert("截止时间格式不对", "请按 2026-11-30 23:59 的格式填写。");
        return;
      }
      dueIso = parsed.toISOString();
    }
    await addHomework(courseId, new Date().toISOString().slice(0, 10), text.trim(), dueIso);
    setText("");
    setCourseId("");
    setDue(defaultDue());
    setOpen(false);
    await load();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={styles.head}>
        <View>
          <Text style={styles.title}>作业 DDL</Text>
          <Text style={styles.sub}>待完成 {pending} 条 · 已逾期 {overdue} 条</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setOpen(true)}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.addText}>新增</Text>
        </Pressable>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="checkbox-outline" size={24} color={colors.faint} />
          <Text style={styles.emptyText}>还没有作业，点右上角新增一条</Text>
        </View>
      ) : (
        sorted.map((h) => {
          const dueInfo = formatDue(h.due);
          const course = courses.find((c) => c.id === h.courseId);
          return (
            <View key={h.id} style={styles.row}>
              <Pressable hitSlop={8} onPress={async () => setList(await toggleHomework(h.id))}>
                <Ionicons name={h.done ? "checkbox" : "square-outline"} size={20} color={h.done ? colors.brand : colors.faint} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemText, h.done && { color: colors.faint, textDecorationLine: "line-through" }]}>{h.text}</Text>
                <View style={styles.metaRow}>
                  {course ? <Text style={styles.course}>{course.name}</Text> : null}
                  <Text style={[styles.due, dueInfo.danger && { color: colors.danger }]}>{dueInfo.text}</Text>
                </View>
              </View>
              <Pressable hitSlop={8} onPress={async () => setList(await deleteHomework(h.id))}>
                <Ionicons name="trash-outline" size={16} color={colors.faint} />
              </Pressable>
            </View>
          );
        })
      )}

      <Text style={styles.tip}>作业会按截止时间排序；逾期和三天内截止会标红。课程详情里添加的作业也会出现在这里。</Text>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.mask}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>新增作业</Text>
              <Pressable onPress={() => setOpen(false)}><Ionicons name="close" size={22} color={colors.sub} /></Pressable>
            </View>
            <TextInput value={text} onChangeText={setText} placeholder="作业内容，如 高数习题 3.1" placeholderTextColor={colors.faint} style={styles.input} />
            <Text style={styles.label}>关联课程（选填）</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              <Pressable style={[styles.chip, !courseId && styles.chipOn]} onPress={() => setCourseId("")}><Text style={[styles.chipText, !courseId && { color: "#FFFFFF" }]}>不关联</Text></Pressable>
              {courses.map((c) => (
                <Pressable key={c.id} style={[styles.chip, courseId === c.id && styles.chipOn]} onPress={() => setCourseId(c.id)}>
                  <Text style={[styles.chipText, courseId === c.id && { color: "#FFFFFF" }]} numberOfLines={1}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.label}>截止时间</Text>
            <TextInput value={due} onChangeText={setDue} placeholder="2026-11-30 23:59" placeholderTextColor={colors.faint} style={styles.input} />
            <Pressable style={styles.primary} onPress={submit}><Text style={styles.primaryText}>保存</Text></Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
    title: { fontSize: 20, fontWeight: "800", color: colors.ink },
    sub: { fontSize: 11, color: colors.faint, marginTop: 4 },
    addBtn: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.brand, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9 },
    addText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "600" },
    empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
    emptyText: { fontSize: 12, color: colors.faint },
    row: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 8 },
    itemText: { fontSize: 13.5, color: colors.ink, lineHeight: 20 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" },
    course: { fontSize: 10.5, color: colors.brand, backgroundColor: colors.brandSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
    due: { fontSize: 10.5, color: colors.faint },
    tip: { fontSize: 10.5, color: colors.faint, lineHeight: 17, marginTop: 12 },
    mask: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
    sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    sheetTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
    input: { height: 44, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 13, color: colors.ink, backgroundColor: colors.fieldBg },
    label: { fontSize: 11.5, color: colors.sub, marginTop: 14, marginBottom: 6 },
    chip: { maxWidth: 150, paddingHorizontal: 12, height: 32, borderRadius: 8, borderWidth: 1, borderColor: colors.fieldBorder, justifyContent: "center" },
    chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
    chipText: { fontSize: 11.5, color: colors.sub },
    primary: { marginTop: 18, height: 46, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  });