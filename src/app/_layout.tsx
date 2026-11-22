import * as Notifications from "expo-notifications";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { loadAgreed } from "../lib/agreement";
import { AuthProvider } from "../lib/auth";
import { ensureChannel } from "../lib/notifications";
import { ScheduleProvider } from "../lib/schedule-store";
import { ThemeProvider, useTheme } from "../lib/theme-context";
import { UpdateProvider } from "../lib/update-store";

function AgreementGuard() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    let alive = true;
    loadAgreed().then((ok) => {
      if (alive && !ok && pathname !== "/agreement") router.replace("/agreement");
    });
    return () => {
      alive = false;
    };
  }, [pathname, router]);
  return null;
}

/** 点击上课提醒 → 跳转到对应课程详情 */
function NotificationBridge() {
  const router = useRouter();
  const handled = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (Platform.OS === "android") {
      void ensureChannel();
    }

    const open = (response: Notifications.NotificationResponse | null) => {
      const id = response?.notification.request.identifier;
      const courseId = (response?.notification.request.content.data as any)?.courseId;
      if (!courseId) return;
      if (id && handled.current.has(id)) return;
      if (id) handled.current.add(id);
      setTimeout(() => router.push(`/course/${courseId}`), 300);
    };

    const sub = Notifications.addNotificationResponseReceivedListener(open);
    Notifications.getLastNotificationResponseAsync()
      .then((r) => open(r ?? null))
      .catch(() => {});

    return () => sub.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedRoot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedRoot() {
  const { colors, scheme } = useTheme();
  const headerOptions = {
    headerShown: true,
    headerShadowVisible: true,
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.ink,
    headerTitleStyle: { fontSize: 15, fontWeight: "600" as const },
  };

  return (
    <AuthProvider>
      <ScheduleProvider>
        <UpdateProvider>
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <View style={{ flex: 1, backgroundColor: scheme === "dark" ? "#000000" : "#E4E6EA", alignItems: "center" }}>
            <View
              style={{
                flex: 1,
                width: "100%",
                maxWidth: Platform.OS === "web" ? 440 : undefined,
                backgroundColor: colors.surface,
                overflow: "hidden",
              }}
            >
              <AgreementGuard />
              <NotificationBridge />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.bg },
                  animation: "slide_from_right",
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="agreement" options={{ animation: "none" }} />
                <Stack.Screen name="semester" options={{ ...headerOptions, title: "学期设置" }} />
                <Stack.Screen name="periods" options={{ ...headerOptions, title: "节次时间" }} />
                <Stack.Screen name="setup" options={{ ...headerOptions, title: "初始化设置" }} />
                <Stack.Screen name="school-login" options={{ ...headerOptions, title: "登录教务系统" }} />
                <Stack.Screen name="import" options={{ ...headerOptions, title: "导入课表" }} />
                <Stack.Screen name="backup" options={{ ...headerOptions, title: "备份与恢复" }} />
                <Stack.Screen name="contact" options={{ ...headerOptions, title: "联系作者" }} />
                <Stack.Screen name="announcements" options={{ ...headerOptions, title: "公告" }} />
                <Stack.Screen name="tickets" options={{ ...headerOptions, title: "工单反馈" }} />
                <Stack.Screen name="update" options={{ ...headerOptions, title: "检查更新" }} />
                <Stack.Screen name="sponsor" options={{ ...headerOptions, title: "赞助支持" }} />
                <Stack.Screen name="login" options={{ animation: "none" }} />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="course/[id]" options={{ ...headerOptions, title: "课程详情" }} />
              </Stack>
            </View>
          </View>
        </UpdateProvider>
      </ScheduleProvider>
    </AuthProvider>
  );
}
