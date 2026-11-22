import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as IntentLauncher from "expo-intent-launcher";
import * as Notifications from "expo-notifications";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useSchedule } from "../lib/schedule-store";
import { ensureNotifyPermission, getLeadMinutes, scheduleClassReminders } from "../lib/notifications";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

const OEM: Record<string, { pkg: string; cls: string; name: string }> = {
  Xiaomi: { pkg: "com.miui.securitycenter", cls: "com.miui.permcenter.autostart.AutoStartManagementActivity", name: "小米 / Redmi" },
  Redmi: { pkg: "com.miui.securitycenter", cls: "com.miui.permcenter.autostart.AutoStartManagementActivity", name: "小米 / Redmi" },
  HUAWEI: { pkg: "com.huawei.systemmanager", cls: "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity", name: "华为" },
  HONOR: { pkg: "com.hihonor.systemmanager", cls: "com.hihonor.systemmanager.startupmgr.ui.StartupNormalAppListActivity", name: "荣耀" },
  OPPO: { pkg: "com.coloros.safecenter", cls: "com.coloros.safecenter.permission.startup.StartupAppListActivity", name: "OPPO" },
  realme: { pkg: "com.coloros.safecenter", cls: "com.coloros.safecenter.permission.startup.StartupAppListActivity", name: "realme" },
  vivo: { pkg: "com.vivo.permissionmanager", cls: "com.vivo.permissionmanager.activity.BgStartUpManagerActivity", name: "vivo" },
  samsung: { pkg: "com.samsung.android.lool", cls: "com.samsung.android.sm.ui.battery.BatteryActivity", name: "三星" },
  Meizu: { pkg: "com.meizu.safe", cls: "com.meizu.safe.permission.SmartBGActivity", name: "魅族" },
  OnePlus: { pkg: "com.oneplus.security", cls: "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity", name: "一加" },
};

