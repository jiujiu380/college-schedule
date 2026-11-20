import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SchoolWebView, SchoolWebViewHandle } from "../components/SchoolWebView";
import { useSchedule } from "../lib/schedule-store";
import { DEFAULT_SETUP, SchoolSetup, TimetableKind, loadSetup, saveSetup, timetableUrl } from "../lib/school-setup";
import { SCHOOL_ENDPOINTS } from "../lib/school-config";
import { useTheme } from "../lib/theme-context";
import { parseTimetable } from "../lib/timetable-html";
import { Course } from "../lib/schedule";
import { Period } from "../lib/time";
import { Colors, radius } from "../theme";

export default function SchoolLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { applyApi } = useSchedule();
  const webRef = useRef<SchoolWebViewHandle>(null);
  const [setup, setSetup] = useState<SchoolSetup>(DEFAULT_SETUP);
  const [kind, setKind] = useState<TimetableKind>("STUDENT");
  const [busy, setBusy] = useState(false);
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [rawHtml, setRawHtml] = useState("");
  const [status, setStatus] = useState("先在下方登录教务系统，再打开「课表」页面，会自动识别");

  useEffect(() => {
    loadSetup().then((s) => {
      setSetup(s);
      setKind(s.defaultKind);
    });
  }, []);

  const handleHtml = (html: string) => {
    setRawHtml(html);
    if (!html || html.length < 800 || /统一身份认证|请输入用户名|login\.jsp/i.test(html)) {
      setStatus("拿到的是登录页，请先在网页里完成登录并打开课表");
      setCourses(null);
      return;
    }
    const parsed = parseTimetable(html);
    setCourses(parsed.courses);
    setPeriods(parsed.periods);
    setStatus(parsed.courses.length ? `识别到 ${parsed.courses.length} 门课程` : "页面已拿到，但未解析出课程，请点复制 HTML 发给开发者");
  };

  const onMessage = (data: any) => {
    setBusy(false);
    if (data?.type === "error") {
      setStatus("抓取失败：" + String(data.message ?? ""));
      return;
    }
    if (data?.type === "html") handleHtml(String(data.html ?? ""));
  };

  const onNav = (url: string) => {
    const m = url.match(/showTimetable\.do\?id=(\d+)[^#]*timetableType=(STUDENT|CLASSES)/i);
    if (m) {
      const id = m[1];
      const k = m[2].toUpperCase() as TimetableKind;
      setKind(k);
      const next = { ...setup, [k === "STUDENT" ? "personalId" : "classId"]: id } as SchoolSetup;
      setSetup(next);
      saveSetup(next).catch(() => {});
      setStatus(`识别到${k === "STUDENT" ? "个人" : "班级"}课表（id=${id}），正在读取…`);
      setTimeout(() => webRef.current?.readHtml(), 900);
    }
  };

  const fetchTimetable = () => {
    setBusy(true);
    setStatus("正在抓取…");
    webRef.current?.fetchTimetable(timetableUrl(setup, kind));
    setTimeout(() => setBusy(false), 8000);
  };

  const apply = async () => {
    if (!courses?.length) return;
    await applyApi(courses, periods);
    Alert.alert("已切换到教务课表", `共 ${courses.length} 门课程，已按课表实际节次时间展示。`);
    router.replace("/schedule");
  };

  const copyHtml = async () => {
    if (!rawHtml) {
      Alert.alert("还没有抓取内容", "请先登录并打开课表页。");
      return;
    }
    await Clipboard.setStringAsync(rawHtml);
    Alert.alert("已复制", "页面 HTML 已复制到剪贴板，可以发给开发者适配解析。");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.toolbar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.row}>
          {(["STUDENT", "CLASSES"] as TimetableKind[]).map((k) => (
            <Pressable key={k} onPress={() => setKind(k)} style={[styles.chip, kind === k && styles.chipActive]}>
              <Text style={[styles.chipText, kind === k && { color: colors.brand, fontWeight: "600" }]}>{k === "STUDENT" ? "个人课表" : "班级课表"}</Text>
            </Pressable>
          ))}
          <View style={{ flex: 1 }} />
          <Pressable style={styles.action} onPress={fetchTimetable}>
            <Text style={styles.actionText}>{busy ? "抓取中…" : "抓取课表"}</Text>
          </Pressable>
        </View>
        <Text style={styles.status}>{status}</Text>
        {courses?.length ? (
          <View style={styles.applyRow}>
            <Pressable style={styles.applyBtn} onPress={apply}>
              <Text style={styles.applyText}>应用到课表（{courses.length} 门）</Text>
            </Pressable>
            <Pressable style={styles.ghost} onPress={copyHtml}>
              <Ionicons name="copy-outline" size={14} color={colors.sub} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        <SchoolWebView ref={webRef} uri={SCHOOL_ENDPOINTS.authEntry} onMessage={onMessage} onNav={onNav} />
      </View>

      {Platform.OS === "web" ? <Text style={styles.webTip}>网页版无法登录教务；请用手机 APK。</Text> : null}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    toolbar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line, paddingHorizontal: 12, paddingBottom: 10 },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.chipBg, borderWidth: 1, borderColor: "transparent" },
    chipActive: { backgroundColor: colors.brandSoft, borderColor: colors.infoBorder },
    chipText: { fontSize: 12, color: colors.sub },
    action: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm, backgroundColor: colors.brand },
    actionText: { fontSize: 12, color: "#FFFFFF", fontWeight: "600" },
    status: { fontSize: 11, color: colors.faint, marginTop: 8 },
    applyRow: { flexDirection: "row", gap: 8, marginTop: 8 },
    applyBtn: { flex: 1, height: 36, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    applyText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "600" },
    ghost: { width: 42, height: 36, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center" },
    webTip: { fontSize: 11, color: colors.faint, textAlign: "center", paddingVertical: 8 },
  });
