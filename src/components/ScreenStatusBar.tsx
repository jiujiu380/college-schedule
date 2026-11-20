import { useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback } from "react";

/** 仅在当前页面聚焦时设置状态栏样式，避免返回后样式残留 */
export function ScreenStatusBar({ style }: { style: "light" | "dark" }) {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style, true);
    }, [style]),
  );
  return null;
}
