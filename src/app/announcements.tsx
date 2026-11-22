import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { Announcement, fetchAnnouncements, htmlToText } from "../lib/site-api";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function AnnouncementsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const load = async () => {
    try {
      setError("");
      setItems(await fetchAnnouncements());
    } catch {
      setError("公告加载失败，请检查网络或官网地址");
      setItems([]);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
    >
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      {items === null ? <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {(items ?? []).map((a) => {
        const open = openId === a.id;
        return (
          <Pressable key={a.id} style={styles.card} onPress={() => setOpenId(open ? null : a.id)}>
            <View style={styles.head}>
              {a.pinned ? <Text style={styles.pin}>置顶</Text> : null}
              <Text style={styles.title} numberOfLines={open ? undefined : 1}>{a.title}</Text>
            </View>
            <Text style={styles.date}>{a.created_at}</Text>
            <Text style={styles.content} numberOfLines={open ? undefined : 3}>{htmlToText(a.content)}</Text>
            <View style={styles.moreRow}>
              <Text style={styles.more}>{open ? "收起" : "展开"}</Text>
              <Ionicons name={open ? "chevron-up" : "chevron-down"} size={13} color={colors.faint} />
            </View>
          </Pressable>
        );
      })}
      {items && !items.length ? <Text style={styles.empty}>暂无公告</Text> : null}
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 10 },
    head: { flexDirection: "row", alignItems: "center", gap: 6 },
    pin: { fontSize: 10, color: colors.brand, backgroundColor: colors.brandSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    title: { flex: 1, fontSize: 14.5, fontWeight: "600", color: colors.ink },
    date: { fontSize: 11, color: colors.faint, marginTop: 6 },
    content: { fontSize: 12.5, color: colors.sub, lineHeight: 20, marginTop: 8 },
    moreRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 8 },
    more: { fontSize: 11, color: colors.faint },
    error: { fontSize: 12, color: colors.danger, marginBottom: 10 },
    empty: { textAlign: "center", color: colors.faint, marginTop: 40, fontSize: 12.5 },
  });
