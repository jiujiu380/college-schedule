import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function SponsorScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="heart" size={22} color={colors.brand} />
        </View>
        <Text style={styles.heroTitle}>支持课表系统</Text>
        <Text style={styles.heroSub}>应用由学生团队独立开发与维护，完全免费使用</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>赞助会用在哪些地方</Text>
        {[
          { icon: "server-outline" as const, text: "镜像与下载服务器、构建机资源" },
          { icon: "phone-portrait-outline" as const, text: "真机测试设备与安卓签名维护" },
          { icon: "construct-outline" as const, text: "后续功能开发与长期维护" },
        ].map((it) => (
          <View key={it.text} style={styles.item}>
            <Ionicons name={it.icon} size={16} color={colors.sub} />
            <Text style={styles.itemText}>{it.text}</Text>
          </View>
        ))}
        <Text style={styles.note}>赞助完全自愿，不会解锁或限制任何功能。</Text>
      </View>

      <Text style={styles.section}>收款方式</Text>
      <View style={styles.qrRow}>
        {[
          { name: "微信支付", icon: "logo-wechat" as const, color: "#1AAD19" },
          { name: "支付宝", icon: "wallet-outline" as const, color: "#1677FF" },
        ].map((p) => (
          <View key={p.name} style={styles.qrCard}>
            <View style={styles.qrHead}>
              <Ionicons name={p.icon} size={16} color={p.color} />
              <Text style={styles.qrName}>{p.name}</Text>
            </View>
            <View style={styles.qrBox}>
              <Ionicons name="qr-code-outline" size={34} color={colors.faint} />
              <Text style={styles.qrHint}>收款码待上传</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.qrTip}>收款码图片将在后续版本中补充，届时可直接长按识别。</Text>

      <Text style={styles.section}>金额参考</Text>
      <View style={styles.amountRow}>
        {["5 元", "10 元", "20 元", "自定义"].map((a) => (
          <View key={a} style={styles.amountChip}>
            <Text style={styles.amountText}>{a}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>致谢</Text>
        <Text style={styles.thanks}>
          感谢每一位反馈问题、提供课表样例和支持开发的同学。你的名字会出现在后续版本的致谢名单中。
        </Text>
      </View>

      <Pressable style={styles.footerBtn} onPress={() => {}}>
        <Ionicons name="mail-outline" size={15} color={colors.sub} />
        <Text style={styles.footerText}>有其他建议？在「我的 → 检查更新」里反馈版本号即可</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    hero: { alignItems: "center", paddingVertical: 22 },
    heroIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    heroTitle: { fontSize: 20, fontWeight: "700", color: colors.ink, marginTop: 14 },
    heroSub: { fontSize: 12.5, color: colors.sub, marginTop: 8, textAlign: "center", lineHeight: 19, paddingHorizontal: 20 },
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginTop: 12 },
    cardTitle: { fontSize: 13.5, fontWeight: "600", color: colors.ink, marginBottom: 10 },
    item: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
    itemText: { fontSize: 12.5, color: colors.sub, flex: 1 },
    note: { fontSize: 11, color: colors.faint, marginTop: 10, lineHeight: 17 },
    section: { fontSize: 12, color: colors.faint, marginTop: 20, marginBottom: 8, marginLeft: 2 },
    qrRow: { flexDirection: "row", gap: 12 },
    qrCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12 },
    qrHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
    qrName: { fontSize: 12.5, color: colors.ink, fontWeight: "500" },
    qrBox: { height: 150, borderWidth: 1, borderStyle: "dashed", borderColor: colors.fieldBorder, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.fieldBg },
    qrHint: { fontSize: 11, color: colors.faint },
    qrTip: { fontSize: 11, color: colors.faint, marginTop: 10, lineHeight: 17 },
    amountRow: { flexDirection: "row", gap: 8 },
    amountChip: { flex: 1, height: 40, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
    amountText: { fontSize: 12, color: colors.sub },
    thanks: { fontSize: 12.5, color: colors.sub, lineHeight: 20 },
    footerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 18, paddingVertical: 10 },
    footerText: { fontSize: 11, color: colors.faint },
  });
