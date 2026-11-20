import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "../components/Anim";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useSchedule } from "../lib/schedule-store";
import { SAMPLE_JSON, parseStaticJson, readPickedFile } from "../lib/static-timetable";
import { parseTimetable } from "../lib/timetable-html";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function ImportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { applyStatic, applyApi, clearStatic, staticMeta, source, courses } = useSchedule();
  const [htmlText, setHtmlText] = useState("");
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ count: number; name: string; warnings: string[]; weeks: string } | null>(null);

  const parse = (raw: string) => {
    setText(raw);
    setPreview(null);
    setError(null);
    if (!raw.trim()) return;
    const res = parseStaticJson(raw);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const allWeeks = Array.from(new Set(res.courses.flatMap((c) => c.weeks))).sort((a, b) => a - b);
    setPreview({
      count: res.courses.length,
      name: res.name,
      warnings: res.warnings,
      weeks: allWeeks.length ? `第 ${allWeeks[0]}-${allWeeks[allWeeks.length - 1]} 周` : "—",
    });
  };

  const onPaste = async () => {
    try {
      const clip = await Clipboard.getStringAsync();
      if (!clip?.trim()) {
        Alert.alert("剪贴板为空", "请先复制课表 JSON 内容。");
        return;
      }
      parse(clip);
    } catch {
      Alert.alert("读取剪贴板失败", "请手动粘贴 JSON 内容。");
    }
  };

  const onPick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ["application/json", "text/plain", "*/*"], copyToCacheDirectory: true, multiple: false });
      if (res.canceled || !res.assets?.length) return;
      parse(await readPickedFile(res.assets[0].uri));
    } catch {
      Alert.alert("读取文件失败", "请确认文件为 UTF-8 编码的 JSON，或改用粘贴方式。");
    }
  };

  const onImport = async () => {
    if (!preview || !text.trim()) return;
    const res = parseStaticJson(text);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await applyStatic(res.courses, res.name);
    Alert.alert("导入成功", `已导入 ${res.courses.length} 门课程，课表页将标注为“静态课表”。`);
    router.replace("/schedule");
  };

  const onClear = () => {
    Alert.alert("清除静态课表", "清除后将恢复演示数据（接口接入后为真实课表）。", [
      { text: "取消", style: "cancel" },
      { text: "清除", style: "destructive", onPress: async () => { await clearStatic(); setPreview(null); setText(""); Alert.alert("已清除", "已恢复默认数据源。"); } },
    ]);
  };

  const status = source === "static" && staticMeta
    ? `静态课表 · ${staticMeta.count} 门 · 导入于 ${new Date(staticMeta.importedAt).toLocaleString("zh-CN", { hour12: false })}`
    : source === "api"
      ? "教务接口 · 实时数据"
      : `演示数据 · ${courses.length} 门（尚未接入接口）`;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>为什么要导入静态课表</Text>
        <Text style={styles.cardText}>课表接口只在校内网可用。离开校园网、接口维护或故障时，可用一份导入的课表作为备选，保证随时能查到上课信息。接口恢复后重新登录即可切换回实时数据，两者不会混淆。</Text>
      </View>

      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.label}>当前数据源</Text>
        <Text style={styles.value}>{status}</Text>
        {source === "static" ? (
          <Pressable style={styles.clearBtn} onPress={onClear}><Text style={styles.clearText}>清除静态课表</Text></Pressable>
        ) : null}
      </View>

      <Text style={styles.section}>导入内容（JSON）</Text>
      <TextInput
        value={text}
        onChangeText={parse}
        placeholder={'{\n  "name": "2026 秋季学期",\n  "courses": [ ... ]\n}'}
        placeholderTextColor={colors.faint}
        multiline
        textAlignVertical="top"
        style={styles.textarea}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.btnRow}>
        <Pressable style={styles.ghostBtn} onPress={onPaste}>
          <Ionicons name="clipboard-outline" size={14} color={colors.ink} />
          <Text style={styles.ghostText}>粘贴</Text>
        </Pressable>
        <Pressable style={styles.ghostBtn} onPress={onPick}>
          <Ionicons name="folder-open-outline" size={14} color={colors.ink} />
          <Text style={styles.ghostText}>选择文件</Text>
        </Pressable>
        <Pressable style={styles.ghostBtn} onPress={() => parse(SAMPLE_JSON)}>
          <Ionicons name="document-text-outline" size={14} color={colors.ink} />
          <Text style={styles.ghostText}>填入示例</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {preview ? (
        <View style={[styles.card, { marginTop: 12 }]}>
          <View style={styles.previewHead}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.previewTitle}>解析成功</Text>
          </View>
          <Text style={styles.previewLine}>课表名称：{preview.name}</Text>
          <Text style={styles.previewLine}>课程数量：{preview.count} 门</Text>
          <Text style={styles.previewLine}>覆盖周次：{preview.weeks}</Text>
          {preview.warnings.length ? <Text style={styles.warnText}>已跳过 {preview.warnings.length} 条：{preview.warnings[0]}</Text> : null}
          <PressableScale style={styles.primaryBtn} onPress={onImport}>
            <Text style={styles.primaryText}>导入并设为当前课表</Text>
          </PressableScale>
        </View>
      ) : null}

      <Text style={styles.section}>从教务网页导入（无需登录）</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>
          在浏览器打开教务课表页 → 右键「查看网页源代码」→ 全选复制，粘贴到下面即可离线解析。适用于已保存的课表网页。
        </Text>
        <TextInput
          value={htmlText}
          onChangeText={setHtmlText}
          placeholder="粘贴课表网页 HTML 源码…"
          placeholderTextColor={colors.faint}
          multiline
          textAlignVertical="top"
          style={[styles.textarea, { height: 120, marginTop: 10 }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.btnRow}>
          <Pressable style={styles.ghostBtn} onPress={async () => {
            const clip = await Clipboard.getStringAsync();
            if (clip) setHtmlText(clip);
          }}>
            <Ionicons name="clipboard-outline" size={14} color={colors.ink} />
            <Text style={styles.ghostText}>粘贴</Text>
          </Pressable>
          <Pressable
            style={[styles.ghostBtn, { flex: 2, borderColor: colors.brand, backgroundColor: colors.brandSoft }]}
            onPress={async () => {
              const parsed = parseTimetable(htmlText);
              if (!parsed.courses.length) {
                Alert.alert("没有解析到课程", "请确认粘贴的是课表页源码（包含 table id=\"timetable\"），也可以直接把文件发给开发者。");
                return;
              }
              await applyApi(parsed.courses, parsed.periods);
              Alert.alert("导入成功", `共 ${parsed.courses.length} 门课程，已按页面节次时间展示。`);
              router.replace("/schedule");
            }}
          >
            <Text style={[styles.ghostText, { color: colors.brand, fontWeight: "600" }]}>解析并应用</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.section}>字段格式</Text>
      <View style={styles.card}>
        <Text style={styles.code}>{'{\n  "name": "课表名称",\n  "courses": [\n    {\n      "name": "课程名",\n      "teacher": "教师",\n      "location": "教室",\n      "weekday": "周一",\n      "periods": "1-2",\n      "weeks": "1-16",\n      "credit": 3\n    }\n  ]\n}'}</Text>
        <Text style={styles.tip}>weekday 可写 1-7 或“周一”；periods 可写 "1-2" 或 startPeriod/endPeriod；weeks 支持 "1-16"、"1-16,18"、"4-12/2" 或数组。</Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14 },
    cardTitle: { fontSize: 13.5, fontWeight: "600", color: colors.ink },
    cardText: { fontSize: 12, color: colors.sub, lineHeight: 19, marginTop: 8 },
    label: { fontSize: 11.5, color: colors.faint },
    value: { fontSize: 12.5, color: colors.ink, marginTop: 6 },
    clearBtn: { marginTop: 12, height: 36, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.danger, alignItems: "center", justifyContent: "center" },
    clearText: { fontSize: 12.5, color: colors.danger },
    section: { fontSize: 12, color: colors.faint, marginTop: 20, marginBottom: 8, marginLeft: 2 },
    textarea: { height: 170, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, padding: 10, fontSize: 11.5, lineHeight: 17, color: colors.ink, backgroundColor: colors.fieldBg, fontFamily: "monospace" as any },
    btnRow: { flexDirection: "row", gap: 8, marginTop: 10 },
    ghostBtn: { flex: 1, height: 38, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
    ghostText: { fontSize: 12.5, color: colors.ink },
    errorBox: { flexDirection: "row", gap: 6, alignItems: "flex-start", backgroundColor: colors.danger + "18", borderWidth: 1, borderColor: colors.danger + "55", borderRadius: radius.sm, padding: 10, marginTop: 10 },
    errorText: { flex: 1, fontSize: 11.5, color: colors.danger, lineHeight: 17 },
    previewHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    previewTitle: { fontSize: 13, fontWeight: "600", color: colors.ink },
    previewLine: { fontSize: 12, color: colors.sub, marginBottom: 4 },
    warnText: { fontSize: 11, color: colors.warnText, marginTop: 4 },
    primaryBtn: { marginTop: 12, height: 42, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "600" },
    code: { fontSize: 10.5, color: colors.sub, lineHeight: 16, fontFamily: "monospace" as any },
    tip: { fontSize: 11, color: colors.faint, lineHeight: 17, marginTop: 10 },
  });
