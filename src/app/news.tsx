import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

const API_KEY = "4CK7lafWehOO4uCkEHOmfH8Q1f";
const BASE = "https://api.shwgij.com/api/today/newspic";

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState(false);
  const url = BASE + "?key=" + API_KEY + "&width=900&news_count=12&t=" + reload;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.headRow}>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.refreshBtn} onPress={() => { setLoading(true); setError(false); setReload((n) => n + 1); }}>
          <Ionicons name="refresh" size={15} color={colors.brand} />
          <Text style={styles.refreshText}>刷新</Text>
        </Pressable>
      </View>

      <View style={[styles.imageCard, { width: width - 24 }]}>
        {loading ? <ActivityIndicator color={colors.brand} style={{ position: "absolute", alignSelf: "center", top: 40 }} /> : null}
        <Image
          source={{ uri: url }}
          style={{ width: "100%", aspectRatio: 0.62 }}
          resizeMode="cover"
          onLoad={() => { setLoading(false); setError(false); }}
          onError={() => { setLoading(false); setError(true); }}
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.errorText}>新闻图片加载失败，请检查网络后点「刷新」重试。</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingHorizontal: 2 },
    title: { fontSize: 17, fontWeight: "700", color: colors.ink },
    refreshBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    refreshText: { fontSize: 12, color: colors.brand, fontWeight: "600" },
    imageCard: { alignSelf: "center", borderRadius: 14, overflow: "hidden", backgroundColor: colors.chipBg, marginBottom: 12 },
    label: { fontSize: 11.5, color: colors.sub, marginTop: 14, marginBottom: 6 },
    input: { height: 44, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 13, color: colors.ink, backgroundColor: colors.fieldBg },
    primary: { marginTop: 14, height: 44, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "600" },
    hint: { fontSize: 10.5, color: colors.faint, marginTop: 10, lineHeight: 16 },
    errorBox: { flexDirection: "row", gap: 6, marginTop: 4, padding: 10, borderRadius: 8, backgroundColor: colors.warnBg },
    errorText: { flex: 1, fontSize: 11, color: colors.warnText, lineHeight: 17 },
  });