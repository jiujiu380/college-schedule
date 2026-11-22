import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { cancelAllReminders, ensureNotifyPermission, getLeadMinutes, isNotifyEnabled, scheduleClassReminders, setLeadMinutes, setNotifyEnabled } from "../../lib/notifications";
import { useSchedule } from "../../lib/schedule-store";
import { useTheme } from "../../lib/theme-context";
import { useUpdate } from "../../lib/update-store";
import { markTourSeen } from "../../components/TourOverlay";
import { THEME_PRESETS } from "../../lib/theme-presets";
import { Colors, ThemeMode, radius } from "../../theme";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode, setMode, colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {
    tables, activeId, switchTable, addTable, deleteTable, updateTable,
    courses, periods, ui, preset, seasonText, source, activeTable,
  } = useSchedule();
  const { result: updateResult, checking: updateChecking } = useUpdate();
  const [notify, setNotify] = useState(false);
  const [lead, setLead] = useState(10);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isNotifyEnabled().then(setNotify);
    getLeadMinutes().then(setLead);
  }, []);

  const onToggleNotify = async (next: boolean) => {
    if (Platform.OS === "web") {
      Alert.alert("暂不支持", "网页版无法申请通知权限，请在手机端（APK）中开启。");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (next) {
        const granted = await ensureNotifyPermission();
        if (!granted) {
          Alert.alert("通知权限未开启", "请在系统设置中允许发送通知后重试。");
          return;
        }
        const count = await scheduleClassReminders(courses, periods, { days: 14, leadMinutes: lead });
        await setNotifyEnabled(true);
        setNotify(true);
        Alert.alert("已开启", `已按提前 ${lead} 分钟排期 ${count} 条提醒。`);
      } else {
        await cancelAllReminders();
        await setNotifyEnabled(false);
        setNotify(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const onLead = async (v: number) => {
    setLead(v);
    await setLeadMinutes(v);
    if (notify) {
      await scheduleClassReminders(courses, periods, { days: 14, leadMinutes: v });
      Alert.alert("已更新", `提醒提前量改为 ${v} 分钟，已重新排期。`);
    }
  };

  const onAdd = () => addTable(`课表 ${tables.length + 1}`);
  const onDelete = (id: string) => {
    if (tables.length <= 1) {
      Alert.alert("无法删除", "至少保留一张课表。");
      return;
    }
    Alert.alert("删除课表", "删除后数据不可恢复，确定继续？", [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: () => deleteTable(id) },
    ]);
  };

  const stepper = (label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, format?: (v: number) => string) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.stepBox}>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, +(value - step).toFixed(2)))}><Text style={styles.stepText}>−</Text></Pressable>
        <Text style={styles.stepValue}>{format ? format(value) : value}</Text>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.min(max, +(value + step).toFixed(2)))}><Text style={styles.stepText}>＋</Text></Pressable>
      </View>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Text style={styles.title}>我的</Text>

      <View style={[styles.card, { marginTop: 14 }]}>
        <View style={styles.profile}>
          <View style={styles.avatar}><Ionicons name="calendar" size={22} color="#FFFFFF" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{activeTable.name}</Text>
            <Text style={styles.role}>{tables.length} 张课表 · {courses.length} 门课程 · 完全离线</Text>
          </View>
          <Text style={styles.statusTag}>{source === "demo" ? "DEMO" : "LOCAL"}</Text>
        </View>
      </View>

      <Text style={styles.section}>课表管理</Text>
      <View style={styles.card}>
        {tables.map((t) => (
          <Pressable key={t.id} style={[styles.row, styles.divider]} onPress={() => switchTable(t.id)}>
            <Ionicons name={activeId === t.id ? "radio-button-on" : "radio-button-off"} size={17} color={activeId === t.id ? colors.brand : colors.faint} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{t.name}</Text>
              <Text style={styles.rowSub}>{t.courses.length} 门 · {t.totalWeeks} 周</Text>
            </View>
            <Pressable onPress={() => onDelete(t.id)} hitSlop={8}><Ionicons name="trash-outline" size={16} color={colors.faint} /></Pressable>
          </Pressable>
        ))}
        <Pressable style={styles.addBtn} onPress={onAdd}>
          <Ionicons name="add" size={16} color={colors.brand} />
          <Text style={styles.addText}>新建课表</Text>
        </Pressable>
        <Pressable style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.line }]} onPress={() => router.push("/semester")}>
          <Ionicons name="calendar-number-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>开学时间</Text>
          <Text style={styles.rowValue}>{activeTable.startDate}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.line }]} onPress={() => router.push("/periods")}>
          <Ionicons name="time-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>节次时间</Text>
          <Text style={styles.rowValue}>第 1 节 {periods[0]?.start ?? "--"} 起</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
      </View>

      <Text style={styles.section}>外观</Text>
      <View style={styles.card}>
        <Text style={styles.subLabel}>配色</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeRow}>
          {THEME_PRESETS.map((p) => {
            const active = activeTable.themeId === p.id;
            return (
              <Pressable key={p.id} style={[styles.themeCard, active && { borderColor: p.brand }]} onPress={() => updateTable({ themeId: p.id })}>
                <View style={styles.themePreview}>
                  {p.tints.slice(0, 3).map((t, i) => (
                    <View key={i} style={[styles.themeBar, { backgroundColor: t.bg, borderLeftColor: t.bar }]}>
                      <View style={[styles.themeBarInner, { backgroundColor: t.fg }]} />
                    </View>
                  ))}
                </View>
                <Text style={[styles.themeLabel, active && { color: p.brand, fontWeight: "600" }]}>{p.name}</Text>
                {active ? <View style={[styles.themeCheck, { backgroundColor: p.brand }]}><Ionicons name="checkmark" size={10} color="#FFFFFF" /></View> : null}
              </Pressable>
            );
          })}
        </ScrollView>
        {stepper("格子高度", ui.rowHeight, 72, 132, 8, (v) => updateTable({ ui: { ...ui, rowHeight: v } }))}
        {stepper("圆角", ui.radius, 0, 10, 1, (v) => updateTable({ ui: { ...ui, radius: v } }))}
        {stepper("透明度", ui.opacity, 0.5, 1, 0.05, (v) => updateTable({ ui: { ...ui, opacity: v } }), (v) => `${Math.round(v * 100)}%`)}
        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.line }]}>
          <Text style={styles.rowLabel}>分隔线</Text>
          <Switch value={ui.dividers} onValueChange={(v) => updateTable({ ui: { ...ui, dividers: v } })} trackColor={{ true: colors.brand, false: colors.line }} thumbColor={ui.dividers ? "#FFFFFF" : colors.faint} />
        </View>
        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.line }]}>
          <Text style={styles.rowLabel}>深色模式</Text>
          <View style={styles.segment}>
            {([{ key: "system", label: "系统" }, { key: "light", label: "浅色" }, { key: "dark", label: "深色" }] as { key: ThemeMode; label: string }[]).map((m) => (
              <Pressable key={m.key} onPress={() => setMode(m.key)} style={[styles.segmentItem, mode === m.key && styles.segmentItemActive]}>
                <Text style={[styles.segmentText, mode === m.key && { color: colors.brand, fontWeight: "600" }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.section}>上课提醒</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={17} color={colors.sub} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>开启提醒</Text>
            <Text style={styles.rowSub}>本地通知，无需后台常驻</Text>
          </View>
          <Switch value={notify} onValueChange={onToggleNotify} disabled={busy} trackColor={{ true: colors.brand, false: colors.line }} thumbColor={notify ? "#FFFFFF" : colors.faint} />
        </View>
        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.line }]}>
          <Text style={styles.rowLabel}>提前量</Text>
          <View style={styles.segment}>
            {[5, 10, 15, 30].map((m) => (
              <Pressable key={m} onPress={() => onLead(m)} style={[styles.segmentItem, lead === m && styles.segmentItemActive]}>
                <Text style={[styles.segmentText, lead === m && { color: colors.brand, fontWeight: "600" }]}>{m} 分</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.section}>通用</Text>
      <View style={styles.card}>
        <Pressable style={[styles.row, styles.divider]} onPress={() => router.push("/import")}>
          <Ionicons name="cloud-download-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>导入课表</Text>
          <Text style={styles.rowValue}>网页 / 源码 / CSV</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={() => router.push("/announcements")}>
          <Ionicons name="megaphone-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>公告</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={() => router.push("/tickets")}>
          <Ionicons name="chatbubbles-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>工单反馈</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={() => router.push("/backup")}>
          <Ionicons name="save-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>备份与恢复</Text>
          <Text style={styles.rowValue}>{tables.length} 张课表</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={() => router.push("/update")}>
          <Ionicons name="refresh-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>检查更新</Text>
          <Text style={styles.rowValue}>{updateChecking ? "检查中…" : updateResult?.status === "available" ? `v${updateResult.latest}` : updateResult?.status === "latest" ? "已是最新" : "未检查"}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={() => router.push("/agreement?view=1")}>
          <Ionicons name="document-text-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>用户协议与隐私政策</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={() => router.push("/contact")}>
          <Ionicons name="mail-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>联系作者</Text>
          <Text style={styles.rowValue}>class.zcoow.cn</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={() => { void markTourSeen().then(() => {}); router.push("/home?tour=1"); }}>
          <Ionicons name="help-circle-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>新手指引</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={styles.row} onPress={() => router.push("/sponsor")}>
          <Ionicons name="heart-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>赞助支持</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
      </View>

      <Text style={styles.footer}>知酷课程表 · 完全离线 · 数据仅保存在本机</Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    title: { fontSize: 22, fontWeight: "700", color: colors.ink, paddingHorizontal: 16 },
    card: { backgroundColor: colors.surface, marginHorizontal: 16, marginTop: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
    profile: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    name: { fontSize: 16, fontWeight: "600", color: colors.ink },
    role: { fontSize: 11.5, color: colors.sub, marginTop: 4 },
    statusTag: { fontSize: 10, fontWeight: "600", color: colors.success, borderWidth: 1, borderColor: colors.success, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
    section: { fontSize: 12, color: colors.faint, marginTop: 22, marginBottom: 2, marginLeft: 18 },
    row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
    rowLabel: { flex: 1, fontSize: 13.5, color: colors.ink },
    rowSub: { fontSize: 10.5, color: colors.faint, marginTop: 3 },
    rowValue: { fontSize: 12, color: colors.faint },
    addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 13 },
    addText: { fontSize: 13, color: colors.brand, fontWeight: "500" },
    subLabel: { fontSize: 12, color: colors.sub, paddingHorizontal: 14, paddingTop: 12 },
    themeRow: { gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
    themeCard: { width: 92, borderRadius: 12, borderWidth: 2, borderColor: colors.line, padding: 6, backgroundColor: colors.bg },
    themePreview: { borderRadius: 8, overflow: "hidden", gap: 3 },
    themeBar: { height: 16, borderLeftWidth: 3, justifyContent: "center", paddingHorizontal: 5 },
    themeBarInner: { height: 3, width: "60%", borderRadius: 2, opacity: 0.85 },
    themeLabel: { fontSize: 11.5, color: colors.ink, marginTop: 7, textAlign: "center" },
    themeCheck: { position: "absolute", right: -5, top: -5, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    stepBox: { flexDirection: "row", alignItems: "center", gap: 8 },
    stepBtn: { width: 28, height: 26, borderRadius: 4, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center" },
    stepText: { fontSize: 14, color: colors.ink },
    stepValue: { fontSize: 12.5, color: colors.ink, minWidth: 42, textAlign: "center" },
    segment: { flexDirection: "row", backgroundColor: colors.chipBg, borderRadius: radius.sm, padding: 2, gap: 2 },
    segmentItem: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 3 },
    segmentItemActive: { backgroundColor: colors.surface },
    segmentText: { fontSize: 11, color: colors.sub },
    footer: { textAlign: "center", fontSize: 11, color: colors.faint, marginTop: 22 },
  });