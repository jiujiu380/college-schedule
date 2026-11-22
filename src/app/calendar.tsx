import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { CalendarEvent, addEvent, loadEvents, removeEvent } from "../lib/events";
import { useSchedule } from "../lib/schedule-store";
import { useTheme } from "../lib/theme-context";
import { weekOfDate } from "../lib/timetables";
import { Course } from "../lib/schedule";
import { Colors, radius } from "../theme";

const WEEK = ["一", "二", "三", "四", "五", "六", "日"];

function iso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { courses, activeTable, periods } = useSchedule();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(iso(today));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");

  useEffect(() => { loadEvents().then(setEvents); }, []);

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const list: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [cursor]);

  const coursesOn = (date: Date): Course[] => {
    const dateIso = iso(date);
    const week = weekOfDate(activeTable.startDate, new Date(dateIso + "T12:00:00"));
    const wd = ((date.getDay() + 6) % 7) + 1;
    return courses.filter((c) => c.weekday === wd && c.weeks.includes(week));
  };

  const eventsOn = (dateIso: string) => events.filter((e) => e.date === dateIso).sort((a, b) => a.time.localeCompare(b.time));

  const selectedCourses = coursesOn(new Date(selected + "T12:00:00"));
  const selectedEvents = eventsOn(selected);

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert("请填写标题");
      return;
    }
    const next = await addEvent({ title: title.trim(), date: selected, time });
    setEvents(next);
    setTitle("");
    setAdding(false);
  };

  const remove = (id: string) => {
    Alert.alert("删除日程", "确定删除？", [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: async () => setEvents(await removeEvent(id)) },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.card}>
        <View style={styles.monthHead}>
          <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} hitSlop={8}>
            <Ionicons name="chevron-back" size={18} color={colors.ink} />
          </Pressable>
          <Text style={styles.monthText}>{cursor.getFullYear()} 年 {cursor.getMonth() + 1} 月</Text>
          <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEK.map((w) => <Text key={w} style={styles.weekday}>{w}</Text>)}
        </View>

        <View style={styles.grid}>
          {cells.map((d, i) => {
            if (!d) return <View key={"empty" + i} style={styles.cell} />;
            const dateIso = iso(d);
            const isToday = dateIso === iso(today);
            const isSelected = dateIso === selected;
            const hasCourse = coursesOn(d).length > 0;
            const hasEvent = eventsOn(dateIso).length > 0;
            return (
              <Pressable key={dateIso} style={styles.cell} onPress={() => setSelected(dateIso)}>
                <View style={[styles.dayNum, isSelected && { backgroundColor: colors.brand }, isToday && !isSelected && { borderWidth: 1, borderColor: colors.brand }]}>
                  <Text style={[styles.dayText, isSelected && { color: "#FFFFFF" }, isToday && !isSelected && { color: colors.brand }]}>{d.getDate()}</Text>
                </View>
                <View style={styles.dots}>
                  {hasCourse ? <View style={[styles.dot, { backgroundColor: colors.brand }]} /> : null}
                  {hasEvent ? <View style={[styles.dot, { backgroundColor: colors.danger }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.dayHead}>
          <Text style={styles.dayTitle}>{selected}</Text>
          <Pressable style={styles.addBtn} onPress={() => setAdding(true)}>
            <Ionicons name="add" size={16} color={colors.brand} />
            <Text style={styles.addText}>添加日程</Text>
          </Pressable>
        </View>

        {selectedCourses.map((c) => (
          <View key={c.id} style={styles.rowItem}>
            <Text style={styles.rowTime}>{periods[c.startPeriod - 1]?.start}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{c.name}</Text>
              <Text style={styles.rowMeta}>{c.location ?? ""} · {c.startPeriod}-{c.endPeriod} 节</Text>
            </View>
            <Text style={styles.tag}>课程</Text>
          </View>
        ))}

        {selectedEvents.map((e) => (
          <Pressable key={e.id} style={styles.rowItem} onLongPress={() => remove(e.id)}>
            <Text style={styles.rowTime}>{e.time}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{e.title}</Text>
              {e.note ? <Text style={styles.rowMeta}>{e.note}</Text> : null}
            </View>
            <Text style={[styles.tag, { color: colors.danger }]}>日程</Text>
          </Pressable>
        ))}

        {!selectedCourses.length && !selectedEvents.length ? <Text style={styles.empty}>这一天没有课程和日程</Text> : null}
        <Text style={styles.hint}>长按日程可删除；日程会提前 10 分钟提醒</Text>
      </View>

      <Modal visible={adding} transparent animationType="fade" onRequestClose={() => setAdding(false)}>
        <Pressable style={styles.mask} onPress={() => setAdding(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={styles.sheetTitle}>添加日程 · {selected}</Text>
            <Text style={styles.label}>标题</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="例如：交作业" placeholderTextColor={colors.faint} style={styles.input} />
            <Text style={styles.label}>时间</Text>
            <TextInput value={time} onChangeText={setTime} placeholder="09:00" placeholderTextColor={colors.faint} style={styles.input} />
            <Pressable style={styles.primary} onPress={submit}><Text style={styles.primaryText}>保存</Text></Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 12 },
    monthHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    monthText: { fontSize: 15, fontWeight: "600", color: colors.ink },
    weekRow: { flexDirection: "row", marginTop: 14 },
    weekday: { flex: 1, textAlign: "center", fontSize: 11, color: colors.faint },
    grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
    cell: { width: "14.2857%", alignItems: "center", paddingVertical: 5 },
    dayNum: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
    dayText: { fontSize: 12.5, color: colors.ink },
    dots: { flexDirection: "row", gap: 3, height: 5, marginTop: 3 },
    dot: { width: 4, height: 4, borderRadius: 2 },
    dayHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
    dayTitle: { fontSize: 14, fontWeight: "600", color: colors.ink },
    addBtn: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.brandSoft, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7 },
    addText: { fontSize: 11.5, color: colors.brand, fontWeight: "600" },
    rowItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.line },
    rowTime: { width: 42, fontSize: 12, color: colors.sub },
    rowTitle: { fontSize: 13.5, color: colors.ink, fontWeight: "500" },
    rowMeta: { fontSize: 10.5, color: colors.faint, marginTop: 3 },
    tag: { fontSize: 10.5, color: colors.brand },
    empty: { fontSize: 12, color: colors.faint, textAlign: "center", paddingVertical: 18 },
    hint: { fontSize: 10.5, color: colors.faint, marginTop: 8 },
    mask: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, paddingBottom: 30 },
    sheetTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
    label: { fontSize: 11.5, color: colors.sub, marginTop: 12, marginBottom: 5 },
    input: { height: 42, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: 8, paddingHorizontal: 10, fontSize: 13.5, color: colors.ink, backgroundColor: colors.fieldBg },
    primary: { marginTop: 16, height: 44, borderRadius: 10, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  });
