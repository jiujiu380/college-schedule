import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { markIntroSeen } from "../lib/onboarding";
import { useTheme } from "../lib/theme-context";
import { Colors } from "../theme";

const SLIDES = [
  { icon: "calendar-outline" as const, title: "一张清爽的课表", desc: "单节排列、跨节整块显示，非本周课程淡化，还有冲突并排提示。" },
  { icon: "cloud-download-outline" as const, title: "怎么导都行", desc: "教务网页识别、源码粘贴、Excel / CSV / JSON 文件，导入前还能逐条改。" },
  { icon: "notifications-outline" as const, title: "上课不迟到", desc: "本地提前提醒，支持桌面小组件、天气、日历和备忘录。" },
  { icon: "shield-checkmark-outline" as const, title: "登录后更安心", desc: "账号数据保存在官网，课表、备忘录、日程可云端备份与恢复。" },
];

export default function IntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  const finish = async () => {
    await markIntroSeen();
    const { loadAgreed } = await import("../lib/agreement");
    const agreed = await loadAgreed();
    router.replace(agreed ? "/account?gate=1" : "/agreement");
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={styles.top}>
        <Pressable onPress={finish} hitSlop={8}><Text style={styles.skip}>跳过</Text></Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}><Ionicons name={slide.icon} size={54} color={colors.brand} /></View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && { backgroundColor: colors.brand, width: 20 }]} />
          ))}
        </View>
        <Pressable style={styles.primary} onPress={() => (index >= SLIDES.length - 1 ? finish() : setIndex(index + 1))}>
          <Text style={styles.primaryText}>{index >= SLIDES.length - 1 ? "开始使用" : "下一步"}</Text>
        </Pressable>
        <Text style={styles.note}>继续即表示你已阅读并同意相关协议</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24 },
    top: { alignItems: "flex-end" },
    skip: { fontSize: 13, color: colors.faint, padding: 6 },
    body: { flex: 1, alignItems: "center", justifyContent: "center" },
    iconWrap: { width: 116, height: 116, borderRadius: 34, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 24, fontWeight: "800", color: colors.ink, marginTop: 30, letterSpacing: -0.6, textAlign: "center" },
    desc: { fontSize: 14, color: colors.sub, lineHeight: 23, textAlign: "center", marginTop: 14, maxWidth: 300 },
    bottom: { gap: 12 },
    dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 10 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line },
    primary: { height: 50, borderRadius: 13, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
    note: { fontSize: 10.5, color: colors.faint, textAlign: "center" },
  });
