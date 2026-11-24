import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { Exam, addExam, countdown, deleteExam, examTime, loadExams, updateExam } from "../lib/exams";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

function defaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export default function ExamsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [list, setList] = useState<Exam[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState(defaultDate());
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => setList(await loadExams()), []);
  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(() => [...list].sort((a, b) => examTime(a) - examTime(b)), [list]);
  const upcoming = sorted.filter((e) => examTime(e) >= Date.now());
  const nearest = upcoming[0];

  const openAdd = () => {
    setEditing(null);
    setName("");
    setDate(defaultDate());
    setTime("09:00");
    setLocation("");
    setNotes("");
    setOpen(true);
  };

  const openEdit = (e: Exam) => {
    setEditing(e.id);
    setName(e.name);
    setDate(e.date);
    setTime(e.time || "09:00");
    setLocation(e.location || "");
    setNotes(e.notes || "");
    setOpen(true);
  };

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert("请填写考试名称");
      return;
    }
    const parsed = new Date(date + "T" + (time || "09:00"));
    if (!Number.isFinite(parsed.getTime())) {
      Alert.alert("日期格式不对", "请按 2026-12-20 和 09:00 填写。");
      return;
    }
    const input = { name: name.trim(), date, time, location: location.trim(), notes: notes.trim() };
    if (editing) await updateExam(editing, input);
    else await addExam(input);
    setOpen(false);
    await load();
  };

  const remove = (e: Exam) => {
    Alert.alert("删除考试", `确定删除「${e.name}」？`, [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: async () => setList(await deleteExam(e.id)) },
    ]);
  };

  const cd = nearest ? countdown(examTime(nearest)) : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={styles.head}>
        <View>
          <Text style={styles.title}>考试倒计时</Text>
          <Text style={styles.sub}>最近一场：{nearest ? nearest.name : "暂无安排"}</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.addText}>新增</Text>
        </Pressable>
      </View>

      {nearest && cd ? (
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>距离 {nearest.name}</Text>
          <View style={styles.countRow}>
            <Text style={styles.count}>{cd.days}</Text><Text style={styles.unit}>天</Text>
            <Text style={styles.count}>{cd.hours}</Text><Text style={styles.unit}>时</Text>
            <Text style={styles.count}>{cd.minutes}</Text><Text style={styles.unit}>分</Text>
          </View>
          <Text style={styles.heroMeta}>{nearest.date} {nearest.time || ""}{nearest.location ? " · " + nearest.location : ""}</Text>
        </View>
      ) : null}

      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={24} color={colors.faint} />
          <Text style={styles.emptyText}>还没有考试安排，点右上角新增</Text>
        </View>
      ) : (
        sorted.map((e) => {
          const t = examTime(e);
          const c = countdown(t);
          const past = t < Date.now();
          return (
            <Pressable key={e.id} style={[styles.row, past && { opacity: 0.55 }]} onPress={() => openEdit(e)} onLongPress={() => remove(e)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{e.name}</Text>
                <Text style={styles.meta}>{e.date} {e.time || ""}{e.location ? " · " + e.location : ""}</Text>
                {e.notes ? <Text style={styles.notes} numberOfLines={1}>{e.notes}</Text> : null}
              </View>
              <View style={styles.badge}>
                <Text style={[styles.badgeText, c.days <= 3 && !past && { color: colors.danger }]}>
                  {past ? "已结束" : c.days === 0 ? "今天" : c.days + " 天"}
                </Text>
              </View>
            </Pressable>
          );
        })
      )}
      <Text style={styles.tip}>点考试可编辑，长按删除；首页和工具页都会显示最近一场倒计时。</Text>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.mask}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{editing ? "编辑考试" : "新增考试"}</Text>
              <Pressable onPress={() => setOpen(false)}><Ionicons name="close" size={22} color={colors.sub} /></Pressable>
            </View>
            <TextInput value={name} onChangeText={setName} placeholder="考试名称，如 高等数学期末" placeholderTextColor={colors.faint} style={styles.input} />
            <Text style={styles.label}>日期与时间</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput value={date} onChangeText={setDate} placeholder="2026-12-20" placeholderTextColor={colors.faint} style={[styles.input, { flex: 1 }]} />
              <TextInput value={time} onChangeText={setTime} placeholder="09:00" placeholderTextColor={colors.faint} style={[styles.input, { width: 90 }]} />
            </View>
            <Text style={styles.label}>地点（选填）</Text>
            <TextInput value={location} onChangeText={setLocation} placeholder="如 教学楼 A301" placeholderTextColor={colors.faint} style={styles.input} />
            <Text style={styles.label}>备注（选填）</Text>
            <TextInput value={notes} onChangeText={setNotes} placeholder="考场号、注意事项" placeholderTextColor={colors.faint} style={styles.input} />
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
    hero: { backgroundColor: "#0B1220", borderRadius: 18, padding: 20, marginBottom: 14 },
    heroLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
    countRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 8, marginBottom: 10 },
    count: { fontSize: 34, fontWeight: "800", color: "#FFFFFF", letterSpacing: -1 },
    unit: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginRight: 8 },
    heroMeta: { fontSize: 11, color: "rgba(255,255,255,0.55)" },
    empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
    emptyText: { fontSize: 12, color: colors.faint },
    row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 8 },
    name: { fontSize: 14, fontWeight: "600", color: colors.ink },
    meta: { fontSize: 11, color: colors.faint, marginTop: 4 },
    notes: { fontSize: 10.5, color: colors.sub, marginTop: 4 },
    badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, backgroundColor: colors.chipBg },
    badgeText: { fontSize: 11, fontWeight: "600", color: colors.brand },
    tip: { fontSize: 10.5, color: colors.faint, lineHeight: 17, marginTop: 12 },
    mask: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
    sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    sheetTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
    input: { height: 44, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 13, color: colors.ink, backgroundColor: colors.fieldBg },
    label: { fontSize: 11.5, color: colors.sub, marginTop: 14, marginBottom: 6 },
    primary: { marginTop: 18, height: 46, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  });
