import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "../components/Anim";
import { CourseEditor, formatWeeks } from "../components/CourseEditor";
import { SchoolWebView, SchoolWebViewHandle } from "../components/SchoolWebView";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { Course } from "../lib/schedule";
import { useSchedule } from "../lib/schedule-store";
import { parseStaticJson } from "../lib/static-timetable";
import { useTheme } from "../lib/theme-context";
import { parseTimetable, parseWeeks } from "../lib/timetable-html";
import { parseCsvText as parseCsvRows, parseWorkbookBase64, pickImportFile } from "../lib/file-import";
import { Period, WEEKDAYS } from "../lib/time";
import { Colors, radius } from "../theme";

type Tab = "web" | "source" | "csv" | "json" | "file";
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
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

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
    { key: "web", label: "网页" },
    { key: "source", label: "源码" },
    { key: "file", label: "文件" },
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

        {tab === "file" ? (
          <>
            <Text style={styles.hint}>支持 Excel(.xlsx/.xls)、CSV、JSON。表头可写：课程名、星期、开始节、结束节、周次、教师、地点；没有表头则按此顺序读取。</Text>
            <Pressable
              style={[styles.ghostBtn, { height: 46, borderColor: colors.brand, backgroundColor: colors.brandSoft }]}
              onPress={async () => {
                reset();
                try {
                  const picked = await pickImportFile();
                  if (!picked) return;
                  let list: Course[] = [];
                  if (picked.kind === "xlsx" && picked.base64) list = parseWorkbookBase64(picked.base64);
                  else if (picked.kind === "csv" && picked.text) list = parseCsvRows(picked.text);
                  else if (picked.kind === "json" && picked.text) {
                    const res = parseStaticJson(picked.text);
                    if (!res.ok) { setError(res.error); return; }
                    list = res.courses;
                  }
                  if (!list.length) {
                    setError("没有从文件里读到课程，请检查表头或列顺序。");
                    return;
                  }
                  setPending({ courses: list, periods: [], name: picked.name.replace(/\.[^.]+$/, "") });
                } catch (e) {
                  setError("读取文件失败：" + String(e instanceof Error ? e.message : e));
                }
              }}
            >
              <Ionicons name="folder-open-outline" size={16} color={colors.brand} />
              <Text style={[styles.ghostText, { color: colors.brand, marginLeft: 6 }]}>选择 Excel / CSV / JSON 文件</Text>
            </Pressable>
            <Text style={[styles.hint, { marginTop: 12 }]}>示例：第一行 课程名 | 星期 | 开始节 | 结束节 | 周次 | 教师 | 地点</Text>
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
            <Text style={styles.pendingMeta}>
              {pending.periods.length ? `${pending.periods.length} 个节次时间 · ` : ""}
              {conflictCount(pending.courses) > 0 ? `${conflictCount(pending.courses)} 处时间冲突` : "无时间冲突"}
            </Text>
            <View style={{ marginTop: 10 }}>
              {pending.courses.map((c, idx) => (
                <Pressable key={c.id} style={[styles.pendingRow, idx !== pending.courses.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line }]} onPress={() => setEditingIdx(idx)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingName} numberOfLines={1}>{c.name}</Text>
                    <Text style={styles.pendingSub}>周{WEEKDAYS[c.weekday - 1]} · 第 {c.startPeriod}-{c.endPeriod} 节 · 第 {formatWeeks(c.weeks)} 周</Text>
                  </View>
                  <Pressable hitSlop={8} onPress={() => setPending({ ...pending, courses: pending.courses.filter((_, i) => i !== idx) })}>
                    <Ionicons name="close-circle" size={18} color={colors.faint} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
            <PressableScale style={styles.importBtn} onPress={apply}>
              <Text style={styles.importText}>导入 {pending.courses.length} 门课程</Text>
            </PressableScale>
            <Text style={styles.pendingHint}>点击任意课程可先修改再导入</Text>
          </View>
        ) : null}

        <CourseEditor
          visible={editingIdx !== null}
          initial={editingIdx !== null ? pending?.courses[editingIdx] : null}
          onClose={() => setEditingIdx(null)}
          onSubmit={(course) => {
            if (!pending || editingIdx === null) return;
            const next = [...pending.courses];
            next[editingIdx] = course;
            setPending({ ...pending, courses: next });
            setEditingIdx(null);
          }}
        />
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

function conflictCount(courses: Course[]): number {
  let count = 0;
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const a = courses[i];
      const b = courses[j];
      if (a.weekday !== b.weekday) continue;
      if (a.startPeriod > b.endPeriod || b.startPeriod > a.endPeriod) continue;
      if (!a.weeks.some((w) => b.weeks.includes(w))) continue;
      count++;
    }
  }
  return count;
}

function parseCsvText(text: string): { courses: Course[]; periods: Period[] } {
  return { courses: parseCsvRows(text), periods: [] };
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
    pendingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9, gap: 8 },
    pendingName: { fontSize: 13, color: colors.ink, fontWeight: "500" },
    pendingSub: { fontSize: 10.5, color: colors.faint, marginTop: 3 },
    pendingHint: { fontSize: 10.5, color: colors.faint, textAlign: "center", marginTop: 8 },
    importBtn: { marginTop: 12, height: 42, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    importText: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "600" },
  });