import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../lib/theme-context";

const META: Record<string, { label: string; active: keyof typeof Ionicons.glyphMap; idle: keyof typeof Ionicons.glyphMap }> = {
  home: { label: "主站", active: "home", idle: "home-outline" },
  schedule: { label: "课表", active: "grid", idle: "grid-outline" },
  tools: { label: "工具", active: "apps", idle: "apps-outline" },
  settings: { label: "我的", active: "person", idle: "person-outline" },
};

type TabBarState = { index: number; routes: { key: string; name: string }[] };

export function GlassTabBar({ state, navigation, navigateToTab }: { state: TabBarState; navigation?: any; navigateToTab?: (key: string) => void }) {
  const { colors, scheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dark = scheme === "dark";
  const [width, setWidth] = useState(0);
  const anim = useRef(new Animated.Value(state.index)).current;
  const count = state.routes.length;

  useEffect(() => {
    Animated.spring(anim, { toValue: state.index, useNativeDriver: true, friction: 13, tension: 140 }).start();
  }, [anim, state.index]);

  const itemW = width > 0 ? width / count : 0;
  const pillW = Math.max(0, itemW - 14);
  const translateX = anim.interpolate({
    inputRange: [0, Math.max(1, count - 1)],
    outputRange: [7, 7 + Math.max(0, count - 1) * itemW],
  });

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.bar, dark ? styles.barDark : styles.barLight]}>
        <BlurView
          intensity={Platform.OS === "android" ? 90 : 60}
          tint={dark ? "dark" : "light"}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: dark ? "rgba(18,22,30,0.58)" : "rgba(255,255,255,0.52)" }]} />
        <View style={[StyleSheet.absoluteFill, styles.edge, { borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.72)" }]} />

        <View style={styles.row} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 ? (
            <Animated.View
              style={[
                styles.pill,
                { width: pillW, transform: [{ translateX }] },
                { backgroundColor: dark ? "rgba(91,140,255,0.16)" : "rgba(37,99,235,0.09)" },
              ]}
            />
          ) : null}
          {state.routes.map((route: { key: string; name: string }, i: number) => {
            const meta = META[route.name] ?? META.home;
            const focused = state.index === i;
            const onPress = () => {
              if (focused) return;
              try {
                if (typeof navigateToTab === "function") {
                  navigateToTab(route.key);
                  return;
                }
                if (navigation && typeof navigation.navigate === "function") {
                  navigation.navigate(route.name);
                  return;
                }
                router.navigate("/" + route.name);
              } catch {
                router.navigate("/" + route.name);
              }
            };
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.item} android_ripple={{ color: "transparent" }}>
                <Ionicons name={focused ? meta.active : meta.idle} size={21} color={focused ? colors.brand : colors.sub} />
                <Text style={[styles.label, { color: focused ? colors.brand : colors.sub, fontWeight: focused ? "600" : "500" }]}>{meta.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, zIndex: 50 },
  bar: {
    height: 64,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#0B1220",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 24,
  },
  barLight: { borderColor: "rgba(255,255,255,0.7)" },
  barDark: { borderColor: "rgba(255,255,255,0.10)" },
  edge: { borderRadius: 30, borderWidth: 1 },
  row: { flex: 1, flexDirection: "row", alignItems: "center" },
  pill: { position: "absolute", top: 8, height: 48, borderRadius: 22 },
  item: { flex: 1, height: 64, alignItems: "center", justifyContent: "center", gap: 3 },
  label: { fontSize: 10, letterSpacing: 0.1 },
});