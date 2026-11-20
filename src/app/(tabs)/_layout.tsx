import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useAuth } from "../../lib/auth";
import { useTheme } from "../../lib/theme-context";

export default function TabLayout() {
  const { status } = useAuth();
  const { colors } = useTheme();
  if (status === "loading") return null;
  if (status === "guest") return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
