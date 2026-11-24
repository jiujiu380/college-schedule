import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { pickImportFile, writeBackupFile } from "../lib/file-import";
import { Snapshot, createSnapshot, deleteSnapshot, loadSnapshots, restoreSnapshot, snapshotCourses, snapshotTables } from "../lib/backup-history";
import { useSchedule } from "../lib/schedule-store";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function BackupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tables, activeId, restore } = useSchedule();
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Snapshot[]>([]);

  const loadHistory = useCallback(async () => setHistory(await loadSnapshots()), []);
  useFocusEffect(useCallback(() => { void loadHistory(); }, [loadHistory]));

  const backupNow = async () => {
    const snap = await createSnapshot(true);
    await loadHistory();
    Alert.alert(snap ? "已备份" : "暂无数据", snap ? "本机历史版本已保存。" : "还没有课表可以备份。");
  };

  const restoreLocal = (snap: Snapshot) => {
    Alert.alert("恢复历史版本", `将恢复 ${new Date(snap.at).toLocaleString()} 的本机数据，当前课表会被覆盖。`, [
      { text: "取消", style: "cancel" },
      {
        text: "恢复",
        style: "destructive",
        onPress: async () => {
          const restored = await restoreSnapshot(snap.id);
          const t = restored ? snapshotTables(restored) : null;
          if (t) restore(t.tables, t.activeId);
          Alert.alert("已恢复", "课表与设置已恢复；备忘录、作业、考试会在重新进入页面后刷新。", [
            { text: "好", onPress: () => router.replace("/schedule") },
          ]);
        },
      },
    ]);
  };

  const removeSnapshot = (snap: Snapshot) => {
    Alert.alert("删除历史版本", "只删除这条本机备份，不影响当前数据。", [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: async () => setHistory(await deleteSnapshot(snap.id)) },
    ]);
  };

  const courseCount = tables.reduce((sum, t) => sum + t.courses.length, 0);

  const onExport = async () => {
    setBusy(true);
    try {
      const payload = { app: "college-schedule", version: 1, exportedAt: new Date().toISOString(), tables, activeId };
      const uri = await writeBackupFile(payload);
      const json = JSON.stringify(payload);
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: "导出课表备份" });
      } else {
        await Clipboard.setStringAsync(json);
        Alert.alert("已复制", "备份内容已复制到剪贴板，可粘贴保存到文件或聊天工具。");
      }
    } catch (e) {
      Alert.alert("导出失败", String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  const onImport = async () => {
    setBusy(true);
    try {
      const picked = await pickImportFile();
      if (!picked?.text) return;
      const parsed = JSON.parse(picked.text);
      const next = Array.isArray(parsed?.tables) ? parsed.tables : Array.isArray(parsed) ? parsed : null;
      if (!next || !next.length) {
        Alert.alert("备份无效", "文件里没有找到 tables 数组。");
        return;
      }
      Alert.alert("确认恢复", `将用备份里的 ${next.length} 张课表覆盖当前数据，确定？`, [
        { text: "取消", style: "cancel" },
        {
          text: "恢复",
          style: "destructive",
          onPress: () => {
            restore(next, parsed?.activeId ?? next[0].id);
            Alert.alert("已恢复", "课表已从备份恢复。");
            router.replace("/schedule");
          },
        },
      ]);
    } catch (e) {
      Alert.alert("恢复失败", String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={styles.card}>
        <Text style={styles.title}>备份与恢复</Text>
        <Text style={styles.desc}>
          当前共 {tables.length} 张课表、{courseCount} 门课程。备份是一个 JSON 文件，包含所有课表的课程、节次时间、配色与布局，换机或重装后导入即可恢复。
        </Text>
      </View>

      <Pressable style={[styles.action, { backgroundColor: colors.brand, borderColor: colors.brand }]} onPress={onExport} disabled={busy}>
        <Ionicons name="share-outline" size={18} color="#FFFFFF" />
        <Text style={styles.actionPrimary}>导出全部课表</Text>
      </Pressable>
      <Pressable style={styles.action} onPress={onImport} disabled={busy}>
        <Ionicons name="download-outline" size={18} color={colors.ink} />
        <Text style={styles.actionText}>从备份恢复</Text>
      </Pressable>

      <View style={styles.card}>
        <View style={styles.historyHead}>
          <Text style={styles.sub}>本机历史版本</Text>
          <Pressable onPress={backupNow}><Text style={styles.link}>立即备份</Text></Pressable>
        </View>
        {history.length === 0 ? <Text style={styles.desc}>还没有历史版本，App 每天首次打开会自动备份一次。</Text> : null}
        {history.map((snap) => (
          <Pressable key={snap.id} style={styles.historyRow} onPress={() => restoreLocal(snap)} onLongPress={() => removeSnapshot(snap)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTime}>{new Date(snap.at).toLocaleString()}</Text>
              <Text style={styles.historyMeta}>{snapshotCourses(snap)} 门课程 · 长按删除</Text>
            </View>
            <Ionicons name="refresh-outline" size={15} color={colors.faint} />
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sub}>说明</Text>
        <Text style={styles.desc}>· 导出会打开系统分享面板，可保存到文件、发给自己或传到电脑{"\n"}· 恢复会覆盖当前所有课表，建议先导出一次{"\n"}· 数据只在本机，不上传任何服务器</Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 12 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    sub: { fontSize: 12, color: colors.sub, fontWeight: "600", marginBottom: 6 },
    desc: { fontSize: 12, color: colors.sub, lineHeight: 19, marginTop: 8 },
    action: { height: 48, borderRadius: 10, borderWidth: 1, borderColor: colors.fieldBorder, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 },
    actionText: { fontSize: 14, color: colors.ink, fontWeight: "500" },
    actionPrimary: { fontSize: 14, color: "#FFFFFF", fontWeight: "600" },
    historyHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
    link: { fontSize: 12, color: colors.brand, fontWeight: "600" },
    historyRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
    historyTime: { fontSize: 12.5, color: colors.ink },
    historyMeta: { fontSize: 10.5, color: colors.faint, marginTop: 3 },
  });