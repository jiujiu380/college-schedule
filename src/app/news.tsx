import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { DailyNews, loadDailyNews } from "../lib/daily-news";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function NewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [data, setData] = useState<DailyNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError("");
    try {
      setData(await loadDailyNews(force));
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>每日新闻</Text>
          <Text style={styles.sub}>{data?.date ? data.date + (data.created ? " · " + data.created.slice(11) : "") : "每天 60 秒读懂世界"}</Text>
        </View>
        <Pressable style={styles.refreshBtn} onPress={() => void load(true)}>
          <Ionicons name="refresh" size={15} color={colors.brand} />
          <Text style={styles.refreshText}>刷新</Text>
        </Pressable>
      </View>

      {loading && !data ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand} /><Text style={styles.hint}>正在获取今日新闻…</Text></View>
      ) : null}

      {error && !data ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={24} color={colors.faint} />
          <Text style={styles.hint}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => void load(true)}><Text style={styles.retryText}>重试</Text></Pressable>
        </View>
      ) : null}

      {data ? (
        <>
          <View style={styles.list}>
            {data.items.map((item, i) => (
              <Pressable key={i} style={[styles.row, i !== data.items.length - 1 && styles.rowBorder]} onPress={() => router.push(`/news/${i}`)}>
                <Text style={styles.no}>{String(i + 1).padStart(2, "0")}</Text>
                <Text style={styles.item} numberOfLines={3}>{item}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.faint} />
              </Pressable>
            ))}
          </View>

          {data.tip ? (
            <View style={styles.tip}>
              <Text style={styles.tipMark}>“</Text>
              <Text style={styles.tipText}>{data.tip}</Text>
            </View>
          ) : null}

          <Text style={styles.footer}>内容来自「60 秒读懂世界」，点击任意一条查看全文细节。</Text>
        </>
      ) : null}
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
    title: { fontSize: 20, fontWeight: "800", color: colors.ink },
    sub: { fontSize: 11, color: colors.faint, marginTop: 4 },
    refreshBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    refreshText: { fontSize: 12, color: colors.brand, fontWeight: "600" },
    center: { alignItems: "center", paddingVertical: 50, gap: 10 },
    hint: { fontSize: 12, color: colors.faint, textAlign: "center", lineHeight: 18, paddingHorizontal: 24 },
    retry: { marginTop: 6, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.brand },
    retryText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "600" },
    list: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
    row: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 14, paddingVertical: 14 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
    no: { fontSize: 11, fontWeight: "700", color: colors.brand, width: 22, marginTop: 2 },
    item: { flex: 1, fontSize: 13, lineHeight: 21, color: colors.ink },
    tip: { flexDirection: "row", gap: 4, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginTop: 12 },
    tipMark: { fontSize: 24, color: colors.brand, lineHeight: 26, opacity: 0.5 },
    tipText: { flex: 1, fontSize: 11.5, color: colors.sub, lineHeight: 19, marginTop: 2 },
    footer: { fontSize: 10.5, color: colors.faint, textAlign: "center", marginTop: 14 },
  });
