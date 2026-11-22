import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { getSiteBase } from "../lib/site-api";
import { useTheme } from "../lib/theme-context";

export function CaptchaModal({ visible, onClose, onSuccess }: { visible: boolean; onClose: () => void; onSuccess: (data: any) => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!visible) return;
    getSiteBase().then((base) => setUrl(base + "/captcha.php"));
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <View style={[styles.bar, { borderBottomColor: colors.line }]}>
          <Text style={[styles.title, { color: colors.ink }]}>安全验证</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.sub} />
          </Pressable>
        </View>
        {url ? (
          <WebView
            source={{ uri: url }}
            style={{ flex: 1 }}
            onMessage={(e) => {
              try {
                const msg = JSON.parse(e.nativeEvent.data);
                if (msg.type === "captcha") onSuccess(msg.data || {});
              } catch {
                // ignore
              }
            }}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  title: { fontSize: 16, fontWeight: "600" },
});
