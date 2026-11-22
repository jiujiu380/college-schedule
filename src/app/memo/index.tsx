import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { Memo, deleteMemo, loadMemos, memoText } from "../../lib/memos";
import { useTheme } from "../../lib/theme-context";
import { Colors, radius } from "../../theme";

export default function MemoListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [memos, setMemos] = useState<Memo[]>([]);

  useFocusEffect(useCallback(() => { loadMemos().then(setMemos); }, []));

  const remove = (id: string) => {
    Alert.alert("删除备忘录", "确定删除？", [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: async () => setMemos(await deleteMemo(id)) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 90 }} showsVerticalScrollIndicator={false}>
        {memos.map((m) => (
          <Pressable key={m.id} style={styles.card} onPress={() => router.push("/memo/" + m.id)} onLongPress={() => remove(m.id)}>
            <View style={styles.head}>
              <Text style={styles.title} numberOfLines={1}>{m.title || "无标题"}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.faint} />
            </View>
            <Text style={styles.preview} numberOfLines={2}>{memoText(m.body) || "空白备忘录"}</Text>
            <Text style={styles.meta}>{new Date(m.updatedAt).toLocaleString()}{m.strokes.length ? " · 含手绘" : ""}</Text>
          </Pressable>
        ))}
        {!memos.length ? (
          <View style={styles.emptyBox}>
            <Ionicons name="journal-outline" size={30} color={colors.faint} />
            <Text style={styles.emptyText}>还没有备忘录</Text>
            <Text style={styles.emptySub}>支持富文本 + 手绘，完全离线</Text>
          </View>
        ) : null}
      </ScrollView>

      <Pressable style={[styles.fab, { bottom: insets.bottom + 24 }]} onPress={() => router.push("/memo/new")}>
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 10 },
    head: { flexDirection: "row", alignItems: "center", gap: 6 },
    title: { flex: 1, fontSize: 14.5, fontWeight: "600", color: colors.ink },
    preview: { fontSize: 12, color: colors.sub, lineHeight: 19, marginTop: 7 },
    meta: { fontSize: 10.5, color: colors.faint, marginTop: 8 },
    emptyBox: { alignItems: "center", paddingTop: 80, gap: 8 },
    emptyText: { fontSize: 14, color: colors.ink, fontWeight: "600" },
    emptySub: { fontSize: 11.5, color: colors.faint },
    fab: { position: "absolute", right: 20, width: 54, height: 54, borderRadius: 27, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 },
  });