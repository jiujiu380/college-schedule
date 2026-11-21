import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React, { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("无法打开", url);
    }
  };

  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    Alert.alert("已复制", `${label}已复制到剪贴板`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.card}>
        <Text style={styles.title}>联系作者</Text>
        <Text style={styles.desc}>如有问题、建议或合作，可通过以下方式联系。官网会发布最新版本与使用说明。</Text>
      </View>

      <View style={styles.list}>
        <Pressable style={[styles.row, styles.divider]} onPress={() => open("https://class.zcoow.cn")}>
          <Ionicons name="globe-outline" size={18} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>项目官网</Text>
            <Text style={styles.value}>class.zcoow.cn</Text>
          </View>
          <Ionicons name="open-outline" size={15} color={colors.faint} />
        </Pressable>

        <Pressable style={[styles.row, styles.divider]} onPress={() => open("mailto:xbhlkj@163.com")}>
          <Ionicons name="mail-outline" size={18} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>作者邮箱</Text>
            <Text style={styles.value}>xbhlkj@163.com</Text>
          </View>
          <Ionicons name="open-outline" size={15} color={colors.faint} />
        </Pressable>

        <Pressable style={[styles.row, styles.divider]} onPress={() => copy("QQ", "3073323538")}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>作者 QQ</Text>
            <Text style={styles.value}>3073323538</Text>
          </View>
          <Text style={styles.copy}>复制</Text>
        </Pressable>

        <Pressable style={styles.row} onPress={() => copy("微信号", "xbhlkj")}>
          <Ionicons name="logo-wechat" size={18} color="#1AAD19" />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>作者微信</Text>
            <Text style={styles.value}>xbhlkj</Text>
          </View>
          <Text style={styles.copy}>复制</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>知酷课程表 · 完全离线 · 数据只保存在本机</Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    desc: { fontSize: 12, color: colors.sub, lineHeight: 19, marginTop: 8 },
    list: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, marginTop: 12, overflow: "hidden" },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.line },
    label: { fontSize: 11.5, color: colors.faint },
    value: { fontSize: 14, color: colors.ink, marginTop: 3, fontWeight: "500" },
    copy: { fontSize: 12, color: colors.brand },
    footer: { textAlign: "center", fontSize: 11, color: colors.faint, marginTop: 24 },
  });
