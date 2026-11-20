import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { useAuth } from "../../lib/auth";
import { cancelAllReminders, ensureNotifyPermission, isNotifyEnabled, scheduleClassReminders, setNotifyEnabled } from "../../lib/notifications";
import { useSchedule } from "../../lib/schedule-store";
import { DEFAULT_SETUP, SchoolSetup, loadSetup } from "../../lib/school-setup";
import { useTheme } from "../../lib/theme-context";
import { useUpdate } from "../../lib/update-store";
import { Colors, ThemeMode, radius } from "../../theme";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { studentId, status, signOut } = useAuth();
  const { courses, periods, seasonText, source } = useSchedule();
  const { mode, setMode, colors, scheme } = useTheme();
  const { result: updateResult, checking: updateChecking } = useUpdate();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [setup, setSetup] = useState<SchoolSetup>(DEFAULT_SETUP);
  const [notify, setNotify] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadSetup().then(setSetup);
    isNotifyEnabled().then(setNotify);
  }, []);

  const onToggleNotify = async (next: boolean) => {
    if (Platform.OS === "web") {
      Alert.alert("暂不支持", "网页版无法申请通知权限，请在手机端（开发包或 APK）中开启。");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (next) {
        const granted = await ensureNotifyPermission();
        if (!granted) {
          Alert.alert("通知权限未开启", "请在系统设置中允许「课表系统」发送通知后重试。");
          return;
        }
        const count = await scheduleClassReminders(courses, periods, { days: 14, leadMinutes: 10 });
        await setNotifyEnabled(true);
        setNotify(true);
        Alert.alert("已开启上课提醒", `已按照${seasonText}为未来两周排期 ${count} 条提醒。`);
      } else {
        await cancelAllReminders();
        await setNotifyEnabled(false);
        setNotify(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const onSignOut = () => {
    Alert.alert("退出登录", "确定要退出当前账号吗？", [
      { text: "取消", style: "cancel" },
      { text: "退出", style: "destructive", onPress: async () => { await signOut(); router.replace("/login"); } },
    ]);
  };

  const Row = ({ icon, label, value, onPress, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress?: () => void; last?: boolean }) => (
    <Pressable style={[styles.row, !last && styles.divider]} onPress={onPress}>
      <Ionicons name={icon} size={17} color={colors.sub} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={14} color={colors.faint} />
    </Pressable>
  );

  const modes: { key: ThemeMode; label: string }[] = [
    { key: "system", label: "跟随系统" },
    { key: "light", label: "浅色" },
    { key: "dark", label: "深色" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Text style={styles.title}>我的</Text>

      <View style={[styles.card, { marginTop: 14 }]}>
        <View style={styles.profile}>
          <View style={styles.avatar}><Ionicons name="person" size={22} color="#FFFFFF" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{setup.studentId || studentId || "未设置学号"}</Text>
            <Text style={styles.role}>{status === "demo" ? "演示账号 · 示例数据" : status === "authed" ? "已连接教务系统" : "未登录教务"}</Text>
          </View>
          <Text style={[styles.statusTag, status === "demo" && { color: colors.warnText, borderColor: colors.warnBorder }, status === "guest" && { color: colors.faint, borderColor: colors.line }]}>
            {status === "demo" ? "DEMO" : status === "authed" ? "ONLINE" : "OFFLINE"}
          </Text>
        </View>
      </View>

      <Text style={styles.section}>教务初始化</Text>
      <View style={styles.card}>
        <View style={[styles.row, styles.divider]}>
          <Ionicons name="person-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>个人课表 ID</Text>
          <Text style={styles.rowValue}>{setup.personalId || "未设置"}</Text>
        </View>
        <View style={[styles.row, styles.divider]}>
          <Ionicons name="people-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>班级课表 ID</Text>
          <Text style={styles.rowValue}>{setup.classId || "未设置"}</Text>
        </View>
        <View style={[styles.row, styles.divider]}>
          <Ionicons name="calendar-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>学年 / 学期</Text>
          <Text style={styles.rowValue}>{setup.yearId} / {setup.termId}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10, margin: 14 }}>
          <Pressable style={[styles.saveBtn, { flex: 1, margin: 0 }]} onPress={() => router.push("/setup")}>
            <Text style={styles.saveText}>初始化设置</Text>
          </Pressable>
          <Pressable style={styles.testBtn} onPress={() => router.push("/school-login")}>
            <Text style={styles.testText}>登录抓取</Text>
          </Pressable>
        </View>
        <Text style={styles.tip}>参数由学校教务系统提供，应用自动拼接课表地址，无需填写任何接口地址。教务系统仅限校园网 / VPN 访问。</Text>
      </View>

      <Text style={styles.section}>提醒与作息</Text>
      <View style={styles.card}>
        <View style={[styles.row, styles.divider]}>
          <Ionicons name="notifications-outline" size={17} color={colors.sub} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>上课提醒</Text>
            <Text style={styles.rowSub}>课前 10 分钟弹出通知</Text>
          </View>
          <Switch value={notify} onValueChange={onToggleNotify} disabled={busy} trackColor={{ true: colors.brand, false: colors.line }} thumbColor={notify ? "#FFFFFF" : colors.faint} />
        </View>
        <View style={styles.row}>
          <Ionicons name="sunny-outline" size={17} color={colors.sub} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>当前作息</Text>
            <Text style={styles.rowSub}>10 月 7 日自动切换夏 / 秋作息</Text>
          </View>
          <Text style={styles.tag}>{seasonText}</Text>
        </View>
      </View>

      <Text style={styles.section}>外观</Text>
      <View style={styles.card}>
        <View style={[styles.row, { paddingVertical: 14 }]}>
          <Ionicons name="moon-outline" size={17} color={colors.sub} />
          <Text style={styles.rowLabel}>深色模式</Text>
          <View style={styles.segment}>
            {modes.map((m) => (
              <Pressable key={m.key} onPress={() => setMode(m.key)} style={[styles.segmentItem, mode === m.key && styles.segmentItemActive]}>
                <Text style={[styles.segmentText, mode === m.key && { color: colors.brand, fontWeight: "600" }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.section}>通用</Text>
      <View style={styles.card}>
        <Row
          icon="cloud-download-outline"
          label="检查更新"
          value={updateChecking ? "检查中…" : updateResult?.status === "available" ? `新版本 v${updateResult.latest}` : updateResult?.status === "latest" ? "已是最新" : updateResult?.notFound ? "暂无发布" : "未检查"}
          onPress={() => router.push("/update")}
        />
        <Row icon="layers-outline" label="静态课表导入" value={source === "static" ? "已导入" : "未导入"} onPress={() => router.push("/import")} />
        <Row icon="document-text-outline" label="用户协议与隐私政策" onPress={() => router.push("/agreement?view=1")} />
        <Row icon="heart-outline" label="赞助支持" onPress={() => router.push("/sponsor")} />
        <Row icon="download-outline" label="导出课表" value="即将开放" />
        <Row icon="information-circle-outline" label="版本" value="1.0.0 (MVP)" last />
      </View>

      <Pressable style={[styles.card, styles.logout]} onPress={onSignOut}>
        <Text style={styles.logoutText}>退出登录</Text>
      </Pressable>
      <Text style={styles.footer}>课表系统 · Campus Schedule</Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    title: { fontSize: 22, fontWeight: "700", color: colors.ink, paddingHorizontal: 16 },
    card: { backgroundColor: colors.surface, marginHorizontal: 16, marginTop: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
    profile: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    name: { fontSize: 16, fontWeight: "600", color: colors.ink },
    role: { fontSize: 11.5, color: colors.sub, marginTop: 4 },
    statusTag: { fontSize: 10, fontWeight: "600", color: colors.success, borderWidth: 1, borderColor: colors.success, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
    section: { fontSize: 12, color: colors.faint, marginTop: 22, marginBottom: 2, marginLeft: 18 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
    tip: { fontSize: 11, color: colors.faint, lineHeight: 16, paddingHorizontal: 14, paddingBottom: 14 },
    saveBtn: { height: 40, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    saveText: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "600" },
    testBtn: { flex: 1, height: 40, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
    testText: { color: colors.ink, fontSize: 13, fontWeight: "500" },
    row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 10 },
    rowLabel: { flex: 1, fontSize: 13.5, color: colors.ink },
    rowSub: { fontSize: 10.5, color: colors.faint, marginTop: 3 },
    rowValue: { fontSize: 12, color: colors.faint },
    tag: { fontSize: 11, color: colors.brand, borderWidth: 1, borderColor: colors.infoBorder, backgroundColor: colors.infoBg, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
    segment: { flexDirection: "row", backgroundColor: colors.chipBg, borderRadius: radius.sm, padding: 2, gap: 2 },
    segmentItem: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 3 },
    segmentItemActive: { backgroundColor: colors.surface },
    segmentText: { fontSize: 11, color: colors.sub },
    logout: { marginTop: 22, height: 46, alignItems: "center", justifyContent: "center" },
    logoutText: { fontSize: 14, color: colors.danger },
    footer: { textAlign: "center", fontSize: 11, color: colors.faint, marginTop: 20 },
  });
