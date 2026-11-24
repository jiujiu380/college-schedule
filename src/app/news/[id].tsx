import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { DailyNews, loadDailyNews } from "../../lib/daily-news";
import { useTheme } from "../../lib/theme-context";
import { Colors, radius } from "../../theme";

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [data, setData] = useState<DailyNews | null>(null);
  const [loading, setLoading] = useState(true);
  const index = Math.max(0, Number(id) || 0);

  useEffect(() => {
    let alive = true;
    loadDailyNews()
      .then((d) => { if (alive) setData(d); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const item = data?.items[index];

  const copy = async () => {
    if (!item) return;
    await Clipboard.setStringAsync(item);
    Alert.alert("已复制", "本条新闻已复制到剪贴板。");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      {loading ? (
        <View style={{ paddingVertical: 60, alignItems: "center" }}><ActivityIndicator color={colors.brand} /></View>
      ) : item ? (
        <>
          <Text style={styles.meta}>{data?.date} · 第 {String(index + 1).padStart(2, "0")} 条</Text>
          <Text style={styles.title}>今日新闻</Text>
          <View style={styles.card}>
            <Text style={styles.body}>{item}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.action} onPress={copy}>
              <Ionicons name="copy-outline" size={15} color={colors.ink} />
              <Text style={styles.actionText}>复制</Text>
            </Pressable>
            {data?.link ? (
              <Pressable style={styles.action} onPress={() => Linking.openURL(data.link).catch(() => {})}>
                <Ionicons name="open-outline" size={15} color={colors.ink} />
                <Text style={styles.actionText}>打开原文</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.navRow}>
            <Pressable
              style={[styles.navBtn, index <= 0 && { opacity: 0.35 }]}
              disabled={index <= 0}
              onPress={() => router.replace(`/news/${index - 1}`)}
            >
              <Ionicons name="chevron-back" size={15} color={colors.ink} />
              <Text style={styles.navText}>上一条</Text>
            </Pressable>
            <Pressable
              style={[styles.navBtn, (!data || index >= data.items.length - 1) && { opacity: 0.35 }]}
              disabled={!data || index >= data.items.length - 1}
              onPress={() => data && router.replace(`/news/${index + 1}`)}
            >
              <Text style={styles.navText}>下一条</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.ink} />
            </Pressable>
          </View>

          <Text style={styles.note}>新闻内容来自公开早报，仅供参考；重要信息请以官方发布为准。</Text>
        </>
      ) : (
        <View style={{ paddingVertical: 60, alignItems: "center" }}>
          <Text style={{ color: colors.sub, fontSize: 13 }}>这条新闻不存在或已过期</Text>
          <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>返回列表</Text></Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    meta: { fontSize: 11, color: colors.faint, marginBottom: 6 },
    title: { fontSize: 22, fontWeight: "800", color: colors.ink, letterSpacing: -0.4 },
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 20, marginTop: 16 },
    body: { fontSize: 16, lineHeight: 30, color: colors.ink },
    actions: { flexDirection: "row", gap: 10, marginTop: 14 },
    action: { flex: 1, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    actionText: { fontSize: 12.5, color: colors.ink },
    navRow: { flexDirection: "row", gap: 10, marginTop: 20 },
    navBtn: { flex: 1, height: 44, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
    navText: { fontSize: 12.5, color: colors.ink },
    note: { fontSize: 10.5, color: colors.faint, lineHeight: 17, marginTop: 18, textAlign: "center" },
    back: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8, backgroundColor: colors.brand },
    backText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "600" },
  });
