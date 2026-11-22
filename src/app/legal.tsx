import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../lib/theme-context";
import { Colors } from "../theme";

type Doc = { title: string; updated: string; sections: { h: string; p: string }[] };

const DOCS: Record<string, Doc> = {
  terms: {
    title: "用户使用协议",
    updated: "2026-11-22",
    sections: [
      { h: "一、服务说明", p: "知酷课程表为你提供课表管理、上课提醒、天气、日历、备忘录等功能。应用大部分功能在本地离线运行，登录相关功能依赖官网服务。" },
      { h: "二、账号", p: "使用云端同步、工单等功能需要注册账号。请使用真实、合法的用户名与联系方式，并对账号下的行为负责。" },
      { h: "三、使用规范", p: "不得利用本应用从事违法活动、攻击服务器、批量注册或干扰他人正常使用。课表数据来自你自行导入或学校公开页面，请遵守学校相关规定。" },
      { h: "四、内容与数据", p: "课表、备忘录等数据默认保存在本机；开启云同步后会加密传输并保存在官网数据库。你有责任自行备份重要数据。" },
      { h: "五、免责", p: "本应用按“现状”提供。因设备故障、网络问题、教务系统维护等造成的损失，开发者不承担赔偿责任。" },
      { h: "六、协议变更", p: "协议可能随功能调整更新，更新后会在应用内提示。继续使用即视为接受新协议。" },
      { h: "七、联系我们", p: "如有疑问，请通过「工具 → 联系作者」或官网 class.zcoow.cn 与我们联系。" },
    ],
  },
  register: {
    title: "用户注册协议",
    updated: "2026-11-22",
    sections: [
      { h: "一、注册条件", p: "注册需提供用户名、密码及至少一种联系方式（邮箱 / QQ / 微信），并完成极验人机验证。" },
      { h: "二、用户名规则", p: "用户名为 3-24 位，仅限字母、数字、下划线或中文；不得冒充他人、使用违法或侵权名称。" },
      { h: "三、密码安全", p: "密码至少 6 位，请勿与其他网站共用。因个人保管不善导致的账号损失由用户自行承担。" },
      { h: "四、资料真实性", p: "请填写可用的联系方式，以便找回密码或处理工单；填写虚假信息可能导致无法找回账号。" },
      { h: "五、账号注销", p: "如需注销账号，可通过客服提交申请，核实后删除账号及云端数据。" },
      { h: "六、违规处理", p: "对批量注册、恶意请求、发布违法信息等行为，管理员有权停用账号并清理数据。" },
    ],
  },
  privacy: {
    title: "用户隐私政策",
    updated: "2026-11-22",
    sections: [
      { h: "一、我们收集什么", p: "注册时收集用户名、密码哈希、邮箱 / QQ / 微信；云同步时收集你上传的课表、备忘录、日程数据。" },
      { h: "二、本地数据", p: "未登录或未开启云同步时，课表等数据只保存在设备本地，不会上传。" },
      { h: "三、信息用途", p: "账号信息用于登录、找回密码、工单联系；云端数据用于换设备恢复。我们不会出售你的信息。" },
      { h: "四、权限说明", p: "定位权限仅用于获取本地天气；通知权限用于上课、天气、日程提醒；均可随时在系统设置中关闭。" },
      { h: "五、数据存储与安全", p: "密码使用 bcrypt 哈希存储，传输通过 HTTPS。云端数据仅账号本人和管理员可访问。" },
      { h: "六、你的权利", p: "你可以随时导出本机数据、退出登录，或联系客服删除云端数据与账号。" },
      { h: "七、联系我们", p: "隐私相关问题请联系 xbhlkj@163.com 或通过官网 class.zcoow.cn 反馈。" },
    ],
  },
};

export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const data = DOCS[String(doc ?? "terms")] ?? DOCS.terms;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.ink }]}>{data.title}</Text>
      <Text style={[styles.updated, { color: colors.faint }]}>更新日期：{data.updated}</Text>
      {data.sections.map((s) => (
        <React.Fragment key={s.h}>
          <Text style={[styles.h, { color: colors.ink }]}>{s.h}</Text>
          <Text style={[styles.p, { color: colors.sub }]}>{s.p}</Text>
        </React.Fragment>
      ))}
      <Text style={[styles.footer, { color: colors.faint }]}>知酷课程表 · class.zcoow.cn</Text>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
    updated: { fontSize: 11, marginTop: 6, marginBottom: 18 },
    h: { fontSize: 14, fontWeight: "700", marginTop: 16 },
    p: { fontSize: 12.5, lineHeight: 21, marginTop: 6 },
    footer: { fontSize: 10.5, textAlign: "center", marginTop: 28 },
  });
