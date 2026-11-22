import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { useSchedule } from "../../lib/schedule-store";
import { useGlobalRefresh } from "../../lib/app-refresh";
import { useTheme } from "../../lib/theme-context";
import { Colors, radius } from "../../theme";

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; desc: string; route: string; tint?: string };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "学习工具",
    items: [
      { icon: "partly-sunny-outline", label: "天气提醒", desc: "本地天气与每日推送", route: "/weather", tint: "#F59E0B" },
      { icon: "calendar-outline", label: "日历", desc: "课程与日程一屏看完", route: "/calendar", tint: "#2F5BFF" },
      { icon: "journal-outline", label: "备忘录", desc: "富文本 + 手绘，离线", route: "/memo", tint: "#059669" },
    ],
  },
  {
    title: "服务",
    items: [
      { icon: "megaphone-outline", label: "公告", desc: "官网发布的最新消息", route: "/announcements", tint: "#E11D48" },
      { icon: "chatbubbles-outline", label: "工单反馈", desc: "提交问题，查看回复", route: "/tickets", tint: "#7C3AED" },
      { icon: "save-outline", label: "备份与恢复", desc: "导出 / 导入全部课表", route: "/backup", tint: "#0EA5E9" },
      { icon: "cloud-download-outline", label: "检查更新", desc: "官网 / GitHub 双通道", route: "/update", tint: "#64748B" },
    ],
  },
  {
    title: "关于",
    items: [
      { icon: "mail-outline", label: "联系作者", desc: "class.zcoow.cn", route: "/contact", tint: "#2F5BFF" },
      { icon: "help-circle-outline", label: "新手指引", desc: "重看操作引导", route: "/home?tour=1", tint: "#F59E0B" },
      { icon: "heart-outline", label: "赞助支持", desc: "支持独立开发", route: "/sponsor", tint: "#E11D48" },
    ],
  },
];

export default function ToolsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tables } = useSchedule();
  const { refreshing, refresh } = useGlobalRefresh();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 16, paddingBottom: 112 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} colors={[colors.brand]} />}
    >
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Text style={styles.title}>工具</Text>
      <Text style={styles.subtitle}>学习、服务与帮助都在这里</Text>

      {GROUPS.map((group) => (
        <View key={group.title}>
          <Text style={styles.section}>{group.title}</Text>
          <View style={styles.grid}>
            {group.items.map((item) => (
              <Pressable key={item.label} style={styles.card} onPress={() => router.push(item.route as any)}>
                <View style={[styles.iconBox, { backgroundColor: (item.tint ?? colors.brand) + "18" }]}>
                  <Ionicons name={item.icon} size={20} color={item.tint ?? colors.brand} />
                </View>
                <Text style={styles.cardLabel}>{item.label}</Text>
                <Text style={styles.cardDesc} numberOfLines={1}>{item.desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.footer}>知酷课程表 · 数据保存在本机 · {tables.length} 张课表</Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    title: { fontSize: 26, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
    subtitle: { fontSize: 12, color: colors.faint, marginTop: 5 },
    section: { fontSize: 12, color: colors.faint, marginTop: 20, marginBottom: 8, marginLeft: 2 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    card: { width: "48%", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14 },
    iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
    cardLabel: { fontSize: 13.5, fontWeight: "600", color: colors.ink },
    cardDesc: { fontSize: 10.5, color: colors.faint, marginTop: 4 },
    footer: { textAlign: "center", fontSize: 10.5, color: colors.faint, marginTop: 24 },
  });