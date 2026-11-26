import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Alert, AppState, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "./theme-context";
import { Colors } from "../theme";

const KEY = "college.applock.v1";

type LockValue = {
  enabled: boolean;
  setEnabled: (on: boolean) => Promise<void>;
  locked: boolean;
  unlock: () => Promise<void>;
};

const Ctx = createContext<LockValue | null>(null);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const backgroundAt = useRef(0);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        const on = v === "1";
        setEnabledState(on);
        setLocked(on);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        backgroundAt.current = Date.now();
      } else if (state === "active" && backgroundAt.current) {
        if (Date.now() - backgroundAt.current > 15000 && enabled) setLocked(true);
        backgroundAt.current = 0;
      }
    });
    return () => sub.remove();
  }, [enabled]);

  const unlock = useCallback(async () => {
    if (busy) return;
    if (Platform.OS === "web") {
      setLocked(false);
      return;
    }
    setBusy(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        Alert.alert("无法解锁", "设备没有设置指纹或面容，请先在系统设置中录入生物识别，或关闭应用锁。");
        return;
      }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "解锁知酷课程表",
        cancelLabel: "取消",
        disableDeviceFallback: false,
      });
      if (res.success) setLocked(false);
    } catch (e) {
      Alert.alert("解锁失败", String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }, [busy]);

  useEffect(() => {
    if (!ready || !enabled || !locked) return;
    const timer = setTimeout(() => { void unlock(); }, 350);
    return () => clearTimeout(timer);
    // 只在锁定时自动拉起一次，失败后由按钮重试
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, enabled, locked]);

  const setEnabled = useCallback(async (on: boolean) => {
    if (Platform.OS === "web") {
      Alert.alert("手机功能", "应用锁仅支持 Android / iOS。");
      return;
    }
    if (on) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        Alert.alert("无法开启", "请先在系统设置中录入指纹或面容，再开启应用锁。");
        return;
      }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "验证身份以开启应用锁",
        cancelLabel: "取消",
        disableDeviceFallback: false,
      });
      if (!res.success) return;
    }
    setEnabledState(on);
    setLocked(false);
    await AsyncStorage.setItem(KEY, on ? "1" : "0");
  }, []);

  const value = React.useMemo<LockValue>(() => ({ enabled, setEnabled, locked, unlock }), [enabled, setEnabled, locked, unlock]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <Modal visible={ready && enabled && locked} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.mask}>
          <View style={styles.card}>
            <View style={styles.icon}><Ionicons name="lock-closed" size={28} color="#FFFFFF" /></View>
            <Text style={styles.title}>应用已锁定</Text>
            <Text style={styles.sub}>验证指纹 / 面容或设备密码后继续</Text>
            <Pressable style={[styles.button, busy && { opacity: 0.6 }]} onPress={unlock} disabled={busy}>
              <Text style={styles.buttonText}>{busy ? "验证中…" : "解锁"}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Ctx.Provider>
  );
}

export function useAppLock(): LockValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppLock must be used inside AppLockProvider");
  return v;
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    mask: { flex: 1, backgroundColor: "rgba(4,8,18,0.94)", alignItems: "center", justifyContent: "center", padding: 30 },
    card: { width: "100%", maxWidth: 320, alignItems: "center" },
    icon: { width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
    title: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", marginTop: 18 },
    sub: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 8, textAlign: "center" },
    button: { marginTop: 24, height: 46, width: "100%", borderRadius: 12, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  });