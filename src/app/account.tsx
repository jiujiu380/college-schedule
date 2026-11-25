import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaptchaModal } from "../components/CaptchaModal";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { AccountUser, CaptchaPayload, getCachedAccount, loginAccount, logoutAccount, refreshAccount, registerAccount, updateProfile } from "../lib/account";
import { applyCloudData, downloadCloud, uploadCloud } from "../lib/cloud-sync";
import { useSchedule } from "../lib/schedule-store";
import { fetchSiteInfo, getSiteBase } from "../lib/site-api";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function AccountScreen() {
  const router = useRouter();
  const { gate } = useLocalSearchParams<{ gate?: string }>();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tables, activeId, restore } = useSchedule();

  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [qq, setQq] = useState("");
  const [wechat, setWechat] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [agree, setAgree] = useState(false);
  const [captchaVisible, setCaptchaVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | ((cap?: CaptchaPayload) => Promise<void>)>(null);

  const [nickname, setNickname] = useState("");
  const [avatarBase64, setAvatarBase64] = useState<string | undefined>();
  const [avatarLocal, setAvatarLocal] = useState<string | undefined>();
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const cached = await getCachedAccount();
    setUser(cached);
    const fresh = await refreshAccount().catch(() => null);
    if (fresh) setUser(fresh);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  useEffect(() => {
    if (!user) return;
    setNickname(user.nickname || user.username);
    setAvatarLocal(undefined);
    setAvatarBase64(undefined);
    if (user.avatar) {
      getSiteBase().then((base) => setAvatarUri(base + "/" + user.avatar + "?v=" + Date.now())).catch(() => setAvatarUri(undefined));
    } else {
      setAvatarUri(undefined);
    }
  }, [user]);

  const begin = async (action: (cap?: CaptchaPayload) => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      const info = await fetchSiteInfo().catch(() => null);
      if (info?.captcha?.enabled) {
        setPendingAction(() => action);
        setCaptchaVisible(true);
        setBusy(false);
      } else {
        await action(undefined);
      }
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
      setBusy(false);
    }
  };

  const submitLogin = () =>
    begin(async (cap) => {
      try {
        const u = await loginAccount(username.trim(), password, cap);
        setUser(u);
        setPassword("");
        if (gate) router.replace("/home");
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
      } finally {
        setBusy(false);
      }
    });

  const submitRegister = () => {
    if (!username.trim() || !password) {
      setError("请填写用户名和密码");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    if (!agree) {
      setError("请先阅读并勾选同意相关协议");
      return;
    }
    void begin(async (cap) => {
      try {
        const u = await registerAccount({
          username: username.trim(),
          password,
          qq: qq.trim(),
          wechat: wechat.trim(),
          captcha: cap,
        });
        setUser(u);
        setPassword("");
        setConfirm("");
        if (gate) router.replace("/home");
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e));
      } finally {
        setBusy(false);
      }
    });
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("没有相册权限", "请在系统设置中允许访问照片。");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.45, base64: true });
    if (res.canceled) return;
    const asset = res.assets[0];
    setAvatarLocal(asset.uri);
    if (asset.base64) setAvatarBase64("data:" + (asset.mimeType || "image/jpeg") + ";base64," + asset.base64);
  };

  const saveProfile = async () => {
    if (!nickname.trim()) {
      Alert.alert("昵称不能为空");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({ nickname: nickname.trim(), avatarBase64 });
      setUser(updated);
      setAvatarBase64(undefined);
      Alert.alert("已保存", "资料已更新。");
    } catch (e) {
      Alert.alert("保存失败", String(e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  };

  const syncUp = async () => {
    setSyncing(true);
    try {
      await uploadCloud(tables, activeId);
      Alert.alert("已上传", "课表、备忘录、日程已保存到官网数据库。");
    } catch (e) {
      Alert.alert("上传失败", String(e instanceof Error ? e.message : e));
    } finally {
      setSyncing(false);
    }
  };

  const syncDown = async () => {
    setSyncing(true);
    try {
      const cloud = await downloadCloud();
      if (!cloud.data) {
        Alert.alert("云端暂无数据", "请先在登录状态下点「上传当前数据」。");
        return;
      }
      Alert.alert("从云端恢复", `将用云端数据覆盖本机（${cloud.updatedAt ?? ""}），确定？`, [
        { text: "取消", style: "cancel" },
        { text: "恢复", style: "destructive", onPress: async () => {
            await applyCloudData(cloud.data!);
            if (cloud.data!.tables?.length) restore(cloud.data!.tables, cloud.data!.activeId);
            Alert.alert("已恢复", "课表、备忘录、日程已从云端恢复。");
          } },
      ]);
    } catch (e) {
      Alert.alert("恢复失败", String(e instanceof Error ? e.message : e));
    } finally {
      setSyncing(false);
    }
  };

  const openForgot = async () => {
    const base = await getSiteBase();
    Linking.openURL(base + "/forgot.php").catch(() => Alert.alert("无法打开", base + "/forgot.php"));
  };

  const logout = () => {
    Alert.alert("退出登录", "确定退出当前账号？", [
      { text: "取消", style: "cancel" },
      { text: "退出", style: "destructive", onPress: async () => { await logoutAccount(); setUser(null); } },
    ]);
  };

  if (loading) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}><ActivityIndicator color={colors.brand} /></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      {user ? (
        <>
          <View style={styles.card}>
            <Pressable style={styles.avatarWrap} onPress={pickAvatar}>
              {avatarLocal || avatarUri ? (
                <Image source={{ uri: avatarLocal ?? avatarUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatar}><Text style={styles.avatarText}>{(user.nickname || user.username).slice(0, 1).toUpperCase()}</Text></View>
              )}
              <View style={styles.cameraBadge}><Ionicons name="camera" size={12} color="#FFFFFF" /></View>
            </Pressable>
            <Text style={styles.avatarHint}>点击头像更换</Text>

            <Text style={styles.label}>昵称</Text>
            <TextInput value={nickname} onChangeText={setNickname} placeholder="最多 20 个字" placeholderTextColor={colors.faint} style={styles.input} maxLength={20} />

            <View style={styles.infoList}>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>用户名</Text><Text style={styles.infoValue}>{user.username}（不可修改）</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>QQ</Text><Text style={styles.infoValue}>{user.qq || "—"}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>微信</Text><Text style={styles.infoValue}>{user.wechat || "—"}</Text></View>
            </View>

            <Pressable style={[styles.primary, saving && { opacity: 0.6 }]} onPress={saveProfile} disabled={saving}>
              <Text style={styles.primaryText}>{saving ? "保存中…" : "保存资料"}</Text>
            </Pressable>
            <Pressable style={styles.pwdRow} onPress={openForgot}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.faint} />
              <Text style={styles.pwdText}>修改密码请联系开发者</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.faint} />
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.syncTitle}>云端同步</Text>
            <Text style={styles.syncSub}>课表、备忘录、日程会保存到官网数据库，换设备可恢复。修改课表后约 5 秒自动上传。</Text>
            <Pressable style={[styles.primary, syncing && { opacity: 0.6 }]} onPress={syncUp} disabled={syncing}>
              <Text style={styles.primaryText}>{syncing ? "同步中…" : "上传当前数据"}</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={syncDown} disabled={syncing}>
              <Text style={styles.ghostText}>从云端恢复</Text>
            </Pressable>
          </View>
          <Pressable style={styles.ghostBtn} onPress={logout}><Text style={styles.ghostText}>退出登录</Text></Pressable>
        </>
      ) : (
        <>
          <View style={styles.logoWrap}>
            <Image source={require("../../assets/icon.png")} style={styles.logo} />
          </View>
          <Text style={styles.brandTitle}>知酷课程表</Text>
          <Text style={styles.brandSub}>登录后同步课表与云端数据</Text>

          {gate ? <Text style={styles.gateHint}>登录或注册后即可使用全部功能</Text> : null}

          <View style={styles.tabs}>
            {(["login", "register"] as const).map((m) => (
              <Pressable key={m} onPress={() => { setMode(m); setError(""); }} style={[styles.tab, mode === m && styles.tabActive]}>
                <Text style={[styles.tabText, mode === m && { color: colors.brand, fontWeight: "600" }]}>{m === "login" ? "登录" : "注册"}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>用户名</Text>
            <TextInput value={username} onChangeText={setUsername} placeholder="3-24 位，字母/数字/下划线/中文" placeholderTextColor={colors.faint} style={styles.input} autoCapitalize="none" />

            <Text style={styles.label}>密码</Text>
            <TextInput value={password} onChangeText={setPassword} placeholder="至少 6 位" placeholderTextColor={colors.faint} secureTextEntry style={styles.input} />

            {mode === "register" ? (
              <>
                <Text style={styles.label}>确认密码</Text>
                <TextInput value={confirm} onChangeText={setConfirm} placeholder="再输入一次" placeholderTextColor={colors.faint} secureTextEntry style={styles.input} />

                <Text style={styles.label}>QQ（选填）</Text>
                <TextInput value={qq} onChangeText={setQq} placeholder="方便联系" placeholderTextColor={colors.faint} style={styles.input} keyboardType="number-pad" />
                <Text style={styles.label}>微信（选填）</Text>
                <TextInput value={wechat} onChangeText={setWechat} placeholder="方便联系" placeholderTextColor={colors.faint} style={styles.input} autoCapitalize="none" />
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable style={[styles.primary, busy && { opacity: 0.6 }]} onPress={mode === "login" ? submitLogin : submitRegister} disabled={busy}>
              <Text style={styles.primaryText}>{busy ? "请稍候…" : mode === "login" ? "登录" : "注册并登录"}</Text>
            </Pressable>

            {mode === "register" ? (
              <View style={styles.agreeRow}>
                <Pressable style={[styles.checkbox, agree && { backgroundColor: colors.brand, borderColor: colors.brand }]} onPress={() => setAgree((v) => !v)} hitSlop={6}>
                  {agree ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
                </Pressable>
                <Text style={styles.agreeText}>
                  我已阅读并同意
                  <Text style={styles.link} onPress={() => router.push("/about-you?doc=terms")}>《用户使用协议》</Text>
                  <Text style={styles.link} onPress={() => router.push("/about-you?doc=register")}>《用户注册协议》</Text>
                  <Text style={styles.link} onPress={() => router.push("/about-you?doc=privacy")}>《用户隐私政策》</Text>
                </Text>
              </View>
            ) : null}

            {mode === "login" ? (
              <Pressable onPress={() => router.push("/forgot-password")} style={styles.forgot}>
                <Text style={styles.forgotText}>忘记密码？联系开发者修改</Text>
              </Pressable>
            ) : null}
          </View>
        </>
      )}

      <CaptchaModal
        visible={captchaVisible}
        onClose={() => { setCaptchaVisible(false); setBusy(false); }}
        onSuccess={(data) => {
          setCaptchaVisible(false);
          const action = pendingAction;
          setPendingAction(null);
          if (action) void action(data);
        }}
      />
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    logoWrap: { alignItems: "center", marginTop: 6 },
    logo: { width: 84, height: 84, borderRadius: 22, shadowColor: "#0B1220", shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
    brandTitle: { fontSize: 20, fontWeight: "700", color: colors.ink, textAlign: "center", marginTop: 14 },
    brandSub: { fontSize: 12, color: colors.faint, textAlign: "center", marginTop: 6, marginBottom: 16 },
    gateHint: { fontSize: 12, color: colors.sub, textAlign: "center", marginBottom: 12 },
    card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 20, marginBottom: 12 },
    tabs: { flexDirection: "row", backgroundColor: colors.chipBg, borderRadius: 12, padding: 3, marginBottom: 14 },
    tab: { flex: 1, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 9 },
    tabActive: { backgroundColor: colors.surface },
    tabText: { fontSize: 13.5, color: colors.sub },
    label: { fontSize: 11.5, color: colors.sub, marginTop: 12, marginBottom: 6 },
    input: { height: 46, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: 12, paddingHorizontal: 13, fontSize: 14, color: colors.ink, backgroundColor: colors.fieldBg },
    error: { fontSize: 12, color: colors.danger, marginTop: 12, lineHeight: 18 },
    primary: { marginTop: 18, height: 48, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
    ghostBtn: { marginTop: 12, height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center" },
    ghostText: { fontSize: 14, color: colors.ink },
    agreeRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 16 },
    checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center", marginTop: 1 },
    agreeText: { flex: 1, fontSize: 11.5, color: colors.sub, lineHeight: 19 },
    link: { color: colors.brand },
    forgot: { marginTop: 14, alignItems: "center" },
    forgotText: { fontSize: 12, color: colors.brand },
    footer: { fontSize: 10.5, color: colors.faint, textAlign: "center", marginTop: 16, lineHeight: 17 },
    avatarWrap: { alignSelf: "center", marginTop: 2 },
    avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    avatarImg: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.chipBg },
    avatarText: { fontSize: 22, fontWeight: "700", color: colors.brand },
    cameraBadge: { position: "absolute", right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.surface },
    avatarHint: { fontSize: 10.5, color: colors.faint, textAlign: "center", marginTop: 8 },
    infoList: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.line },
    infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
    infoLabel: { fontSize: 12, color: colors.faint },
    infoValue: { fontSize: 13, color: colors.ink },
    pwdRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 14 },
    pwdText: { fontSize: 11, color: colors.faint },
    syncTitle: { fontSize: 14, fontWeight: "600", color: colors.ink },
    syncSub: { fontSize: 11.5, color: colors.faint, lineHeight: 18, marginTop: 8, marginBottom: 4 },
  });