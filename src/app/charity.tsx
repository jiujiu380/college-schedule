import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

type MissingChild = {
  id: number;
  name: string;
  sex: string;
  birthDay: string;
  lostDay: string;
  lostAddress: string;
  lostHeight: string;
  feature: string;
  photoUrl: string;
  detailUrl: string;
};

const API = "https://api.xunjinlu.fun/api/babygome/index.php?type=json";
const BABY_HOME = "https://www.baobeihuijia.com/";

const CHARITIES = [
  {
    name: "宝贝回家志愿者协会",
    desc: "为走失、被拐儿童家庭提供免费寻亲服务，也可以申请成为志愿者。",
    url: "https://www.baobeihuijia.com/",
    tint: "#E11D48",
    icon: "heart-outline" as const,
  },
  {
    name: "中国儿童少年基金会",
    desc: "春蕾计划、儿童安全等项目，关注困境儿童教育与成长。",
    url: "https://www.cctf.org.cn/",
    tint: "#2563EB",
    icon: "school-outline" as const,
  },
  {
    name: "免费午餐",
    desc: "中国社会福利基金会项目，为乡村学童提供在校午餐。",
    url: "https://www.mianfeiwucan.org/",
    tint: "#F59E0B",
    icon: "restaurant-outline" as const,
  },
  {
    name: "联合国儿童基金会",
    desc: "面向全球儿童的健康、营养、教育与保护项目。",
    url: "https://www.unicef.cn/",
    tint: "#0EA5E9",
    icon: "globe-outline" as const,
  },
];

