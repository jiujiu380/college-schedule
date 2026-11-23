import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { getAccountToken } from "../lib/account";
import { clearLogs, dlog, getLogs, logsText, subscribeLogs } from "../lib/debug-log";
import { downloadCloud, uploadCloud } from "../lib/cloud-sync";
import { ensureChannel, ensureNotifyPermission } from "../lib/notifications";
import { useSchedule } from "../lib/schedule-store";
import { useTheme } from "../lib/theme-context";
import { loadMemos } from "../lib/memos";
import { loadEvents } from "../lib/events";
import { writeWidgetData } from "../lib/widget-data";
import { fetchSiteInfo, getSiteBase } from "../lib/site-api";
import { Colors, radius } from "../theme";

type Status = { text: string; tone: "ok" | "err" | "info" } | null;

export default function DeveloperScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tables, activeId, activeTable, courses, week } = useSchedule();
  const [status, setStatus] = useState<Status>(null);
  const [logs, setLogs] = useState(getLogs());
  const [scheduled, setScheduled] = useState<number | null>(null);
  const [channels, setChannels] = useState<string>("—");
  const [tokenState, setTokenState] = useState("检查中…");

  useEffect(() => subscribeLogs(() => setLogs(getLogs())), []);
  useEffect(() => {
    getAccountToken().then((t) => setTokenState(t ? "已登录（有 token）" : "未登录"));
    refreshNotifyState();
  }, []);

  const report = (text: string, tone: "ok" | "err" | "info" = "info") => {
    setStatus({ text, tone });
    dlog(tone === "err" ? "error" : "info", text);
  };

  const refreshNotifyState = async () => {
    try {
      const list = await Notifications.getAllScheduledNotificationsAsync();
      setScheduled(list.length);
      if (Platform.OS === "android") {
        const ch = await Notifications.getNotificationChannelsAsync();
        setChannels(ch.map((c) => c.name || c.id).join(" / ") || "无");
      } else {
        setChannels("iOS 无渠道概念");
      }
    } catch (e) {
      dlog("error", "读取通知状态失败：" + String(e));
    }
  };

  const push3s = async () => {
    const ok = await ensureNotifyPermission();
    if (!ok) {
      report("通知权限未开启，请到系统设置允许通知", "err");
      return;
    }
    await ensureChannel();
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: "测试推送", body: "这是 3 秒后触发的本地通知", sound: "default" },
        trigger: Platform.OS === "android"
          ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, repeats: false, channelId: "class-reminders" }
          : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, repeats: false },
      });
      report("已排期，3 秒后弹出（id " + id.slice(0, 8) + "…）", "ok");
      refreshNotifyState();
    } catch (e) {
      report("排期失败：" + String(e instanceof Error ? e.message : e), "err");
    }
  };

  const pushNow = async () => {
    const ok = await ensureNotifyPermission();
    if (!ok) return report("通知权限未开启", "err");
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({ content: { title: "立即测试", body: "本地通知通道正常" }, trigger: null });
    report("已发送立即通知", "ok");
    refreshNotifyState();
  };

  const cancelAll = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    report("已取消全部已排期通知", "ok");
    refreshNotifyState();
  };

  const rewriteWidget = async () => {
    await writeWidgetData({ tableName: activeTable.name, week, courses: activeTable.courses, periods: activeTable.periods, startDate: activeTable.startDate });
    const dir = FileSystem.documentDirectory ?? "";
    report("已重写 widget-data.json（" + dir + "widget-data.json）", "ok");
  };

  const pingSite = async () => {
    const started = Date.now();
    try {
      const info = await fetchSiteInfo();
      const base = await getSiteBase();
      report("官网 " + base + " 正常 · " + (Date.now() - started) + "ms · " + info.name, "ok");
    } catch (e) {
      report("官网不可用：" + String(e instanceof Error ? e.message : e), "err");
    }
  };

  const pingWeather = async () => {
    const started = Date.now();
    try {
      const res = await fetch("https://weather.cma.cn/api/autocomplete?q=" + encodeURIComponent("呼和浩特"));
      const j = await res.json();
      const first = Array.isArray(j?.data) ? String(j.data[0] ?? "") : "";
      report("中央气象台接口 " + (res.ok ? "正常" : "HTTP " + res.status) + " · " + (Date.now() - started) + "ms · " + first.split("|").slice(0, 2).join(" "), res.ok ? "ok" : "err");
    } catch (e) {
      report("天气接口失败：" + String(e instanceof Error ? e.message : e), "err");
    }
  };

  const cloudTest = async () => {
    const token = await getAccountToken();
    if (!token) return report("未登录，无法测试云同步", "err");
    try {
      const cloud = await downloadCloud();
      const data = cloud.data;
      const size = data ? JSON.stringify(data).length : 0;
      report("云端读取成功 · " + (cloud.updatedAt ?? "无时间") + " · " + (data ? data.tables?.length + " 张课表 / " + size + " 字节" : "暂无云端数据"), "ok");
    } catch (e) {
      report("云端读取失败：" + String(e instanceof Error ? e.message : e), "err");
    }
  };

  const cloudUpload = async () => {
    try {
      const ok = await uploadCloud(tables, activeId);
      report(ok ? "已上传当前数据到云端" : "未登录，未上传", ok ? "ok" : "err");
    } catch (e) {
      report("上传失败：" + String(e instanceof Error ? e.message : e), "err");
    }
  };

  const copyInfo = async () => {
    const [memos, events] = await Promise.all([loadMemos(), loadEvents()]);
    let perm = "unknown";
    try { perm = (await Notifications.getPermissionsAsync()).status; } catch { /* ignore */ }
    const text = [
      "知酷课程表 调试信息",
      "版本: " + (Constants.expoConfig?.version ?? "?"),
      "Expo SDK: " + (Constants.expoConfig?.sdkVersion ?? "?"),
      "平台: " + Platform.OS + " " + (Platform.Version ?? ""),
      "通知权限: " + perm,
      "已排期通知: " + (scheduled ?? "?"),
      "渠道: " + channels,
      "账号: " + tokenState,
      "课表: " + tables.length + " 张 / " + courses.length + " 门",
      "备忘录: " + memos.length + " 条 / 日程: " + events.length + " 条",
      "日志:\n" + logsText(),
    ].join("\n");
    await Clipboard.setStringAsync(text);
    report("调试信息已复制到剪贴板", "ok");
  };

  const resetTour = async () => {
    await AsyncStorage.multiRemove(["college.intro.v1", "college.onboard.v1", "college.onboard.v2"]);
    report("已重置启动介绍与新手引导，下次进主站会重新出现", "ok");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      {status ? (
        <View style={[styles.status, status.tone === "ok" ? styles.statusOk : status.tone === "err" ? styles.statusErr : styles.statusInfo]}>
          <Text style={[styles.statusText, status.tone === "ok" ? { color: "#047857" } : status.tone === "err" ? { color: "#B91C1C" } : { color: colors.brand }]}>{status.text}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>消息推送</Text>
      <View style={styles.card}>
        <Pressable style={[styles.row, styles.divider]} onPress={push3s}>
          <Ionicons name="notifications-outline" size={18} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>3 秒后推送测试</Text>
            <Text style={styles.sub}>验证通知权限、渠道与排期</Text>
          </View>
          <Ionicons name="play" size={15} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={pushNow}>
          <Ionicons name="flash-outline" size={18} color={colors.sub} />
          <Text style={styles.label}>立即发送通知</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={cancelAll}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={styles.label}>取消全部已排期通知</Text>
          <Text style={styles.value}>{scheduled ?? "?"} 条</Text>
        </Pressable>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>渠道</Text>
          <Text style={styles.infoValue} numberOfLines={2}>{channels}</Text>
        </View>
      </View>

      <Pressable style={[styles.row, styles.divider, { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, marginBottom: 4, paddingHorizontal: 14 }]} onPress={() => router.push("/background")}>
        <Ionicons name="rocket-outline" size={18} color={colors.brand} />
        <Text style={styles.label}>后台保活 / 自启动设置</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.faint} />
      </Pressable>

      <Text style={styles.section}>数据与同步</Text>
      <View style={styles.card}>
        <Pressable style={[styles.row, styles.divider]} onPress={rewriteWidget}>
          <Ionicons name="grid-outline" size={18} color={colors.sub} />
          <Text style={styles.label}>重写桌面小组件数据</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={cloudTest}>
          <Ionicons name="cloud-download-outline" size={18} color={colors.sub} />
          <Text style={styles.label}>读取云端数据（不覆盖）</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.row, styles.divider]} onPress={cloudUpload}>
          <Ionicons name="cloud-upload-outline" size={18} color={colors.sub} />
          <Text style={styles.label}>上传当前数据到云端</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>账号</Text>
          <Text style={styles.infoValue}>{tokenState}</Text>
        </View>
      </View>

      <Text style={styles.section}>网络连通性</Text>
      <View style={styles.card}>
        <Pressable style={[styles.row, styles.divider]} onPress={pingSite}>
          <Ionicons name="globe-outline" size={18} color={colors.sub} />
          <Text style={styles.label}>测试官网接口</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={styles.row} onPress={pingWeather}>
          <Ionicons name="partly-sunny-outline" size={18} color={colors.sub} />
          <Text style={styles.label}>测试中央气象台接口</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
      </View>

      <Text style={styles.section}>应用信息</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>版本</Text><Text style={styles.infoValue}>{Constants.expoConfig?.version ?? "?"} · build {Constants.expoConfig?.android?.versionCode ?? "?"}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Expo SDK</Text><Text style={styles.infoValue}>{Constants.expoConfig?.sdkVersion ?? "?"}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>平台</Text><Text style={styles.infoValue}>{Platform.OS} {String(Platform.Version)}</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>课表 / 课程</Text><Text style={styles.infoValue}>{tables.length} 张 / {courses.length} 门</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>通知权限</Text><Text style={styles.infoValue}>{scheduled === null ? "读取中" : "见上方渠道"}</Text></View>
        <Pressable style={[styles.row, styles.divider, { marginTop: 6 }]} onPress={copyInfo}>
          <Ionicons name="copy-outline" size={18} color={colors.sub} />
          <Text style={styles.label}>复制调试信息</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
      </View>

      <Text style={styles.section}>其他</Text>
      <View style={styles.card}>
        <Pressable style={[styles.row, styles.divider]} onPress={resetTour}>
          <Ionicons name="refresh-outline" size={18} color={colors.sub} />
          <Text style={styles.label}>重置启动介绍与新手引导</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={styles.row} onPress={() => { clearLogs(); setLogs([]); }}>
          <Ionicons name="list-outline" size={18} color={colors.sub} />
          <Text style={styles.label}>清空调试日志</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
      </View>

      <Text style={styles.section}>调试日志</Text>
      <View style={styles.logCard}>
        {logs.length === 0 ? <Text style={styles.logEmpty}>暂无日志</Text> : null}
        {logs.slice(0, 20).map((l, i) => (
          <Text key={l.t + "-" + i} style={[styles.logLine, l.level === "error" ? { color: colors.danger } : l.level === "warn" ? { color: colors.warnText } : { color: colors.sub }]}>
            {new Date(l.t).toLocaleTimeString()} {l.msg}
          </Text>
        ))}
      </View>
      <Text style={styles.footer}>开发者选项仅用于排查问题，操作会影响通知、云端数据与引导状态。</Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    section: { fontSize: 12, color: colors.faint, marginTop: 18, marginBottom: 8, marginLeft: 2 },
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
    label: { flex: 1, fontSize: 13.5, color: colors.ink },
    sub: { fontSize: 10.5, color: colors.faint, marginTop: 3 },
    value: { fontSize: 12, color: colors.faint },
    infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
    infoLabel: { fontSize: 12, color: colors.faint },
    infoValue: { flex: 1, fontSize: 12, color: colors.ink, textAlign: "right" },
    status: { borderRadius: radius.sm, borderWidth: 1, padding: 12 },
    statusOk: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
    statusErr: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
    statusInfo: { backgroundColor: colors.brandSoft, borderColor: colors.infoBorder },
    statusText: { fontSize: 12, lineHeight: 18 },
    logCard: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12, minHeight: 80 },
    logLine: { fontSize: 10.5, lineHeight: 17, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
    logEmpty: { fontSize: 11, color: colors.faint },
    footer: { fontSize: 10.5, color: colors.faint, textAlign: "center", marginTop: 18, lineHeight: 17 },
  });