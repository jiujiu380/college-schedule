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
      { icon: "newspaper-outline", label: "每日新闻", desc: "今日要闻与详情", route: "/news", tint: "#F97316" },
      { icon: "checkbox-outline", label: "作业 DDL", desc: "截止时间与逾期提醒", route: "/homework", tint: "#DC2626" },
      { icon: "timer-outline", label: "考试倒计时", desc: "最近考试还剩多久", route: "/exams", tint: "#0F766E" },
      { icon: "qr-code-outline", label: "课表分享", desc: "二维码 / 分享码导入", route: "/share", tint: "#7C3AED" },
      { icon: "download-outline", label: "导出与日历", desc: "图片 / PDF / 系统日历", route: "/export", tint: "#0EA5E9" },
      { icon: "folder-open-outline", label: "课程资料柜", desc: "PPT / 照片 / 课堂笔记", route: "/materials", tint: "#D97706" },
      { icon: "stats-chart-outline", label: "学习统计", desc: "课时 / 自习 / 作业完成率", route: "/stats", tint: "#0F766E" },
    ],
  },
  {
    title: "服务",
    items: [
      { icon: "search-outline", label: "全局搜索", desc: "课程 / 作业 / 考试 / 备忘", route: "/search", tint: "#2563EB" },
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
      { icon: "heart-outline", label: "公益专栏", desc: "寻亲与公益捐赠", route: "/charity", tint: "#E11D48" },
      { icon: "heart-outline", label: "赞助支持", desc: "支持独立开发", route: "/sponsor", tint: "#E11D48" },
      { icon: "construct-outline", label: "开发者选项", desc: "推送 / 网络 / 同步调试", route: "/developer", tint: "#64748B" },
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