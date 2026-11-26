import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { loadExams } from "../lib/exams";
import { loadHomework } from "../lib/homework";
import { SearchData, SearchResult, SearchType, TYPE_LABEL, searchAll } from "../lib/search";
import { useSchedule } from "../lib/schedule-store";
import { fetchAnnouncements } from "../lib/site-api";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

const ICONS: Record<SearchType, keyof typeof Ionicons.glyphMap> = {
  course: "book-outline",
  homework: "checkbox-outline",
  exam: "timer-outline",
  memo: "document-text-outline",
  announcement: "megaphone-outline",
};

const FILTERS: { key: SearchType | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "course", label: "课程" },
  { key: "homework", label: "作业" },
  { key: "exam", label: "考试" },
  { key: "memo", label: "备忘录" },
  { key: "announcement", label: "公告" },
];

const SUGGESTIONS = ["明天要交的作业", "最近考试", "今天有什么课", "公告"];

export default function SearchScreen() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tables, activeId } = useSchedule();
  const active = tables.find((t) => t.id === activeId) ?? tables[0];
  const [query, setQuery] = useState(q ?? "");
  const [filter, setFilter] = useState<SearchType | "all">("all");
  const [data, setData] = useState<SearchData | null>(null);

  const load = useCallback(async () => {
    const [homework, exams, announcements] = await Promise.all([
      loadHomework(),
      loadExams(),
      fetchAnnouncements().catch(() => []),
    ]);
    let memos: SearchData["memos"] = [];
    try {
      const raw = await AsyncStorage.getItem("college.memos.v1");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) memos = parsed;
    } catch {
      // ignore
    }
    setData({ courses: active?.courses ?? [], homework, exams, memos, announcements });
  }, [active?.courses]);

  useEffect(() => {
    void load();
  }, [load]);

  const results = useMemo(() => (data ? searchAll(query, data, filter === "all" ? undefined : filter) : []), [query, data, filter]);
  const grouped = useMemo(() => {
    const map = new Map<SearchType, SearchResult[]>();
    for (const r of results) {
      const list = map.get(r.type) ?? [];
      list.push(r);
      map.set(r.type, list);
    }
    return [...map.entries()];
  }, [results]);

  const open = (r: SearchResult) => router.push(r.route as any);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.faint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="搜课程、作业、考试、备忘录、公告"
          placeholderTextColor={colors.faint}
          style={styles.input}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}><Ionicons name="close-circle" size={17} color={colors.faint} /></Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {FILTERS.map((f) => (
          <Pressable key={f.key} style={[styles.chip, filter === f.key && styles.chipOn]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.chipText, filter === f.key && { color: "#FFFFFF" }]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {query.trim() === "" ? (
        <View style={styles.suggestBox}>
          <Text style={styles.suggestTitle}>试试这样搜</Text>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} style={styles.suggestRow} onPress={() => setQuery(s)}>
              <Ionicons name="sparkles-outline" size={14} color={colors.brand} />
              <Text style={styles.suggestText}>{s}</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.faint} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {!data ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand} /><Text style={styles.hint}>正在整理本地数据…</Text></View>
      ) : query.trim() !== "" && results.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={26} color={colors.faint} />
          <Text style={styles.hint}>没有找到相关结果{"\n"}可以换个关键词，或试试上面的示例</Text>
        </View>
      ) : null}

      {grouped.map(([type, list]) => (
        <View key={type} style={{ marginTop: 8 }}>
          <Text style={styles.groupTitle}>{TYPE_LABEL[type]} · {list.length}</Text>
          <View style={styles.groupCard}>
            {list.map((r, i) => (
              <Pressable key={r.key} style={[styles.row, i !== list.length - 1 && styles.rowBorder]} onPress={() => open(r)}>
                <View style={styles.rowIcon}><Ionicons name={ICONS[type]} size={16} color={colors.brand} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{r.title}</Text>
                  <Text style={styles.rowSub} numberOfLines={2}>{r.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.faint} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {query.trim() === "" ? <Text style={styles.footer}>支持“明天要交的作业”“最近考试”“今天有什么课”这类简单说法。</Text> : null}
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    searchBar: { flexDirection: "row", alignItems: "center", gap: 8, height: 46, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12 },
    input: { flex: 1, fontSize: 13.5, color: colors.ink, height: "100%", outlineStyle: "none" as any },
    chipRow: { gap: 6, paddingVertical: 12 },
    chip: { height: 30, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.chipBg, alignItems: "center", justifyContent: "center" },
    chipOn: { backgroundColor: colors.brand },
    chipText: { fontSize: 11.5, color: colors.sub },
    suggestBox: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 8, marginTop: 2 },
    suggestTitle: { fontSize: 10.5, color: colors.faint, marginTop: 4, marginBottom: 4 },
    suggestRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.line },
    suggestText: { flex: 1, fontSize: 12.5, color: colors.ink },
    center: { alignItems: "center", paddingVertical: 60, gap: 10 },
    hint: { fontSize: 11.5, color: colors.faint, textAlign: "center", lineHeight: 18 },
    groupTitle: { fontSize: 10.5, color: colors.faint, marginBottom: 7, marginTop: 10 },
    groupCard: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
    row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
    rowIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    rowTitle: { fontSize: 13, fontWeight: "600", color: colors.ink },
    rowSub: { fontSize: 10.5, color: colors.faint, marginTop: 3, lineHeight: 15 },
    footer: { fontSize: 10, color: colors.faint, textAlign: "center", marginTop: 20, lineHeight: 16 },
  });