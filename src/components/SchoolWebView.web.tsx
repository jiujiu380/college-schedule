import React, { forwardRef, useImperativeHandle } from "react";
import { StyleSheet, Text, View } from "react-native";

export type SchoolWebViewHandle = {
  fetchTimetable: (url: string) => void;
  readHtml: () => void;
};

type Props = {
  uri: string;
  onMessage: (data: any) => void;
  onNav?: (url: string) => void;
  onLoadEnd?: () => void;
};

/** WebView 仅移动端可用，Web 端给出提示 */
export const SchoolWebView = forwardRef<SchoolWebViewHandle, Props>(function SchoolWebView(_props, ref) {
  useImperativeHandle(ref, () => ({ fetchTimetable: () => {}, readHtml: () => {} }));
  return (
    <View style={styles.box}>
      <Text style={styles.title}>网页端无法使用教务登录</Text>
      <Text style={styles.text}>请在手机 APK 中使用：登录教务系统后打开课表页，会自动识别并抓取。</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  title: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 10 },
  text: { fontSize: 12.5, color: "#6B7280", textAlign: "center", lineHeight: 20 },
});
