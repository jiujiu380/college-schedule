import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { AGREEMENT_SECTIONS, AGREEMENT_VERSION, saveAgreed } from "../lib/agreement";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function AgreementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { view } = useLocalSearchParams<{ view?: string }>();
  const isView = view === "1";
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [atBottom, setAtBottom] = useState(false);
  const [progress, setProgress] = useState(0);

  const onScroll = (e: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const scrollable = Math.max(1, contentSize.height - layoutMeasurement.height);
    setProgress(Math.min(1, contentOffset.y / scrollable));
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 8) setAtBottom(true);
  };

  const onAgree = async () => {
    await saveAgreed();
    router.replace("/home");
  };

  const onDisagree = () => {
    Alert.alert("需要同意后才能使用", "本应用需要您同意《用户协议与隐私政策》后方可使用。", [
      { text: "再想想", style: "cancel" },
      { text: "返回阅读", onPress: () => {} },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>用户协议与隐私政策</Text>
        <Text style={styles.version}>版本 {AGREEMENT_VERSION}</Text>
      </View>

      <ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <Text style={styles.intro}>在使用「知酷课程表」前，请完整阅读以下条款。阅读并点击“同意”即表示您已理解并接受全部内容。</Text>
        {AGREEMENT_SECTIONS.map((s) => (
          <View key={s.heading} style={{ marginTop: 20 }}>
            <Text style={styles.heading}>{s.heading}</Text>
            {s.paragraphs.map((p, i) => (
              <Text key={i} style={styles.paragraph}>{p}</Text>
            ))}
          </View>
        ))}
        <Text style={styles.end}>— 协议正文结束 —</Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        {isView ? (
          <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryText}>返回</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.hint}>{atBottom ? "已阅读至底部，可以继续" : "请滑动阅读至底部后同意"}</Text>
            <Pressable
              onPress={onAgree}
              disabled={!atBottom}
              style={({ pressed }) => [styles.primaryBtn, !atBottom && styles.primaryBtnDisabled, pressed && atBottom && { opacity: 0.85 }]}
            >
              <Text style={[styles.primaryText, !atBottom && styles.primaryTextDisabled]}>{atBottom ? "同意并继续" : "同意并继续（未读完）"}</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={onDisagree}>
              <Text style={styles.ghostText}>不同意</Text>
            </Pressable>
          </>
        )}
        <View style={styles.safeRow}>
          <Ionicons name="lock-closed-outline" size={11} color={colors.faint} />
          <Text style={styles.safeText}>您的账号与课表数据仅保存在本机</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.surface },
    title: { fontSize: 18, fontWeight: "700", color: colors.ink },
    version: { fontSize: 11.5, color: colors.faint, marginTop: 5 },
    intro: { fontSize: 13, color: colors.sub, lineHeight: 22, marginTop: 16 },
    heading: { fontSize: 14, fontWeight: "700", color: colors.ink, marginBottom: 8 },
    paragraph: { fontSize: 13, color: colors.ink, lineHeight: 23, marginBottom: 8, opacity: 0.88 },
    end: { textAlign: "center", fontSize: 12, color: colors.faint, marginTop: 28 },
    footer: { borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.surface },
    progressTrack: { height: 2, backgroundColor: colors.lineSoft, borderRadius: 1, overflow: "hidden" },
    progressFill: { height: 2, backgroundColor: colors.brand },
    hint: { fontSize: 11.5, color: colors.faint, textAlign: "center", marginTop: 10, marginBottom: 8 },
    primaryBtn: { height: 44, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: 6 },
    primaryBtnDisabled: { backgroundColor: colors.chipBg },
    primaryText: { color: "#FFFFFF", fontSize: 14.5, fontWeight: "600" },
    primaryTextDisabled: { color: colors.faint },
    ghostBtn: { height: 36, alignItems: "center", justifyContent: "center", marginTop: 4 },
    ghostText: { fontSize: 12.5, color: colors.faint },
    safeRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 6 },
    safeText: { fontSize: 10.5, color: colors.faint },
  });
