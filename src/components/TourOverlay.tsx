import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useTheme } from "../lib/theme-context";

const KEY = "college.onboard.v2";

export type TourStep = {
  title: string;
  text: string;
  top: number;
  height: number;
  left?: number;
  width?: number;
};

export const HOME_TOUR: TourStep[] = [
  { title: "今日课程", text: "这里显示今天要上的课和下一节课。点课程卡片可以看教室、教师和周次；上完的课会变淡。", top: 0.29, height: 0.21 },
  { title: "每日一言", text: "每天一句短句，下拉主站或点刷新会换一条。", top: 0.14, height: 0.12 },
  { title: "导入课表", text: "点这里导入课表：可以在网页里登录教务系统识别，也可以粘贴源码、选 Excel / CSV / JSON 文件。导入前还能逐条改课程。", top: 0.51, height: 0.08 },
  { title: "课表标签", text: "底部「课表」看整周。长按空白格加课，长按课程编辑；两门课冲突时会自动并排显示，非本周课程会淡化并标气泡。", top: 0.9, height: 0.09, left: 0.2, width: 0.3 },
  { title: "工具标签", text: "「工具」里有天气、日历、备忘录、每日新闻、公告、工单反馈、备份和更新。", top: 0.9, height: 0.09, left: 0.45, width: 0.3 },
  { title: "我的标签", text: "「我的」管理账号、主题配色、开学时间、节次时间和上课提醒；后台保活也在里面。", top: 0.9, height: 0.09, left: 0.7, width: 0.3 },
];

export async function hasSeenTour(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === "1";
}

export async function markTourSeen(): Promise<void> {
  await AsyncStorage.setItem(KEY, "1");
}

export function TourOverlay({ visible, steps = HOME_TOUR, onDone }: { visible: boolean; steps?: TourStep[]; onDone: () => void }) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (visible) void markTourSeen();
  }, [visible]);
  const step = steps[Math.min(index, steps.length - 1)];
  const rect = useMemo(() => {
    const left = step.left == null ? 16 : step.left * width;
    const w = step.width == null ? width - 32 : step.width * width;
    return { left, top: step.top * height, width: w, height: step.height * height };
  }, [step, width, height]);

  const tooltipTop = rect.top + rect.height + 14 > height - 180 ? Math.max(24, rect.top - 160) : rect.top + rect.height + 14;
  const done = () => { void markTourSeen(); onDone(); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={done}>
      <View style={{ flex: 1 }}>
        <View style={styles.dim} />
        <View style={[styles.hole, { left: rect.left, top: rect.top, width: rect.width, height: rect.height }]} />
        <View style={[styles.tooltip, { top: tooltipTop, backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.ink }]}>{step.title}</Text>
          <Text style={[styles.text, { color: colors.sub }]}>{step.text}</Text>
          <View style={styles.row}>
            <Text style={[styles.progress, { color: colors.faint }]}>{index + 1} / {steps.length}</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={done} hitSlop={8}><Text style={[styles.skip, { color: colors.faint }]}>跳过</Text></Pressable>
            {index > 0 ? (
              <Pressable onPress={() => setIndex((i) => Math.max(0, i - 1))} style={[styles.btn, { borderColor: colors.fieldBorder }]}>
                <Text style={[styles.btnText, { color: colors.ink }]}>上一步</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => (index >= steps.length - 1 ? done() : setIndex((i) => i + 1))}
              style={[styles.btn, { backgroundColor: colors.brand, borderColor: colors.brand }]}
            >
              <Text style={[styles.btnText, { color: "#FFFFFF" }]}>{index >= steps.length - 1 ? "完成" : "下一步"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.62)" },
  hole: { position: "absolute", borderRadius: 14, borderWidth: 2, borderColor: "#FFFFFF", backgroundColor: "transparent" },
  tooltip: { position: "absolute", left: 20, right: 20, borderRadius: 14, padding: 16 },
  title: { fontSize: 15, fontWeight: "700" },
  text: { fontSize: 12.5, lineHeight: 19, marginTop: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  progress: { fontSize: 11 },
  skip: { fontSize: 12, marginRight: 4 },
  btn: { paddingHorizontal: 12, height: 32, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 12.5, fontWeight: "600" },
});