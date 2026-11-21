import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function SponsorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="heart" size={22} color={colors.brand} /></View>
        <Text style={styles.heroTitle}>支持知酷课程表</Text>
        <Text style={styles.heroSub}>应用由个人开发者独立维护，完全免费、无广告</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>赞助会用在哪些地方</Text>
        {[
          { icon: "server-outline" as const, text: "官网与下载服务器、构建资源" },
          { icon: "phone-portrait-outline" as const, text: "真机测试与长期功能维护" },
          { icon: "construct-outline" as const, text: "新功能开发与问题修复" },
        ].map((it) => (
          <View key={it.text} style={styles.item}>
            <Ionicons name={it.icon} size={16} color={colors.sub} />
            <Text style={styles.itemText}>{it.text}</Text>
          </View>
        ))}
        <Text style={styles.note}>赞助完全自愿，不会解锁或限制任何功能。</Text>
      </View>

      <Text style={styles.section}>收款码</Text>
      <View style={styles.qrRow}>
        <View style={styles.qrCard}>
          <View style={styles.qrHead}>
            <Ionicons name="logo-wechat" size={16} color="#1AAD19" />
            <Text style={styles.qrName}>微信支付</Text>
          </View>
          <Image source={require("../../assets/sponsor-wechat.png")} style={styles.qrImage} resizeMode="contain" />
        </View>
        <View style={styles.qrCard}>
          <View style={styles.qrHead}>
            <Ionicons name="wallet-outline" size={16} color="#1677FF" />
            <Text style={styles.qrName}>支付宝</Text>
          </View>
          <Image source={require("../../assets/sponsor-alipay.png")} style={styles.qrImage} resizeMode="contain" />
        </View>
      </View>
      <Text style={styles.qrTip}>长按图片或截图后扫码；感谢你的支持。</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>致谢</Text>
        <Text style={styles.thanks}>感谢每一位反馈问题、提供课表样例和支持开发的同学。</Text>
      </View>

      <Pressable style={styles.linkBtn} onPress={() => router.push("/contact")}>
        <Ionicons name="mail-outline" size={16} color={colors.brand} />
        <Text style={styles.linkText}>联系作者</Text>
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
    qrImage: { width: "100%", height: 150, borderRadius: 8, backgroundColor: "#FFFFFF" },
    qrTip: { fontSize: 11, color: colors.faint, marginTop: 10, lineHeight: 17 },
    thanks: { fontSize: 12.5, color: colors.sub, lineHeight: 20 },
    linkBtn: { marginTop: 18, height: 46, borderRadius: 10, borderWidth: 1, borderColor: colors.infoBorder, backgroundColor: colors.brandSoft, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    linkText: { fontSize: 13.5, color: colors.brand, fontWeight: "600" },
  });
