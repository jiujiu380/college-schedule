import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { DEFAULT_SETUP, SchoolSetup, TimetableKind, loadSetup, saveSetup, timetableUrl } from "../lib/school-setup";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function SetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [draft, setDraft] = useState<SchoolSetup>(DEFAULT_SETUP);

  useEffect(() => {
    loadSetup().then(setDraft);
  }, []);

  const set = (patch: Partial<SchoolSetup>) => setDraft((prev) => ({ ...prev, ...patch }));

  const onSave = async () => {
    if (!draft.personalId.trim() && !draft.classId.trim()) {
      Alert.alert("请填写课表 ID", "个人课表 ID 与班级课表 ID 至少填写一个。");
      return;
    }
    await saveSetup({
      ...draft,
      studentId: draft.studentId.trim(),
      personalId: draft.personalId.trim(),
      classId: draft.classId.trim(),
      yearId: draft.yearId.trim(),
      termId: draft.termId.trim(),
    });
    Alert.alert("已保存", "初始化参数已保存在本机，登录教务后即可抓取课表。");
    router.back();
  };

  const fields: { key: keyof SchoolSetup; label: string; placeholder: string; hint?: string }[] = [
    { key: "studentId", label: "学号", placeholder: "例如 20230001（仅用于显示）" },
    { key: "personalId", label: "个人课表 ID", placeholder: "208575", hint: "教务系统个人课表链接中的 id" },
    { key: "classId", label: "班级课表 ID", placeholder: "17086", hint: "班级课表链接中的 id" },
    { key: "yearId", label: "学年 ID", placeholder: "46" },
    { key: "termId", label: "学期 ID", placeholder: "3" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>初始化课表参数</Text>
        <Text style={styles.cardText}>
          这些参数来自学校教务系统，填一次即可。应用会自动拼接课表地址，不需要你填写任何接口地址。
        </Text>
      </View>

      <View style={[styles.card, { marginTop: 12 }]}>
        {fields.map((f, idx) => (
          <View key={f.key} style={[styles.field, idx !== fields.length - 1 && styles.divider]}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              value={String(draft[f.key] ?? "")}
              onChangeText={(v) => set({ [f.key]: v } as Partial<SchoolSetup>)}
              placeholder={f.placeholder}
              placeholderTextColor={colors.faint}
              keyboardType={f.key === "studentId" || f.key === "personalId" || f.key === "classId" ? "number-pad" : "default"}
              autoCapitalize="none"
              style={styles.input}
            />
            {f.hint ? <Text style={styles.hint}>{f.hint}</Text> : null}
          </View>
        ))}
      </View>

      <Text style={styles.section}>默认课表</Text>
      <View style={styles.card}>
        <View style={styles.segment}>
          {([
            { key: "STUDENT", label: "个人课表" },
            { key: "CLASSES", label: "班级课表" },
          ] as { key: TimetableKind; label: string }[]).map((k) => (
            <Pressable key={k.key} onPress={() => set({ defaultKind: k.key })} style={[styles.segmentItem, draft.defaultKind === k.key && styles.segmentActive]}>
              <Text style={[styles.segmentText, draft.defaultKind === k.key && { color: colors.brand, fontWeight: "600" }]}>{k.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.urlPreview}>{timetableUrl(draft, draft.defaultKind)}</Text>
      </View>

      <Pressable style={styles.primaryBtn} onPress={onSave}>
        <Text style={styles.primaryText}>保存初始化设置</Text>
      </Pressable>

      <Pressable style={styles.ghostBtn} onPress={() => router.push("/school-login")}>
        <Ionicons name="log-in-outline" size={16} color={colors.brand} />
        <Text style={styles.ghostText}>登录教务系统并抓取课表</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14 },
    cardTitle: { fontSize: 13.5, fontWeight: "600", color: colors.ink },
    cardText: { fontSize: 12, color: colors.sub, lineHeight: 19, marginTop: 8 },
    field: { paddingVertical: 10 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
    label: { fontSize: 11.5, color: colors.sub, marginBottom: 6 },
    input: { height: 38, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 10, fontSize: 13, color: colors.ink, backgroundColor: colors.fieldBg },
    hint: { fontSize: 10.5, color: colors.faint, marginTop: 5 },
    section: { fontSize: 12, color: colors.faint, marginTop: 20, marginBottom: 8, marginLeft: 2 },
    segment: { flexDirection: "row", backgroundColor: colors.chipBg, borderRadius: radius.sm, padding: 2, gap: 2 },
    segmentItem: { flex: 1, paddingVertical: 8, borderRadius: 3, alignItems: "center" },
    segmentActive: { backgroundColor: colors.surface },
    segmentText: { fontSize: 12, color: colors.sub },
    urlPreview: { fontSize: 10, color: colors.faint, marginTop: 10, lineHeight: 15 },
    primaryBtn: { marginTop: 22, height: 44, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    ghostBtn: { marginTop: 10, height: 42, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.infoBorder, backgroundColor: colors.infoBg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    ghostText: { fontSize: 13, color: colors.brand, fontWeight: "500" },
  });
