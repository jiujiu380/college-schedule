import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

type Channel = {
  name: string;
  desc: string;
  url: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  action: string;
};

const FIND_CHANNELS: Channel[] = [
  {
    name: "宝贝回家志愿者协会",
    desc: "免费登记寻亲信息、查找走失被拐儿童，也可以申请成为志愿者。",
    url: "https://www.baobeihuijia.com/",
    icon: "heart-outline",
    tint: "#E11D48",
    action: "前往宝贝回家",
  },
  {
    name: "全国救助寻亲网",
    desc: "民政部救助管理机构发布的受助人员寻亲公告，可按地区查找。",
    url: "https://xunqin.mca.gov.cn/",
    icon: "search-outline",
    tint: "#2563EB",
    action: "打开寻亲网",
  },
  {
    name: "公安部「团圆」系统",
    desc: "公安机关儿童失踪信息紧急发布平台，发现线索请第一时间报警。",
    url: "https://www.mps.gov.cn/",
    icon: "shield-checkmark-outline",
    tint: "#0F766E",
    action: "前往公安部",
  },
  {
    name: "央视《等着我》",
    desc: "公益寻人节目官网，可提交寻人求助并查看往期案例。",
    url: "https://tv.cctv.com/lm/dzw/",
    icon: "tv-outline",
    tint: "#7C3AED",
    action: "打开节目官网",
  },
];

const DONATE_CHANNELS: Channel[] = [
  {
    name: "宝贝回家志愿者协会",
    desc: "为走失、被拐儿童家庭提供免费寻亲服务，也可以申请成为志愿者。",
    url: "https://www.baobeihuijia.com/",
    icon: "heart-outline",
    tint: "#E11D48",
    action: "前往官网",
  },
  {
    name: "中国儿童少年基金会",
    desc: "春蕾计划、儿童安全等项目，关注困境儿童教育与成长。",
    url: "https://www.cctf.org.cn/",
    icon: "school-outline",
    tint: "#2563EB",
    action: "前往官网",
  },
  {
    name: "免费午餐",
    desc: "中国社会福利基金会项目，为乡村学童提供在校午餐。",
    url: "https://www.mianfeiwucan.org/",
    icon: "restaurant-outline",
    tint: "#F59E0B",
    action: "前往官网",
  },
  {
    name: "联合国儿童基金会",
    desc: "面向全球儿童的健康、营养、教育与保护项目。",
    url: "https://www.unicef.cn/",
    icon: "globe-outline",
    tint: "#0EA5E9",
    action: "前往官网",
  },
];

export default function CharityScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState<"find" | "donate">("find");

  const open = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "find" && styles.tabActive]} onPress={() => setTab("find")}>
          <Text style={[styles.tabText, tab === "find" && { color: colors.brand, fontWeight: "600" }]}>寻亲</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "donate" && styles.tabActive]} onPress={() => setTab("donate")}>
          <Text style={[styles.tabText, tab === "donate" && { color: colors.brand, fontWeight: "600" }]}>捐赠</Text>
        </Pressable>
      </View>

      {tab === "find" ? (
        <>
          <View style={styles.hero}>
            <View style={styles.heroIcon}><Ionicons name="heart" size={18} color="#E11D48" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>帮宝贝回家</Text>
              <Text style={styles.heroSub}>本应用只汇总官方寻亲渠道，不采集、不展示个人寻亲数据。</Text>
            </View>
          </View>

          {FIND_CHANNELS.map((c) => (
            <Pressable key={c.name} style={styles.channelCard} onPress={() => open(c.url)}>
              <View style={[styles.channelIcon, { backgroundColor: c.tint + "18" }]}>
                <Ionicons name={c.icon} size={20} color={c.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.channelName}>{c.name}</Text>
                <Text style={styles.channelDesc}>{c.desc}</Text>
                <View style={styles.channelLinkRow}>
                  <Text style={styles.channelUrl}>{c.url.replace(/^https?:\/\//, "")}</Text>
                  <Text style={styles.channelAction}>{c.action} →</Text>
                </View>
              </View>
            </Pressable>
          ))}

          <View style={styles.tipCard}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.brand} />
            <Text style={styles.tipText}>发现走失、拐卖线索请立即拨打 110，不要仅依赖网络转发；转发时请保留原始信息。</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: "#E8F7EF" }]}><Ionicons name="gift" size={18} color="#059669" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>把善意送到需要的地方</Text>
              <Text style={styles.heroSub}>本应用不代收、不代转任何捐赠款，以下均为官方公益渠道。</Text>
            </View>
          </View>

          {DONATE_CHANNELS.map((c) => (
            <Pressable key={c.name} style={styles.channelCard} onPress={() => open(c.url)}>
              <View style={[styles.channelIcon, { backgroundColor: c.tint + "18" }]}>
                <Ionicons name={c.icon} size={20} color={c.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.channelName}>{c.name}</Text>
                <Text style={styles.channelDesc}>{c.desc}</Text>
                <View style={styles.channelLinkRow}>
                  <Text style={styles.channelUrl}>{c.url.replace(/^https?:\/\//, "")}</Text>
                  <Text style={styles.channelAction}>{c.action} →</Text>
                </View>
              </View>
            </Pressable>
          ))}

          <View style={styles.tipCard}>
            <Ionicons name="information-circle-outline" size={16} color={colors.brand} />
            <Text style={styles.tipText}>捐赠前请通过官网核实项目与收款主体；本应用不会向你索取银行卡、验证码或转账。</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    tabs: { flexDirection: "row", backgroundColor: colors.chipBg, borderRadius: 12, padding: 3, marginBottom: 14 },
    tab: { flex: 1, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 9 },
    tabActive: { backgroundColor: colors.surface },
    tabText: { fontSize: 13.5, color: colors.sub },
    hero: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 12 },
    heroIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FDE8EE", alignItems: "center", justifyContent: "center" },
    heroTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
    heroSub: { fontSize: 11.5, color: colors.sub, lineHeight: 18, marginTop: 4 },
    channelCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 10 },
    channelIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    channelName: { fontSize: 14.5, fontWeight: "600", color: colors.ink },
    channelDesc: { fontSize: 11.5, color: colors.sub, lineHeight: 18, marginTop: 4 },
    channelLinkRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 },
    channelUrl: { fontSize: 10.5, color: colors.faint, flexShrink: 1 },
    channelAction: { fontSize: 11, color: colors.brand, fontWeight: "600" },
    tipCard: { flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, marginTop: 4 },
    tipText: { flex: 1, fontSize: 11, color: colors.faint, lineHeight: 18 },
  });