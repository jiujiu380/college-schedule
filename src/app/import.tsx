import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "../components/Anim";
import { SchoolWebView, SchoolWebViewHandle } from "../components/SchoolWebView";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { Course } from "../lib/schedule";
import { useSchedule } from "../lib/schedule-store";
import { parseStaticJson } from "../lib/static-timetable";
import { useTheme } from "../lib/theme-context";
import { parseTimetable, parseWeeks } from "../lib/timetable-html";
import { Period } from "../lib/time";
import { Colors, radius } from "../theme";

type Tab = "web" | "source" | "csv" | "json";
type Pending = { courses: Course[]; periods: Period[]; name: string };

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

export default function ImportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { importCourses, activeTable } = useSchedule();
  const webRef = useRef<SchoolWebViewHandle>(null);

  const [tab, setTab] = useState<Tab>("web");
  const [url, setUrl] = useState("https://zyjwxt.imau.edu.cn/academic/index.jsp");
  const [liveUrl, setLiveUrl] = useState(url);
  const [desktop, setDesktop] = useState(false);
  const [webStatus, setWebStatus] = useState("登录后打开课表页，再点「识别导入」");
  const [sourceText, setSourceText] = useState("");
  const [csvText, setCsvText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState("");

  const reset = () => {
    setPending(null);
    setError("");
  };

  const handleHtml = (html: string) => {
    if (!html || html.length < 500) {
      setWebStatus("页面内容太少，请确认已登录并打开课表");
      return;
    }
    if (/统一身份认证|请输入用户名|login\.jsp/i.test(html) && !/第\s*\d+\s*节/.test(html)) {
      setWebStatus("当前还是登录页，请先完成登录再打开课表");
      return;
    }
    const parsed = parseTimetable(html);
    if (!parsed.courses.length) {
      setWebStatus("没有识别到课程，可切到「粘贴源码」把页面源码发我适配");
      return;
    }
    setWebStatus(`识别到 ${parsed.courses.length} 门课程，确认后可导入`);
    setPending({ courses: parsed.courses, periods: parsed.periods, name: `导入课表 ${new Date().getMonth() + 1}/${new Date().getDate()}` });
  };

  const onMessage = (data: any) => {
    if (data?.type === "html") handleHtml(String(data.html ?? ""));
    if (data?.type === "error") setWebStatus("读取失败：" + String(data.message ?? ""));
  };

  const onRecognize = () => {
    setWebStatus("正在读取当前页面…");
    webRef.current?.readHtml();
  };

  const parseSource = () => {
    reset();
    const parsed = parseTimetable(sourceText);
    if (!parsed.courses.length) {
      setError("没有解析到课程。请确认粘贴的是课表页源码（含课表表格），或改用网页导入。");
      return;
    }
    setPending({ courses: parsed.courses, periods: parsed.periods, name: "源码导入课表" });
  };

  const parseCsv = () => {
    reset();
    const { courses, periods } = parseCsvText(csvText);
    if (!courses.length) {
      setError("CSV 没有解析到课程。格式：课程名,星期,开始节,结束节,周次,教师,地点");
      return;
    }
    setPending({ courses, periods, name: "CSV 导入课表" });
  };

  const parseJson = () => {
    reset();
    const res = parseStaticJson(jsonText);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setPending({ courses: res.courses, periods: [], name: res.name });
  };

  const apply = async () => {
    if (!pending) return;
    await importCourses(pending.courses, pending.periods, pending.name, "static");
    Alert.alert("导入成功", `已新建课表「${pending.name}」，共 ${pending.courses.length} 门课程。`);
    router.replace("/schedule");
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "web", label: "网页导入" },
    { key: "source", label: "源码" },
    { key: "csv", label: "CSV" },
    { key: "json", label: "JSON" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={styles.tabs}>
        {tabs.map((t) => (
          <Pressable key={t.key} onPress={() => { setTab(t.key); reset(); }} style={[styles.tab, tab === t.key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t.key && { color: colors.brand, fontWeight: "600" }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {tab === "web" ? (
          <>
            <View style={styles.urlRow}>
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="输入教务系统网址"
                placeholderTextColor={colors.faint}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.urlInput}
              />
              <Pressable style={styles.goBtn} onPress={() => setLiveUrl(url.trim())}>
                <Text style={styles.goText}>打开</Text>
              </Pressable>
            </View>

            <View style={styles.modeRow}>
              <View style={styles.segment}>
                {[{ k: false, l: "手机模式" }, { k: true, l: "电脑模式" }].map((m) => (
                  <Pressable key={String(m.k)} onPress={() => setDesktop(m.k)} style={[styles.segmentItem, desktop === m.k && styles.segmentActive]}>
                    <Text style={[styles.segmentText, desktop === m.k && { color: colors.brand, fontWeight: "600" }]}>{m.l}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.recognizeBtn} onPress={onRecognize}>
                <Ionicons name="scan-outline" size={14} color="#FFFFFF" />
                <Text style={styles.recognizeText}>识别导入</Text>
              </Pressable>
            </View>

            <Text style={styles.status}>{webStatus}</Text>

            <View style={styles.webBox}>
              <SchoolWebView
                key={liveUrl + String(desktop)}
                ref={webRef}
                uri={liveUrl}
                userAgent={desktop ? DESKTOP_UA : undefined}
                onMessage={onMessage}
                onNav={(u) => setWebStatus("当前页面：" + u.slice(0, 60))}
              />
            </View>
          </>
        ) : null}

        {tab === "source" ? (
          <>
            <Text style={styles.hint}>浏览器打开课表页 → 右键「查看网页源代码」→ 全选复制 → 粘贴到这里。</Text>
            <TextInput
              value={sourceText}
              onChangeText={setSourceText}
              placeholder="粘贴课表网页 HTML 源码…"
              placeholderTextColor={colors.faint}
              multiline
              textAlignVertical="top"
              style={styles.textarea}
            />
            <View style={styles.btnRow}>
              <Pressable style={styles.ghostBtn} onPress={async () => { const t = await Clipboard.getStringAsync(); if (t) setSourceText(t); }}>
                <Text style={styles.ghostText}>粘贴</Text>
              </Pressable>
              <PressableStyleBtn label="解析" onPress={parseSource} colors={colors} />
            </View>
          </>
        ) : null}

        {tab === "csv" ? (
          <>
            <Text style={styles.hint}>每行一门课：课程名,星期(周一/1),开始节,结束节,周次(1-16 或 1-16,18),教师,地点</Text>
            <TextInput
              value={csvText}
              onChangeText={setCsvText}
              placeholder={"高等数学,周一,1,2,1-16,张伟,致远楼302"}
              placeholderTextColor={colors.faint}
              multiline
              textAlignVertical="top"
              style={styles.textarea}
            />
            <View style={styles.btnRow}>
              <Pressable style={styles.ghostBtn} onPress={async () => { const t = await Clipboard.getStringAsync(); if (t) setCsvText(t); }}>
                <Text style={styles.ghostText}>粘贴</Text>
              </Pressable>
              <PressableStyleBtn label="解析" onPress={parseCsv} colors={colors} />
            </View>
          </>
        ) : null}

        {tab === "json" ? (
          <>
            <Text style={styles.hint}>支持之前约定的 JSON 格式，适合从其他课表工具导出。</Text>
            <TextInput
              value={jsonText}
              onChangeText={setJsonText}
              placeholder={'{"name":"课表","courses":[...]}'}
              placeholderTextColor={colors.faint}
              multiline
              textAlignVertical="top"
              style={styles.textarea}
            />
            <View style={styles.btnRow}>
              <Pressable style={styles.ghostBtn} onPress={async () => { const t = await Clipboard.getStringAsync(); if (t) setJsonText(t); }}>
                <Text style={styles.ghostText}>粘贴</Text>
              </Pressable>
              <PressableStyleBtn label="解析" onPress={parseJson} colors={colors} />
            </View>
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {pending ? (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingTitle}>已识别 {pending.courses.length} 门课程</Text>
            <Text style={styles.pendingMeta}>{pending.periods.length ? `${pending.periods.length} 个节次时间` : "将使用当前课表的节次时间"}</Text>
            <PressableScale style={styles.importBtn} onPress={apply}>
              <Text style={styles.importText}>导入为新课表</Text>
            </PressableScale>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function PressableStyleBtn({ label, onPress, colors }: { label: string; onPress: () => void; colors: Colors }) {
  return (
    <Pressable style={[stylesBtn.btn, { backgroundColor: colors.brand, borderColor: colors.brand }]} onPress={onPress}>
      <Text style={[stylesBtn.text, { color: "#FFFFFF" }]}>{label}</Text>
    </Pressable>
  );
}

function parseCsvText(text: string): { courses: Course[]; periods: Period[] } {
  const courses: Course[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let id = 0;
  for (const line of lines) {
    const cols = line.split(/[,\t]/).map((s) => s.trim());
    if (cols.length < 5) continue;
    if (/课程名|名称/.test(cols[0])) continue;
    const [name, dayRaw, startRaw, endRaw, weeksRaw, teacher, location] = cols;
    const weekday = parseWeekday(dayRaw);
    const start = Number(startRaw);
    const end = Number(endRaw) || start;
    if (!name || !weekday || !start) continue;
    courses.push({
      id: `csv-${++id}`,
      name,
      teacher: teacher || undefined,
      location: location || undefined,
      weekday,
      startPeriod: start,
      endPeriod: end,
      weeks: weeksRaw ? parseWeeks(weeksRaw) : Array.from({ length: 20 }, (_, i) => i + 1),
    });
  }
  return { courses, periods: [] };
}

function parseWeekday(v: string): number {
  const map: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 };
  const s = v.replace(/周|星期/g, "").trim();
  if (/^[1-7]$/.test(s)) return Number(s);
  return map[s] ?? 0;
}

const stylesBtn = StyleSheet.create({
  btn: { flex: 1, height: 40, borderRadius: 4, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 13, fontWeight: "600" },
});

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    tabs: { flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line },
    tab: { flex: 1, height: 32, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.chipBg },
    tabActive: { backgroundColor: colors.brandSoft },
    tabText: { fontSize: 12.5, color: colors.sub },
    urlRow: { flexDirection: "row", gap: 8 },
    urlInput: { flex: 1, height: 38, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 10, fontSize: 12, color: colors.ink, backgroundColor: colors.fieldBg },
    goBtn: { width: 54, height: 38, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    goText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "600" },
    modeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
    segment: { flexDirection: "row", backgroundColor: colors.chipBg, borderRadius: radius.sm, padding: 2, gap: 2 },
    segmentItem: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 3 },
    segmentActive: { backgroundColor: colors.surface },
    segmentText: { fontSize: 11.5, color: colors.sub },
    recognizeBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, height: 34, borderRadius: radius.sm, backgroundColor: colors.brand },
    recognizeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
    status: { fontSize: 11, color: colors.faint, marginTop: 8 },
    webBox: { height: 420, marginTop: 8, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
    hint: { fontSize: 11.5, color: colors.faint, lineHeight: 17, marginBottom: 8 },
    textarea: { height: 220, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, padding: 10, fontSize: 11.5, color: colors.ink, backgroundColor: colors.fieldBg, fontFamily: "monospace" as any },
    btnRow: { flexDirection: "row", gap: 10, marginTop: 10 },
    ghostBtn: { flex: 1, height: 40, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
    ghostText: { fontSize: 13, color: colors.ink },
    error: { fontSize: 11.5, color: colors.danger, marginTop: 10, lineHeight: 17 },
    pendingCard: { marginTop: 14, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.infoBorder, backgroundColor: colors.infoBg },
    pendingTitle: { fontSize: 13.5, fontWeight: "600", color: colors.ink },
    pendingMeta: { fontSize: 11.5, color: colors.sub, marginTop: 4 },
    importBtn: { marginTop: 12, height: 42, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    importText: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "600" },
  });