export default function BackgroundScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { activeTable, periods, courses } = useSchedule();
  const [perm, setPerm] = useState("读取中…");
  const [scheduled, setScheduled] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const pkg = Constants.expoConfig?.android?.package ?? "com.jiujiu380.collegeschedule";
  const brand = String((Platform.constants as any)?.Brand ?? "");
  const oem = OEM[brand] ?? null;
  const isAndroid = Platform.OS === "android";

  const refresh = async () => {
    try {
      const p = await Notifications.getPermissionsAsync();
      setPerm(p.granted ? "已允许" : "未允许");
      const list = await Notifications.getAllScheduledNotificationsAsync();
      setScheduled(list.length);
    } catch {
      setPerm("读取失败");
    }
  };

  useEffect(() => { void refresh(); }, []);

  const open = async (action: string, params?: IntentLauncher.IntentLauncherParams) => {
    if (!isAndroid) {
      Alert.alert("仅 Android 支持", "iOS 的后台机制不同，不需要这些设置。");
      return;
    }
    try {
      await IntentLauncher.startActivityAsync(action, { packageName: pkg, ...params });
    } catch (e) {
      Alert.alert("无法打开设置", "请手动在系统设置中为「知酷课程表」开启自启动 / 允许后台运行。\n" + String(e instanceof Error ? e.message : e));
    }
  };

  const openAutostart = async () => {
    if (!isAndroid) return open("");
    if (!oem) {
      Alert.alert("未识别的机型", "请到系统设置 → 应用管理 → 知酷课程表，手动允许自启动、后台运行和通知。");
      return;
    }
    try {
      await IntentLauncher.startActivityAsync("android.intent.action.MAIN", { packageName: oem.pkg, className: oem.cls });
    } catch {
      Alert.alert("打不开自启动页", "你的系统可能改了入口，请到「设置 → 应用 → 自启动」里手动开启。");
    }
  };

  const reschedule = async () => {
    setBusy(true);
    try {
      const ok = await ensureNotifyPermission();
      if (!ok) {
        Alert.alert("通知权限未开启", "请先允许通知，再恢复提醒。");
        return;
      }
      const lead = await getLeadMinutes();
      const count = await scheduleClassReminders(activeTable.courses.length ? activeTable.courses : courses, activeTable.periods.length ? activeTable.periods : periods, { leadMinutes: lead });
      await refresh();
      Alert.alert("已恢复提醒", "重新排期了 " + count + " 条上课提醒（未来 14 天）。");
    } catch (e) {
      Alert.alert("恢复失败", String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="phone-portrait-outline" size={24} color={colors.brand} /></View>
        <Text style={styles.heroTitle}>让提醒在后台也能响</Text>
        <Text style={styles.heroText}>
          Android 清理后台或「强制停止」后，系统会取消已排期的闹钟，任何 App 都无法再收到提醒。把应用加入自启动 / 电池白名单，并在重新打开 App 时自动恢复未来 14 天的提醒，可以最大限度避免漏提醒。
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>通知权限</Text><Text style={styles.infoValue}>{perm}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>已排期通知</Text><Text style={styles.infoValue}>{scheduled ?? "—"} 条</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>机型</Text><Text style={styles.infoValue}>{brand || Platform.OS}{oem ? " · " + oem.name : ""}</Text></View>
      </View>

      <Text style={styles.section}>系统设置</Text>
      <View style={styles.card}>
        <Pressable style={[styles.row, styles.divider]} onPress={openAutostart}>
          <Ionicons name="rocket-outline" size={18} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>自启动 / 后台运行</Text>
            <Text style={styles.sub}>{oem ? "打开 " + oem.name + " 的自启动管理" : "未识别机型，打开应用详情手动设置"}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={() => open("android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS", { data: "package:" + pkg })}>
          <Ionicons name="battery-charging-outline" size={18} color={colors.sub} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>忽略电池优化</Text>
            <Text style={styles.sub}>允许后台闹钟在省电模式下触发</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={() => open("android.settings.REQUEST_SCHEDULE_EXACT_ALARM", { data: "package:" + pkg })}>
          <Ionicons name="alarm-outline" size={18} color={colors.sub} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>精确闹钟权限</Text>
            <Text style={styles.sub}>Android 12+ 需要允许后才能准点提醒</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={styles.row} onPress={() => open("android.settings.APPLICATION_DETAILS_SETTINGS", { data: "package:" + pkg })}>
          <Ionicons name="settings-outline" size={18} color={colors.sub} />
          <Text style={styles.label}>应用详情 / 通知设置</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
      </View>

      <Text style={styles.section}>恢复提醒</Text>
      <View style={styles.card}>
        <Pressable style={[styles.row, styles.divider]} onPress={reschedule} disabled={busy}>
          <Ionicons name="refresh-circle-outline" size={20} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{busy ? "正在重新排期…" : "重新排期未来 14 天提醒"}</Text>
            <Text style={styles.sub}>重新打开 App 后也会自动恢复一次</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>各品牌建议</Text>
        <Text style={styles.tip}>· 小米：自启动 + 省电策略「无限制」{ "\n" }· 华为/荣耀：应用启动管理改为手动，允许自启动和后台活动{ "\n" }· OPPO/vivo：允许自启动、关联启动、后台运行{ "\n" }· 最近任务里把知酷课程表「锁定」，避免一键清理</Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    hero: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 18 },
    heroIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    heroTitle: { fontSize: 17, fontWeight: "700", color: colors.ink, marginTop: 12 },
    heroText: { fontSize: 12, color: colors.sub, lineHeight: 20, marginTop: 8 },
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: "hidden", marginTop: 10 },
    infoRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line },
    infoLabel: { fontSize: 12.5, color: colors.faint },
    infoValue: { fontSize: 12.5, color: colors.ink },
    section: { fontSize: 12, color: colors.faint, marginTop: 18, marginBottom: 8, marginLeft: 2 },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
    label: { fontSize: 13.5, color: colors.ink },
    sub: { fontSize: 10.5, color: colors.faint, marginTop: 3, lineHeight: 15 },
    tipCard: { marginTop: 16, padding: 16, borderRadius: radius.md, backgroundColor: colors.chipBg, borderWidth: 1, borderColor: colors.line },
    tipTitle: { fontSize: 12.5, fontWeight: "600", color: colors.ink, marginBottom: 8 },
    tip: { fontSize: 11.5, color: colors.sub, lineHeight: 20 },
  });
