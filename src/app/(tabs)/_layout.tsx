import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { GlassTabBar } from "../../components/GlassTabBar";
import { useTheme } from "../../lib/theme-context";

export default function TabLayout() {
  const { colors, glass } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: glass ? "transparent" : colors.bg },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.line,
          backgroundColor: colors.surface,
          height: Platform.OS === "ios" ? 80 : 58,
          paddingTop: 4,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 10.5 },
      }}
      tabBar={(props) => <GlassTabBar {...(props as any)} />}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "主站",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={String(color)} size={21} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "课表",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} color={String(color)} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "工具",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "apps" : "apps-outline"} color={String(color)} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "我的",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} color={String(color)} size={20} />
          ),
        }}
      />
    </Tabs>
  );
}