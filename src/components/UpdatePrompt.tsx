import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { downloadAndInstallApk } from "../lib/apk-update";
import { useUpdate } from "../lib/update-store";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

function cleanNotes(raw?: string): string {
  if (!raw) return "";
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 2400);
}

export function UpdatePrompt() {
  const { result } = useUpdate();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const available = result?.status === "available" && result.latest ? result : null;
  const version = available?.latest ?? "";
  const release = available?.release;
  const notes = cleanNotes(release?.notes);

  useEffect(() => {
    if (available && dismissed && dismissed !== version) setDismissed(null);
  }, [available, dismissed, version]);

  const openBrowser = () => {
    const url = release?.apkUrl || release?.htmlUrl;
    if (url) Linking.openURL(url).catch(() => {});
  };

  const install = async () => {
    const url = release?.apkUrl || release?.htmlUrl;
    if (!url) {
      Alert.alert("没有下载地址", "请到官网下载最新版本。");
      return;
    }
    if (Platform.OS !== "android") {
      await Linking.openURL(url).catch(() => {});
      return;
    }
    setError("");
    setBusy(true);
    setProgress(0);
    try {
      await downloadAndInstallApk(url, setProgress);
      setBusy(false);
    } catch (e) {
      setBusy(false);
      const message = String(e instanceof Error ? e.message : e);
      setError(message);
      Alert.alert("更新失败", message + "\n\n可以改用浏览器下载，或稍后重试。", [
        { text: "取消", style: "cancel" },
        { text: "浏览器下载", onPress: openBrowser },
      ]);
    }
  };

  return (
    <Modal visible={Boolean(available) && dismissed !== version} transparent animationType="fade" onRequestClose={() => { if (!busy) setDismissed(version); }}>
      <View style={styles.mask}>
        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name="cloud-download-outline" size={24} color={colors.brand} /></View>
          <Text style={styles.title}>发现新版本 v{version}</Text>
          <Text style={styles.sub}>当前版本 v{result?.current} · 安装后数据不会丢失</Text>

          <Text style={styles.section}>更新内容</Text>
          <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.notes}>{notes || "本次更新包含问题修复与体验优化，建议更新后使用。"}</Text>
          </ScrollView>

          {busy ? (
            <View style={styles.progressBox}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: Math.round(progress * 100) + "%" }]} />
              </View>
              <Text style={styles.progressText}>
                {progress < 0.99 ? "正在下载安装包 " + Math.round(progress * 100) + "%" : "下载完成，正在打开安装…"}
              </Text>
              <Text style={styles.progressHint}>请保持网络连接，安装时按系统提示允许安装未知应用。</Text>
            </View>
          ) : (
            <>
              <Pressable style={styles.primary} onPress={install}>
                <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                <Text style={styles.primaryText}>下载并安装</Text>
              </Pressable>
              <Pressable style={styles.ghost} onPress={() => setDismissed(version)}>
                <Text style={styles.ghostText}>稍后</Text>
              </Pressable>
            </>
          )}
          {error && !busy ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    mask: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 26 },
    card: { width: "100%", maxWidth: 350, backgroundColor: colors.surface, borderRadius: 22, padding: 22 },
    icon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center", alignSelf: "center" },
    title: { fontSize: 18, fontWeight: "700", color: colors.ink, textAlign: "center", marginTop: 14 },
    sub: { fontSize: 11.5, color: colors.sub, textAlign: "center", marginTop: 6 },
    section: { fontSize: 11.5, fontWeight: "700", color: colors.ink, marginTop: 18, marginBottom: 7 },
    notes: { fontSize: 11.5, color: colors.sub, lineHeight: 19 },
    primary: { marginTop: 18, height: 46, borderRadius: 12, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, outlineStyle: "none" as any },
    primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    ghost: { marginTop: 10, height: 42, alignItems: "center", justifyContent: "center", outlineStyle: "none" as any },
    ghostText: { fontSize: 12.5, color: colors.faint },
    progressBox: { marginTop: 18 },
    progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.chipBg, overflow: "hidden" },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.brand },
    progressText: { fontSize: 12, color: colors.ink, textAlign: "center", marginTop: 10 },
    progressHint: { fontSize: 10, color: colors.faint, textAlign: "center", lineHeight: 15, marginTop: 6 },
    error: { fontSize: 10.5, color: colors.danger, textAlign: "center", lineHeight: 16, marginTop: 10 },
  });