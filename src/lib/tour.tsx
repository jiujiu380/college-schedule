import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useTheme } from "./theme-context";

const KEY = "college.guide.v1";

type Step = {
  route: string;
  title: string;
  text: string;
  top: number;
  height: number;
  left?: number;
  width?: number;
};

const STEPS: Step[] = [
  { route: "/home", title: "今日课程", text: "这里显示今天要上的课和下一节课。点课程卡片可以看教室、教师和周次；已经上完的课会变淡。", top: 0.29, height: 0.21 },
  { route: "/home", title: "每日一言", text: "主站顶部每天一句短句，下拉刷新会换一条。", top: 0.14, height: 0.12 },
  { route: "/import", title: "导入课表", text: "导入支持四种方式：网页里登录教务系统识别、粘贴源码、Excel/CSV/JSON 文件、以及手动新建。识别后先进入预览，可以逐条改课程和课表名，再点导入。", top: 0.08, height: 0.3 },
  { route: "/schedule", title: "周课表", text: "这里看整周课表，左右切换周次。长按空白格加课，长按课程编辑或删除；两门课时间冲突会自动左右并排，非本周课程淡化并在右上角用气泡提示。", top: 0.12, height: 0.55 },
  { route: "/tools", title: "工具", text: "工具页集中了天气、日历、备忘录、每日新闻、公告、工单反馈、备份恢复、检查更新和开发者选项。", top: 0.18, height: 0.55 },
  { route: "/settings", title: "我的", text: "「我的」里可以改账号头像昵称、课表名称与开学时间、节次时间、8 套配色、上课提醒和后台保活。", top: 0.1, height: 0.6 },
];

type TourValue = { visible: boolean; start: () => void; stop: () => void };
const Ctx = createContext<TourValue | null>(null);

export async function hasSeenGuide(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === "1";
}

export async function resetGuide(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const step = STEPS[Math.min(index, STEPS.length - 1)];

  const start = useCallback(() => {
    setIndex(0);
    setVisible(true);
  }, []);

  const stop = useCallback(() => {
    setVisible(false);
    AsyncStorage.setItem(KEY, "1").catch(() => {});
    if (pathname !== "/home") router.replace("/home");
  }, [pathname, router]);

  useEffect(() => {
    if (!visible) return;
    if (pathname !== step.route) router.replace(step.route as any);
  }, [visible, step, pathname, router]);

  const rect = useMemo(() => {
    const left = step.left == null ? 16 : step.left * width;
    const w = step.width == null ? width - 32 : step.width * width;
    return { left, top: step.top * height, width: w, height: step.height * height };
  }, [step, width, height]);

  const tooltipTop = rect.top + rect.height + 14 > height - 200 ? Math.max(24, rect.top - 178) : rect.top + rect.height + 14;

  const value = useMemo(() => ({ visible, start, stop }), [visible, start, stop]);
  const done = () => stop();

  return (
    <Ctx.Provider value={value}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={done}>
        <View style={{ flex: 1 }}>
          <View style={[styles.dim, { backgroundColor: "rgba(0,0,0,0.6)" }]} />
          <View style={[styles.hole, { left: rect.left, top: rect.top, width: rect.width, height: rect.height }]} />
          <View style={[styles.card, { top: tooltipTop, backgroundColor: colors.surface }]}>
            <Text style={[styles.step, { color: colors.faint }]}>新手引导 {index + 1} / {STEPS.length} · {step.title}</Text>
            <Text style={[styles.title, { color: colors.ink }]}>{step.title}</Text>
            <Text style={[styles.text, { color: colors.sub }]}>{step.text}</Text>
            <View style={styles.row}>
              <Pressable onPress={done} hitSlop={8}><Text style={[styles.skip, { color: colors.faint }]}>跳过</Text></Pressable>
              <View style={{ flex: 1 }} />
              {index > 0 ? (
                <Pressable onPress={() => setIndex((i) => Math.max(0, i - 1))} style={[styles.btn, { borderColor: colors.fieldBorder }]}>
                  <Text style={[styles.btnText, { color: colors.ink }]}>上一步</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => (index >= STEPS.length - 1 ? done() : setIndex((i) => i + 1))}
                style={[styles.btn, { backgroundColor: colors.brand, borderColor: colors.brand }]}
              >
                <Text style={[styles.btnText, { color: "#FFFFFF" }]}>{index >= STEPS.length - 1 ? "完成" : "下一步"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Ctx.Provider>
  );
}

export function useTour(): TourValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTour must be used inside TourProvider");
  return v;
}

const styles = StyleSheet.create({
  dim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  hole: { position: "absolute", borderRadius: 16, borderWidth: 2, borderColor: "#FFFFFF", backgroundColor: "transparent" },
  card: { position: "absolute", left: 18, right: 18, borderRadius: 16, padding: 18, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  step: { fontSize: 10.5, marginBottom: 6 },
  title: { fontSize: 16, fontWeight: "700" },
  text: { fontSize: 12.5, lineHeight: 20, marginTop: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 },
  skip: { fontSize: 12 },
  btn: { height: 34, paddingHorizontal: 14, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 12.5, fontWeight: "600" },
});
