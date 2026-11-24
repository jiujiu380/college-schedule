import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useUpdate } from "../lib/update-store";
import { useTheme } from "../lib/theme-context";
import { Colors } from "../theme";

export function UpdatePrompt() {
  const { result } = useUpdate();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const available = result?.status === "available" && result.latest ? result : null;
  const version = available?.latest ?? "";
  const release = available?.release;

  useEffect(() => {
    if (available && dismissed && dismissed !== version) setDismissed(null);
  }, [available, dismissed, version]);

  const open = () => {
    const url = release?.apkUrl || release?.htmlUrl;
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal visible={Boolean(available) && dismissed !== version} transparent animationType="fade" onRequestClose={() => setDismissed(version)}>
      <View style={styles.mask}>
        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name="cloud-download-outline" size={24} color={colors.brand} /></View>
          <Text style={styles.title}>发现新版本 v{version}</Text>
          <Text style={styles.sub}>当前版本 v{result?.current}，建议更新后再使用。</Text>
          {release?.notes ? (
            <ScrollView style={{ maxHeight: 150, marginTop: 12 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.notes}>{release.notes.replace(/<[^>]+>/g, "").trim().slice(0, 500)}</Text>
            </ScrollView>
          ) : null}
          <Pressable style={styles.primary} onPress={open}>
            <Text style={styles.primaryText}>立即更新</Text>
          </Pressable>
          <Pressable style={styles.ghost} onPress={() => setDismissed(version)}>
            <Text style={styles.ghostText}>稍后</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    mask: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 26 },
    card: { width: "100%", maxWidth: 340, backgroundColor: colors.surface, borderRadius: 22, padding: 22 },
    icon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center", alignSelf: "center" },
    title: { fontSize: 18, fontWeight: "700", color: colors.ink, textAlign: "center", marginTop: 14 },
    sub: { fontSize: 12, color: colors.sub, textAlign: "center", marginTop: 6 },
    notes: { fontSize: 11.5, color: colors.sub, lineHeight: 19 },
    primary: { marginTop: 18, height: 46, borderRadius: 12, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", outlineStyle: "none" as any },
    primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    ghost: { marginTop: 10, height: 42, alignItems: "center", justifyContent: "center", outlineStyle: "none" as any },
    ghostText: { fontSize: 12.5, color: colors.faint },
  });