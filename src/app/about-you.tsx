import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { LEGAL_DOCS } from "../lib/legal-docs";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  terms: "document-text-outline",
  register: "person-add-outline",
  privacy: "shield-checkmark-outline",
  permissions: "key-outline",
  thirdparty: "link-outline",
  data: "server-outline",
};

export default function AboutYouScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState<Set<string>>(() => new Set(doc ? [String(doc)] : []));

  useEffect(() => {
    if (doc) setOpen(new Set([String(doc)]));
  }, [doc]);

  const toggle = (key: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <Text style={styles.sub}>账号、数据与协议，都汇总在这里。</Text>

      <View style={styles.dataCard}>
        <Text style={styles.dataTitle}>你的数据</Text>
        <Pressable style={styles.dataRow} onPress={() => router.push("/backup")}>
          <Ionicons name="download-outline" size={17} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.dataLabel}>导出本机数据</Text>
            <Text style={styles.dataDesc}>课表、备忘录、作业、考试备份</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.dataRow, styles.divider]} onPress={() => router.push("/account")}>
          <Ionicons name="cloud-outline" size={17} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.dataLabel}>账号与云同步</Text>
            <Text style={styles.dataDesc}>查看账号、上传或恢复云端数据</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
        <Pressable style={[styles.dataRow, styles.divider]} onPress={() => router.push("/contact")}>
          <Ionicons name="trash-outline" size={17} color={colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.dataLabel}>删除账号 / 云端数据</Text>
            <Text style={styles.dataDesc}>联系开发者核实身份后处理</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.faint} />
        </Pressable>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>协议与说明</Text>
        <Pressable onPress={() => setOpen(open.size === LEGAL_DOCS.length ? new Set() : new Set(LEGAL_DOCS.map((d) => d.key)))}>
          <Text style={styles.expandAll}>{open.size === LEGAL_DOCS.length ? "全部收起" : "全部展开"}</Text>
        </Pressable>
      </View>

      {LEGAL_DOCS.map((d) => {
        const expanded = open.has(d.key);
        return (
          <View key={d.key} style={styles.card}>
            <Pressable style={styles.cardHead} onPress={() => toggle(d.key)}>
              <View style={styles.iconWrap}><Ionicons name={ICONS[d.key] ?? "document-outline"} size={17} color={colors.brand} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{d.title}</Text>
                <Text style={styles.cardMeta}>{d.short} · 更新于 {d.updated}</Text>
              </View>
              <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={15} color={colors.faint} />
            </Pressable>
            {expanded ? (
              <View style={styles.body}>
                {d.sections.map((s) => (
                  <View key={s.h} style={{ marginBottom: 12 }}>
                    <Text style={styles.h}>{s.h}</Text>
                    <Text style={styles.p}>{s.p}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}

      <View style={styles.footerCard}>
        <Ionicons name="mail-outline" size={16} color={colors.brand} />
        <Text style={styles.footerText}>对协议或数据有疑问：xbhlkj@163.com{"\n"}官网 class.zcoow.cn · 更新日期 2026-11-25</Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    sub: { fontSize: 12.5, color: colors.sub, lineHeight: 19, marginBottom: 16 },
    dataCard: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingTop: 14, marginBottom: 18 },
    dataTitle: { fontSize: 12, fontWeight: "700", color: colors.faint, marginBottom: 4 },
    dataRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
    divider: { borderTopWidth: 1, borderTopColor: colors.line },
    dataLabel: { fontSize: 13.5, color: colors.ink, fontWeight: "600" },
    dataDesc: { fontSize: 10.5, color: colors.faint, marginTop: 3 },
    sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
    expandAll: { fontSize: 11.5, color: colors.brand },
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, marginBottom: 10, overflow: "hidden" },
    cardHead: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
    iconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    cardTitle: { fontSize: 13.5, fontWeight: "700", color: colors.ink },
    cardMeta: { fontSize: 10, color: colors.faint, marginTop: 3 },
    body: { paddingHorizontal: 16, paddingBottom: 6, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14 },
    h: { fontSize: 12.5, fontWeight: "700", color: colors.ink, marginBottom: 4 },
    p: { fontSize: 12, lineHeight: 20, color: colors.sub },
    footerCard: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginTop: 2 },
    footerText: { flex: 1, fontSize: 10.5, color: colors.faint, lineHeight: 17 },
  });