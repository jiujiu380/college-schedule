import * as Notifications from "expo-notifications";
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider, Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef } from "react";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { loadAgreed } from "../lib/agreement";
import { getAccountToken } from "../lib/account";
import { AuthProvider } from "../lib/auth";
import { ensureChannel } from "../lib/notifications";
import { AppRefreshProvider } from "../lib/app-refresh";
import { TourProvider } from "../lib/tour";
import { ScheduleProvider } from "../lib/schedule-store";
import { ThemeProvider, useTheme } from "../lib/theme-context";
import { UpdateProvider } from "../lib/update-store";
import { UpdatePrompt } from "../components/UpdatePrompt";
import { BackupBootstrap } from "../components/BackupBootstrap";
import { GlassBackdrop } from "../components/GlassBackdrop";
import { AppLockProvider } from "../lib/app-lock";

function AgreementGuard() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    let alive = true;
    const isLegal = pathname.startsWith("/legal") || pathname.startsWith("/about-you");
    loadAgreed().then(async (ok) => {
      if (!alive) return;
      if (!ok) {
        if (pathname !== "/agreement" && pathname !== "/intro" && !isLegal) router.replace("/agreement");
        return;
      }
      const token = await getAccountToken();
      if (!alive) return;
      const publicPath = pathname === "/intro" || pathname === "/agreement" || pathname === "/account" || pathname === "/forgot-password" || isLegal;
      if (!token && !publicPath) router.replace("/account?gate=1");
    });
    return () => {
      alive = false;
    };
  }, [pathname, router]);
  return null;
}

/** 桌面端 Ctrl/Cmd+K 打开全局搜索 */
function GlobalSearchShortcut() {
  const router = useRouter();
  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (event: any) => {
      if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === "k") {
        event.preventDefault();
        router.push("/search");
      }
    };
    const target = globalThis as any;
    target.addEventListener("keydown", handler);
    return () => target.removeEventListener("keydown", handler);
  }, [router]);
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
      const data = response?.notification.request.content.data as any;
      if (!data) return;
      if (id && handled.current.has(id)) return;
      if (id) handled.current.add(id);
      if (data.kind === "update") {
        setTimeout(() => router.push("/update"), 300);
        return;
      }
      if (data.courseId) setTimeout(() => router.push(`/course/${data.courseId}`), 300);
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
  const { colors, scheme, glass, glassBase } = useTheme();
  const navTheme = useMemo(() => {
    const base = scheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.brand,
        background: glass ? "transparent" : colors.bg,
        card: glass ? "transparent" : colors.surface,
        text: colors.ink,
        border: colors.line,
        notification: colors.brand,
      },
    };
  }, [scheme, glass, colors]);
  const headerOptions = {
    headerShown: true,
    headerShadowVisible: true,
    headerStyle: { backgroundColor: glass ? (scheme === "dark" ? "rgba(10,14,24,0.92)" : "rgba(247,250,255,0.92)") : colors.surface },
    headerTintColor: colors.ink,
    headerTitleStyle: { fontSize: 15, fontWeight: "600" as const },
  };

  return (
    <AuthProvider>
      <AppRefreshProvider><TourProvider><ScheduleProvider>
        <UpdateProvider>
          <AppLockProvider>
          <NavigationThemeProvider value={navTheme}>
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <View style={{ flex: 1, backgroundColor: glass ? glassBase : (scheme === "dark" ? "#000000" : "#E4E6EA"), alignItems: "center" }}>
            <View
              style={{
                flex: 1,
                width: "100%",
                maxWidth: Platform.OS === "web" ? 1100 : undefined,
                backgroundColor: glass ? "transparent" : colors.surface,
                overflow: "hidden",
              }}
            >
              {glass ? <GlassBackdrop scheme={scheme} /> : null}
              <GlobalSearchShortcut />
              <AgreementGuard />
              <BackupBootstrap />
              <NotificationBridge />
              <UpdatePrompt />
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
                <Stack.Screen name="intro" options={{ headerShown: false }} />
                <Stack.Screen name="legal" options={{ ...headerOptions, title: "协议" }} />
                <Stack.Screen name="about-you" options={{ ...headerOptions, title: "关于你" }} />
                <Stack.Screen name="search" options={{ ...headerOptions, title: "搜索" }} />
                <Stack.Screen name="materials" options={{ ...headerOptions, title: "课程资料柜" }} />
                <Stack.Screen name="stats" options={{ ...headerOptions, title: "学习统计" }} />
                <Stack.Screen name="developer" options={{ ...headerOptions, title: "开发者选项" }} />
                <Stack.Screen name="background" options={{ ...headerOptions, title: "后台保活" }} />
                <Stack.Screen name="account" options={{ ...headerOptions, title: "账号" }} />
                <Stack.Screen name="forgot-password" options={{ ...headerOptions, title: "忘记密码" }} />
                <Stack.Screen name="news" options={{ ...headerOptions, title: "每日新闻" }} />
                <Stack.Screen name="news/[id]" options={{ ...headerOptions, title: "新闻详情" }} />
                <Stack.Screen name="charity" options={{ ...headerOptions, title: "公益专栏" }} />
                <Stack.Screen name="homework" options={{ ...headerOptions, title: "作业 DDL" }} />
                <Stack.Screen name="exams" options={{ ...headerOptions, title: "考试倒计时" }} />
                <Stack.Screen name="share" options={{ ...headerOptions, title: "课表分享" }} />
                <Stack.Screen name="export" options={{ ...headerOptions, title: "导出与日历" }} />
                <Stack.Screen name="contact" options={{ ...headerOptions, title: "联系作者" }} />
                <Stack.Screen name="announcements" options={{ ...headerOptions, title: "公告" }} />
                <Stack.Screen name="tickets" options={{ ...headerOptions, title: "工单反馈" }} />
                <Stack.Screen name="memo/index" options={{ ...headerOptions, title: "备忘录" }} />
                <Stack.Screen name="memo/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="weather" options={{ ...headerOptions, title: "天气提醒" }} />
                <Stack.Screen name="calendar" options={{ ...headerOptions, title: "日历" }} />
                <Stack.Screen name="update" options={{ ...headerOptions, title: "检查更新" }} />
                <Stack.Screen name="sponsor" options={{ ...headerOptions, title: "赞助支持" }} />
                <Stack.Screen name="login" options={{ animation: "none" }} />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="course/[id]" options={{ ...headerOptions, title: "课程详情" }} />
              </Stack>
            </View>
          </View>
          </NavigationThemeProvider>
          </AppLockProvider>
        </UpdateProvider>
      </ScheduleProvider></TourProvider></AppRefreshProvider>
    </AuthProvider>
  );
}