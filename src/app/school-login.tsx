import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SchoolWebView, SchoolWebViewHandle } from "../components/SchoolWebView";
import { useSchedule } from "../lib/schedule-store";
import { DEFAULT_SETUP, SchoolSetup, TimetableKind, loadSetup, timetableUrl } from "../lib/school-setup";
import { SCHOOL_ENDPOINTS } from "../lib/school-config";
import { useTheme } from "../lib/theme-context";
import { parseTimetableHtml } from "../lib/timetable-html";
import { Course } from "../lib/schedule";
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
  const [rawHtml, setRawHtml] = useState("");
  const [status, setStatus] = useState("请先在下方登录教务系统，再点「抓取课表」");

  useEffect(() => {
    loadSetup().then((s) => {
      setSetup(s);
      setKind(s.defaultKind);
    });
  }, []);

  const onMessage = (data: any) => {
    setBusy(false);
    if (data?.type === "error") {
      setStatus("抓取失败：" + String(data.message ?? ""));
      return;
    }
    if (data?.type !== "html") return;
    const html = String(data.html ?? "");
    setRawHtml(html);
    if (!html || html.length < 800 || /统一身份认证|请输入用户名|login\.jsp/i.test(html)) {
      setStatus("抓取到的是登录页，请先在网页里完成登录后再试");
      setCourses(null);
      return;
    }
    const parsed = parseTimetableHtml(html);
    setCourses(parsed);
    setStatus(parsed.length ? `解析到 ${parsed.length} 门课程` : "页面已抓到，但未解析出课程，可复制 HTML 发给开发者适配");
  };

  const fetchTimetable = () => {
    const url = timetableUrl(setup, kind);
    setBusy(true);
    setStatus("正在抓取…");
    webRef.current?.fetchTimetable(url);
    setTimeout(() => setBusy(false), 8000);
  };

  const apply = async () => {
    if (!courses?.length) return;
    applyApi(courses);
    Alert.alert("已切换到教务课表", `共 ${courses.length} 门课程，已按当前作息展示。`);
    router.replace("/schedule");
  };

  const copyHtml = async () => {
    if (!rawHtml) {
      Alert.alert("还没有抓取内容", "请先登录并点「抓取课表」。");
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
        <SchoolWebView ref={webRef} uri={SCHOOL_ENDPOINTS.authEntry} onMessage={onMessage} />
      </View>

      {Platform.OS === "web" ? (
        <Text style={styles.webTip}>网页版无法登录教务；请用手机 APK。{scheme === "dark" ? "" : ""}</Text>
      ) : null}
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