export default function CharityScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState<"find" | "donate">("find");
  const [child, setChild] = useState<MissingChild | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoOk, setPhotoOk] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API);
      const j: any = await res.json();
      if (Number(j?.code) !== 200 || !j?.data?.name) throw new Error("接口暂无数据");
      setChild({
        id: Number(j.data.id ?? 0),
        name: String(j.data.name ?? "未知"),
        sex: String(j.data.sex ?? ""),
        birthDay: String(j.data.birthDay ?? ""),
        lostDay: String(j.data.lostDay ?? ""),
        lostAddress: String(j.data.lostAddress ?? ""),
        lostHeight: String(j.data.lostHeight ?? ""),
        feature: String(j.data.feature ?? ""),
        photoUrl: String(j.data.photoUrl ?? ""),
        detailUrl: String(j.data.detailUrl ?? BABY_HOME),
      });
    } catch (e) {
      setChild(null);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPhotoOk(true);
  }, [child?.photoUrl]);

  const open = (url: string) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

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
              <Text style={styles.heroSub}>随机展示一条寻亲信息，多一次转发就多一份希望。</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}><ActivityIndicator color={colors.brand} /><Text style={styles.loadingText}>正在获取寻亲信息…</Text></View>
          ) : child ? (
            <View style={styles.card}>
              {child.photoUrl && photoOk ? (
                <Image
                  source={{ uri: child.photoUrl, headers: { Referer: "https://www.baobeihuijia.com/" } }}
                  style={styles.photo}
                  resizeMode="contain"
                  onError={() => setPhotoOk(false)}
                />
              ) : (
                <View style={[styles.photo, styles.photoEmpty]}><Ionicons name="image-outline" size={26} color={colors.faint} /></View>
              )}
              <View style={styles.badgeRow}>
                <Text style={styles.name}>{child.name}</Text>
                {child.sex ? <Text style={styles.sex}>{child.sex}</Text> : null}
              </View>
              <View style={styles.infoRow}><Text style={styles.label}>出生日期</Text><Text style={styles.value}>{child.birthDay || "—"}</Text></View>
              <View style={styles.infoRow}><Text style={styles.label}>走失日期</Text><Text style={styles.value}>{child.lostDay || "—"}</Text></View>
              <View style={styles.infoRow}><Text style={styles.label}>走失地点</Text><Text style={styles.value}>{child.lostAddress || "—"}</Text></View>
              {child.lostHeight ? <View style={styles.infoRow}><Text style={styles.label}>当时身高</Text><Text style={styles.value}>{child.lostHeight}</Text></View> : null}
              <Text style={styles.featureLabel}>特征描述</Text>
              <Text style={styles.feature}>{child.feature || "暂无更多描述"}</Text>

              <View style={styles.actions}>
                <Pressable style={styles.primary} onPress={() => open(child.detailUrl)}>
                  <Text style={styles.primaryText}>查看详情</Text>
                </Pressable>
                <Pressable style={styles.ghost} onPress={load}>
                  <Ionicons name="refresh" size={14} color={colors.ink} />
                  <Text style={styles.ghostText}>换一个</Text>
                </Pressable>
              </View>
              <Text style={styles.source}>数据来自宝贝回家公益平台，内容随机展示。若你有线索，请联系当地公安或宝贝回家。</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.errorIcon}><Ionicons name="cloud-offline-outline" size={22} color={colors.faint} /></View>
              <Text style={styles.errorTitle}>寻亲接口暂时不可用</Text>
              <Text style={styles.errorText}>可能是网络或接口限制，可以直接前往宝贝回家官网查看最新寻亲信息。</Text>
              <Pressable style={styles.primary} onPress={() => open(BABY_HOME)}><Text style={styles.primaryText}>打开宝贝回家官网</Text></Pressable>
              <Pressable style={styles.ghost} onPress={load}><Text style={styles.ghostText}>重试</Text></Pressable>
              {error ? <Text style={styles.errorSmall}>{error}</Text> : null}
            </View>
          )}

          <View style={styles.tipCard}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.brand} />
            <Text style={styles.tipText}>转发时请保留原始信息与联系方式，不要修改或裁剪图片。</Text>
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

          {CHARITIES.map((c) => (
            <Pressable key={c.name} style={styles.charityCard} onPress={() => open(c.url)}>
              <View style={[styles.charityIcon, { backgroundColor: c.tint + "1A" }]}>
                <Ionicons name={c.icon} size={20} color={c.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.charityName}>{c.name}</Text>
                <Text style={styles.charityDesc}>{c.desc}</Text>
                <Text style={styles.charityUrl}>{c.url.replace(/^https?:\/\//, "")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.faint} />
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
    loadingBox: { alignItems: "center", paddingVertical: 40, gap: 10 },
    loadingText: { fontSize: 12, color: colors.faint },
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 12 },
    photo: { width: "100%", height: 260, borderRadius: 12, backgroundColor: colors.chipBg },
    photoEmpty: { alignItems: "center", justifyContent: "center" },
    badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, marginBottom: 6 },
    name: { fontSize: 19, fontWeight: "800", color: colors.ink },
    sex: { fontSize: 11, color: colors.sub, backgroundColor: colors.chipBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 14, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.line },
    label: { fontSize: 12, color: colors.faint },
    value: { flex: 1, fontSize: 12.5, color: colors.ink, textAlign: "right", lineHeight: 19 },
    featureLabel: { fontSize: 12, color: colors.faint, marginTop: 12, marginBottom: 5 },
    feature: { fontSize: 12.5, color: colors.sub, lineHeight: 20 },
    actions: { flexDirection: "row", gap: 10, marginTop: 16 },
    primary: { flex: 1, height: 44, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "600" },
    ghost: { height: 44, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
    ghostText: { fontSize: 12.5, color: colors.ink },
    source: { fontSize: 10.5, color: colors.faint, lineHeight: 17, marginTop: 12 },
    errorIcon: { alignItems: "center", paddingTop: 10, paddingBottom: 8 },
    errorTitle: { fontSize: 15, fontWeight: "700", color: colors.ink, textAlign: "center" },
    errorText: { fontSize: 12, color: colors.sub, lineHeight: 19, textAlign: "center", marginTop: 6, marginBottom: 14 },
    errorSmall: { fontSize: 10.5, color: colors.faint, textAlign: "center", marginTop: 10 },
    tipCard: { flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
    tipText: { flex: 1, fontSize: 11, color: colors.faint, lineHeight: 18 },
    charityCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 10 },
    charityIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    charityName: { fontSize: 14, fontWeight: "600", color: colors.ink },
    charityDesc: { fontSize: 11, color: colors.sub, lineHeight: 17, marginTop: 3 },
    charityUrl: { fontSize: 10.5, color: colors.brand, marginTop: 5 },
  });