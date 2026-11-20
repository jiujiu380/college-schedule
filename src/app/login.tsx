import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "../components/Anim";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInDemo, signIn } = useAuth();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [id, setId] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);

  const goDemo = async () => {
    setBusy(true);
    try {
      await signInDemo();
      router.replace("/home");
    } finally {
      setBusy(false);
    }
  };

  const goLogin = async () => {
    if (!id.trim() || !pwd) {
      Alert.alert("提示", "请输入学号和密码");
      return;
    }
    setBusy(true);
    try {
      await signIn(id.trim(), "local");
      router.replace("/home");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 64, paddingHorizontal: 28, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logo}>
            <Ionicons name="grid" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>课表系统</Text>
          <Text style={styles.subtitle}>登录教务账号，同步本学期课程</Text>

          <Text style={styles.label}>学号</Text>
          <TextInput
            value={id}
            onChangeText={setId}
            placeholder="请输入学号"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.label}>密码</Text>
          <TextInput
            value={pwd}
            onChangeText={setPwd}
            placeholder="请输入密码"
            placeholderTextColor={colors.faint}
            secureTextEntry
            style={styles.input}
          />

          <PressableScale onPress={goLogin} disabled={busy} style={[styles.primaryBtn, busy && { opacity: 0.85 }]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>登 录</Text>}
          </PressableScale>

          <Pressable style={styles.demoBtn} onPress={goDemo} disabled={busy}>
            <Text style={styles.demoText}>使用演示数据查看课表</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.sub} />
          </Pressable>

          <View style={{ flex: 1 }} />
          <Text style={styles.note}>账号信息仅保存在本机，不对外上传</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    logo: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 26, fontWeight: "700", color: colors.ink, marginTop: 22, letterSpacing: -0.3 },
    subtitle: { fontSize: 13, color: colors.sub, marginTop: 8 },
    label: { fontSize: 12.5, color: colors.sub, marginTop: 26, marginBottom: 8 },
    input: {
      height: 46,
      borderWidth: 1,
      borderColor: colors.fieldBorder,
      borderRadius: radius.sm,
      paddingHorizontal: 12,
      fontSize: 15,
      color: colors.ink,
      backgroundColor: colors.fieldBg,
    },
    primaryBtn: {
      marginTop: 28,
      height: 46,
      borderRadius: radius.sm,
      backgroundColor: colors.brand,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600", letterSpacing: 2 },
    demoBtn: { marginTop: 18, height: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2 },
    demoText: { fontSize: 13, color: colors.sub },
    note: { textAlign: "center", fontSize: 11.5, color: colors.faint },
  });
