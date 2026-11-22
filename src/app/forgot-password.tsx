import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useTheme } from "../lib/theme-context";
import { Colors } from "../theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    Alert.alert("已复制", label + "已复制到剪贴板");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.logoWrap}>
        <Image source={require("../../assets/icon.png")} style={styles.logo} />
      </View>
      <Text style={styles.title}>忘记密码</Text>
      <Text style={styles.desc}>密码修改需要联系开发者核实身份后处理，暂不支持自助重置。</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>作者 QQ</Text>
            <Text style={styles.value}>3073323538</Text>
          </View>
          <Pressable onPress={() => copy("QQ", "3073323538")}><Text style={styles.copy}>复制</Text></Pressable>
        </View>
        <View style={[styles.row, styles.divider]}>
          <Ionicons name="logo-wechat" size={18} color="#1AAD19" />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>作者微信</Text>
            <Text style={styles.value}>xbhlkj</Text>
          </View>
          <Pressable onPress={() => copy("微信号", "xbhlkj")}><Text style={styles.copy}>复制</Text></Pressable>
        </View>
        <View style={[styles.row, styles.divider]}>
          <Ionicons name="mail-outline" size={18} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>作者邮箱</Text>
            <Text style={styles.value}>xbhlkj@163.com</Text>
          </View>
          <Pressable onPress={() => copy("邮箱", "xbhlkj@163.com")}><Text style={styles.copy}>复制</Text></Pressable>
        </View>
      </View>

      <Text style={styles.tip}>联系时请提供用户名和注册时间，方便快速核实。</Text>

      <Pressable style={styles.primary} onPress={() => router.push("/contact")}>
        <Ionicons name="mail-open-outline" size={16} color="#FFFFFF" />
        <Text style={styles.primaryText}>打开联系作者页</Text>
      </Pressable>
      <Pressable style={styles.ghost} onPress={() => router.back()}>
        <Text style={styles.ghostText}>返回登录</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    logoWrap: { alignItems: "center", marginTop: 10 },
    logo: { width: 88, height: 88, borderRadius: 24, shadowColor: "#0B1220", shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
    title: { fontSize: 20, fontWeight: "700", color: colors.ink, textAlign: "center", marginTop: 16 },
    desc: { fontSize: 12, color: colors.sub, textAlign: "center", lineHeight: 19, marginTop: 8, marginBottom: 18, paddingHorizontal: 12 },
    card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 18 },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
    divider: { borderTopWidth: 1, borderTopColor: colors.line },
    label: { fontSize: 11, color: colors.faint },
    value: { fontSize: 14, color: colors.ink, marginTop: 3, fontWeight: "500" },
    copy: { fontSize: 12, color: colors.brand },
    tip: { fontSize: 11, color: colors.faint, textAlign: "center", marginTop: 12, lineHeight: 18 },
    primary: { marginTop: 18, height: 48, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
    primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    ghost: { marginTop: 12, height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center" },
    ghostText: { fontSize: 13.5, color: colors.ink },
  });
