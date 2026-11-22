import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { resetPassword, sendSmsCode } from "../lib/account";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("请输入正确的手机号");
      return;
    }
    setSending(true);
    setError("");
    try {
      await sendSmsCode(phone, "reset");
      setCountdown(60);
      Alert.alert("验证码已发送", "请查看短信，5 分钟内有效。");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setSending(false);
    }
  };

  const submit = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) return setError("请输入正确的手机号");
    if (!code.trim()) return setError("请填写短信验证码");
    if (password.length < 6) return setError("新密码至少 6 位");
    if (password !== confirm) return setError("两次输入的密码不一致");
    setBusy(true);
    setError("");
    try {
      await resetPassword(phone, code.trim(), password);
      Alert.alert("密码已重置", "请使用新密码登录。", [{ text: "去登录", onPress: () => router.replace("/account") }]);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.card}>
        <Text style={styles.title}>重置密码</Text>
        <Text style={styles.desc}>用注册时的手机号接收验证码，验证通过后直接设置新密码。</Text>

        <Text style={styles.label}>手机号</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="11 位手机号" placeholderTextColor={colors.faint} style={styles.input} keyboardType="phone-pad" maxLength={11} />

        <Text style={styles.label}>短信验证码</Text>
        <View style={styles.row}>
          <TextInput value={code} onChangeText={setCode} placeholder="6 位验证码" placeholderTextColor={colors.faint} style={[styles.input, { flex: 1 }]} keyboardType="number-pad" maxLength={6} />
          <Pressable style={[styles.codeBtn, (countdown > 0 || sending) && { opacity: 0.5 }]} onPress={sendCode} disabled={countdown > 0 || sending}>
            <Text style={styles.codeText}>{countdown > 0 ? countdown + "s" : sending ? "发送中" : "获取验证码"}</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>新密码</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="至少 6 位" placeholderTextColor={colors.faint} secureTextEntry style={styles.input} />

        <Text style={styles.label}>确认新密码</Text>
        <TextInput value={confirm} onChangeText={setConfirm} placeholder="再输入一次" placeholderTextColor={colors.faint} secureTextEntry style={styles.input} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.primary, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          <Text style={styles.primaryText}>{busy ? "提交中…" : "重置密码"}</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/contact")} style={styles.contact}>
          <Ionicons name="chatbubble-outline" size={13} color={colors.faint} />
          <Text style={styles.contactText}>手机号已停用？联系开发者追回密码</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 18 },
    title: { fontSize: 18, fontWeight: "700", color: colors.ink },
    desc: { fontSize: 12, color: colors.sub, lineHeight: 19, marginTop: 8, marginBottom: 6 },
    label: { fontSize: 11.5, color: colors.sub, marginTop: 14, marginBottom: 6 },
    input: { height: 44, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 14, color: colors.ink, backgroundColor: colors.fieldBg },
    row: { flexDirection: "row", gap: 8, alignItems: "center" },
    codeBtn: { height: 44, paddingHorizontal: 12, borderRadius: radius.sm, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    codeText: { fontSize: 12, color: colors.brand, fontWeight: "600" },
    error: { fontSize: 12, color: colors.danger, marginTop: 12, lineHeight: 18 },
    primary: { marginTop: 18, height: 46, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
    contact: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 16 },
    contactText: { fontSize: 11, color: colors.faint },
  });
