import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

const KEY = "college.news.key.v1";
const BASE = "https://api.shwgij.com/api/today/newspic";

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [key, setKey] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      setKey(v ?? "");
      setDraft(v ?? "");
      setEditing(!v);
      setLoading(Boolean(v));
    });
  }, []);

  const url = BASE + "?width=800&news_count=12" + (key ? "&key=" + encodeURIComponent(key) : "") + "&t=" + reload;

  const save = async () => {
    const v = draft.trim();
    await AsyncStorage.setItem(KEY, v);
    setKey(v);
    setEditing(false);
    setLoading(true);
    setError(false);
    setReload((n) => n + 1);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.title}>每日新闻</Text>
          <Pressable onPress={() => setEditing((v) => !v)} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={16} color={colors.sub} />
          </Pressable>
        </View>
        <Text style={styles.desc}>实时热榜新闻图片，由「新闻早报图片版」接口生成。</Text>

        {editing ? (
          <>
            <Text style={styles.label}>接口 Key</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="在 api.shwgij.com 控制台免费获取"
              placeholderTextColor={colors.faint}
              style={styles.input}
              autoCapitalize="none"
            />
            <Pressable style={styles.primary} onPress={save}>
              <Text style={styles.primaryText}>保存并加载</Text>
            </Pressable>
            <Text style={styles.hint}>没有 Key 时接口会返回 403，图片无法显示。打开 api.shwgij.com 注册后复制 Key 填到这里。</Text>
          </>
        ) : null}
      </View>

      {key ? (
        <View style={[styles.card, { padding: 8 }]}>
          {loading ? <ActivityIndicator color={colors.brand} style={{ marginVertical: 40 }} /> : null}
          <Image
            source={{ uri: url }}
            style={{ width: "100%", aspectRatio: 0.62, borderRadius: 12, backgroundColor: colors.chipBg }}
            resizeMode="contain"
            onLoad={() => { setLoading(false); setError(false); }}
            onError={() => { setLoading(false); setError(true); }}
          />
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.errorText}>图片加载失败，可能是 Key 失效或接口限制。点右上角设置重新填写 Key，或换个网络重试。</Text>
            </View>
          ) : null}
          <Pressable style={styles.primary} onPress={() => { setLoading(true); setError(false); setReload((n) => n + 1); }}>
            <Text style={styles.primaryText}>刷新新闻</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 12 },
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    title: { fontSize: 17, fontWeight: "700", color: colors.ink },
    iconBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.chipBg, alignItems: "center", justifyContent: "center" },
    desc: { fontSize: 11.5, color: colors.sub, lineHeight: 18, marginTop: 8 },
    label: { fontSize: 11.5, color: colors.sub, marginTop: 14, marginBottom: 6 },
    input: { height: 44, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 13, color: colors.ink, backgroundColor: colors.fieldBg },
    primary: { marginTop: 14, height: 44, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "600" },
    hint: { fontSize: 10.5, color: colors.faint, marginTop: 10, lineHeight: 16 },
    errorBox: { flexDirection: "row", gap: 6, marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: colors.warnBg },
    errorText: { flex: 1, fontSize: 11, color: colors.warnText, lineHeight: 17 },
  });
