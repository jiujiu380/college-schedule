import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useSchedule } from "../lib/schedule-store";
import { decodeShareCode, makeShareCode } from "../lib/share";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function ShareScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tables, activeId, restore } = useSchedule();
  const active = tables.find((t) => t.id === activeId) ?? tables[0];
  const code = useMemo(() => (active ? makeShareCode(active) : ""), [active]);
  const [draft, setDraft] = useState("");

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert("已复制", "分享码已复制，发给同学即可导入。");
  };

  const shareText = async () => {
    try {
      await Share.share({ message: "知酷课程表分享码：\n" + code });
    } catch {
      // ignore
    }
  };

  const importCode = () => {
    try {
      const table = decodeShareCode(draft);
      Alert.alert("导入课表", `将新增「${table.name}」，共 ${table.courses.length} 门课程，确定？`, [
        { text: "取消", style: "cancel" },
        {
          text: "导入",
          onPress: () => {
            const next = [...tables, table];
            restore(next, table.id);
            setDraft("");
            Alert.alert("已导入", "课表已添加并切换，可到课表页查看。");
          },
        },
      ]);
    } catch (e) {
      Alert.alert("导入失败", String(e instanceof Error ? e.message : e));
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.card}>
        <Text style={styles.title}>分享课表</Text>
        <Text style={styles.sub}>让同学扫码或复制分享码，直接导入这门课表。</Text>
        <View style={styles.qrBox}>
          {code && code.length <= 1400 ? (
            <QRCode value={code} size={210} backgroundColor="#FFFFFF" color="#0A0F1C" ecl="L" quietZone={8} />
          ) : (
            <Text style={styles.hint}>{code ? "课程较多，二维码过长，请直接复制分享码发送" : "暂无课表"}</Text>
          )}
        </View>
        <Text style={styles.tableName}>{active?.name ?? "暂无课表"} · {active?.courses.length ?? 0} 门课</Text>
        <View style={styles.actions}>
          <Pressable style={styles.primary} onPress={copy}><Text style={styles.primaryText}>复制分享码</Text></Pressable>
          <Pressable style={styles.ghost} onPress={shareText}><Ionicons name="share-outline" size={15} color={colors.ink} /><Text style={styles.ghostText}>分享</Text></Pressable>
        </View>
        <Text style={styles.code} numberOfLines={3} selectable>{code}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>导入分享码</Text>
        <Text style={styles.sub}>粘贴同学发来的分享码，会新增一张课表，不会覆盖现有的。</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="粘贴 ZKS1. 开头的分享码"
          placeholderTextColor={colors.faint}
          style={styles.input}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable style={[styles.primary, !draft.trim() && { opacity: 0.5 }]} onPress={importCode} disabled={!draft.trim()}>
          <Text style={styles.primaryText}>导入课表</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>二维码包含整张课表信息，建议只分享给同学；导入后可以随时改名或删除。</Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 18, marginBottom: 12 },
    title: { fontSize: 17, fontWeight: "700", color: colors.ink },
    sub: { fontSize: 11.5, color: colors.sub, lineHeight: 18, marginTop: 6 },
    qrBox: { alignSelf: "center", backgroundColor: "#FFFFFF", padding: 10, borderRadius: 14, marginTop: 16, marginBottom: 10 },
    hint: { fontSize: 12, color: colors.faint, padding: 30 },
    tableName: { fontSize: 11.5, color: colors.faint, textAlign: "center" },
    actions: { flexDirection: "row", gap: 10, marginTop: 14 },
    primary: { flex: 1, height: 44, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "600" },
    ghost: { height: 44, paddingHorizontal: 16, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
    ghostText: { fontSize: 12.5, color: colors.ink },
    code: { fontSize: 9.5, color: colors.faint, lineHeight: 15, marginTop: 12 },
    input: { minHeight: 90, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, padding: 12, marginTop: 12, marginBottom: 4, fontSize: 12, color: colors.ink, backgroundColor: colors.fieldBg, textAlignVertical: "top" },
    note: { fontSize: 10.5, color: colors.faint, lineHeight: 17, textAlign: "center" },
  });