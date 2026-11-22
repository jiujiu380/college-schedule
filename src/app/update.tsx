import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "../components/Anim";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { useTheme } from "../lib/theme-context";
import { useUpdate } from "../lib/update-store";
import { MIRROR_PRESETS, UpdateConfig, appVersion, formatSize, probeSources, testPresets } from "../lib/updates";
import { Colors, radius } from "../theme";

export default function UpdateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cfg, result, checking, check, updateConfig } = useUpdate();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [draft, setDraft] = useState<UpdateConfig>(cfg);
  const [probe, setProbe] = useState<{ github: number | null; mirror: number | null } | null>(null);
  const [probing, setProbing] = useState(false);
  const [presetResult, setPresetResult] = useState<{ id: string; name: string; ms: number | null }[] | null>(null);
  const [presetTesting, setPresetTesting] = useState(false);

  useEffect(() => setDraft(cfg), [cfg]);

  const onCheck = async () => {
    const r = await check();
    if (r.status === "error" && !r.notFound) {
      Alert.alert("检查失败", `${r.error ?? "网络异常"}

可在下方填写镜像地址后重试。`);
    }
  };

  const onProbe = async () => {
    setProbing(true);
    try {
      setProbe(await probeSources({ ...draft, autoProbe: true }));
    } finally {
      setProbing(false);
    }
  };

  const onSave = async () => {
    await updateConfig({ ...draft, apiBase: draft.apiBase.trim(), downloadBase: draft.downloadBase.trim(), probeThresholdMs: Math.max(300, Number(draft.probeThresholdMs) || 1500) });
    Alert.alert("已保存", "更新源配置已保存，下次检查更新时生效。");
  };

  const onDownload = async () => {
    const url = result?.release?.apkUrl;
    if (!url) {
      Alert.alert("暂无下载地址", "请先检查更新，或到 GitHub Releases 页面手动下载。");
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("无法打开下载链接", url);
    }
  };

  const latest = result?.latest ?? "—";
  const statusText = result?.notFound ? "暂无发布版本" : result?.status === "available" ? `发现新版本 v${latest}` : result?.status === "latest" ? "已是最新版本" : result?.status === "error" ? "检查失败" : checking ? "检查中…" : "尚未检查";
  const toneColor = result?.status === "available" ? colors.brand : result?.notFound ? colors.sub : result?.status === "error" ? colors.danger : colors.success;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.label}>当前版本</Text>
            <Text style={styles.version}>v{appVersion()}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>最新版本</Text>
            <Text style={[styles.version, { color: result?.status === "available" ? colors.brand : colors.ink }]}>{latest === "—" ? "—" : `v${latest}`}</Text>
          </View>
        </View>

        <View style={styles.statusLine}>
          <Ionicons name={result?.status === "available" ? "cloud-download-outline" : result?.notFound ? "information-circle-outline" : result?.status === "error" ? "alert-circle-outline" : "checkmark-circle-outline"} size={15} color={toneColor} />
          <Text style={styles.statusText}>{statusText}</Text>
          {result ? <Text style={styles.metaText}>{result.source === "site" ? "官网" : result.source === "mirror" ? "镜像" : "GitHub"}{result.latencyMs ? ` · ${result.latencyMs}ms` : ""}</Text> : null}
        </View>

        {result?.error ? <Text style={[styles.errorText, result.notFound && { color: colors.sub }]}>{result.error}</Text> : null}

        <View style={styles.btnRow}>
          <Pressable style={[styles.primaryBtn, checking && { opacity: 0.7 }]} onPress={onCheck} disabled={checking}>
            <Text style={styles.primaryText}>{checking ? "检查中…" : "检查更新"}</Text>
          </Pressable>
          <PressableScale style={[styles.ghostBtn, result?.status !== "available" && { opacity: 0.5 }]} onPress={onDownload} disabled={result?.status !== "available"}>
            <Text style={styles.ghostText}>前往下载</Text>
          </PressableScale>
        </View>
        {result?.release?.apkSize ? <Text style={styles.hint}>安装包约 {formatSize(result.release.apkSize)}，下载后点击安装即可覆盖升级。</Text> : null}
      </View>

      {result?.release?.notes ? (
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardTitle}>更新说明</Text>
          <Text style={styles.notes}>{result.release.notes}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>更新源（镜像）</Text>
      <View style={styles.card}>
        <View style={styles.presetHead}>
          <Text style={styles.fieldLabel}>常用镜像（点击填入）</Text>
          <Pressable
            onPress={async () => {
              setPresetTesting(true);
              try {
                setPresetResult(await testPresets());
              } finally {
                setPresetTesting(false);
              }
            }}
            disabled={presetTesting}
          >
            <Text style={styles.presetTest}>{presetTesting ? "测速中…" : "一键测速"}</Text>
          </Pressable>
        </View>
        <View style={styles.presetRow}>
          {MIRROR_PRESETS.map((p) => {
            const active = (draft.apiBase || "") === p.apiBase && (draft.downloadBase || "") === p.downloadBase;
            const r = presetResult?.find((x) => x.id === p.id);
            return (
              <Pressable key={p.id} onPress={() => setDraft({ ...draft, apiBase: p.apiBase, downloadBase: p.downloadBase })} style={[styles.presetChip, active && styles.presetChipActive]}>
                <Text style={[styles.presetText, active && { color: colors.brand, fontWeight: "600" }]}>{p.name}</Text>
                {r ? <Text style={[styles.presetMs, r.ms === null && { color: colors.danger }]}>{r.ms === null ? "不可达" : `${r.ms}ms`}</Text> : null}
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.mirrorNote}>公共镜像只能代理公开仓库的 Release；私有仓库无法通过公共镜像下载。清华 TUNA 的 github-release 仅镜像白名单仓库，不能作为通用 API 反代。</Text>

        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>更新来源</Text>
        <View style={styles.segment}>
          {([{ k: "site", l: "官网（默认）" }, { k: "github", l: "GitHub" }] as { k: "site" | "github"; l: string }[]).map((m) => (
            <Pressable key={m.k} onPress={() => setDraft({ ...draft, source: m.k })} style={[styles.segmentItem, (draft.source ?? "site") === m.k && styles.segmentActive]}>
              <Text style={[styles.segmentText, (draft.source ?? "site") === m.k && { color: colors.brand, fontWeight: "600" }]}>{m.l}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>更新接口地址</Text>
        <TextInput value={draft.apiBase} onChangeText={(v) => setDraft({ ...draft, apiBase: v })} placeholder="https://ghproxy.net/https://api.github.com" placeholderTextColor={colors.faint} autoCapitalize="none" autoCorrect={false} style={styles.input} />
        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>下载站点地址</Text>
        <TextInput value={draft.downloadBase} onChangeText={(v) => setDraft({ ...draft, downloadBase: v })} placeholder="https://ghproxy.net/https://github.com" placeholderTextColor={colors.faint} autoCapitalize="none" autoCorrect={false} style={styles.input} />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>自动测速切换镜像</Text>
            <Text style={styles.switchSub}>GitHub 延迟高于 {draft.probeThresholdMs}ms 且镜像更快时走镜像</Text>
          </View>
          <Switch value={draft.autoProbe} onValueChange={(v) => setDraft({ ...draft, autoProbe: v })} trackColor={{ true: colors.brand, false: colors.line }} thumbColor={draft.autoProbe ? "#FFFFFF" : colors.faint} />
        </View>

        <View style={styles.btnRow}>
          <Pressable style={styles.ghostBtn} onPress={onProbe} disabled={probing}>
            <Text style={styles.ghostText}>{probing ? "测速中…" : "测试延迟"}</Text>
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={onSave}>
            <Text style={styles.primaryText}>保存镜像设置</Text>
          </Pressable>
        </View>

        {probe ? <Text style={styles.probeText}>GitHub：{probe.github === null ? "不可达" : `${probe.github}ms`}　镜像：{probe.mirror === null ? "未配置 / 不可达" : `${probe.mirror}ms`}</Text> : null}

        <Text style={styles.hint}>国内网络访问 GitHub 常出现超时或延迟过高，可填写自建镜像或代理地址。镜像需与 GitHub API 路径保持一致，例如 https://ghproxy.net/https://api.github.com 。</Text>
      </View>

      <Text style={styles.section}>发布说明</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>每次向 main 分支推送，GitHub Actions 会构建 APK 并发布 Release；应用通过 releases/latest 检测版本号变化，发现新版本即提示更新。</Text>
        <Pressable style={styles.linkBtn} onPress={() => router.back()}>
          <Text style={styles.linkText}>返回</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14 },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    label: { fontSize: 11.5, color: colors.faint },
    version: { fontSize: 20, fontWeight: "700", color: colors.ink, marginTop: 4 },
    statusLine: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
    statusText: { fontSize: 12.5, color: colors.ink, flex: 1 },
    metaText: { fontSize: 11, color: colors.faint },
    errorText: { fontSize: 11.5, color: colors.danger, marginTop: 8, lineHeight: 17 },
    btnRow: { flexDirection: "row", gap: 10, marginTop: 14 },
    primaryBtn: { flex: 1, height: 42, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 13.5, fontWeight: "600" },
    ghostBtn: { flex: 1, height: 42, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
    ghostText: { color: colors.ink, fontSize: 13, fontWeight: "500" },
    hint: { fontSize: 11, color: colors.faint, lineHeight: 17, marginTop: 10 },
    cardTitle: { fontSize: 13, fontWeight: "600", color: colors.ink, marginBottom: 8 },
    notes: { fontSize: 12, color: colors.sub, lineHeight: 19 },
    section: { fontSize: 12, color: colors.faint, marginTop: 20, marginBottom: 8, marginLeft: 2 },
    fieldLabel: { fontSize: 11.5, color: colors.sub, marginBottom: 6 },
    segment: { flexDirection: "row", backgroundColor: colors.chipBg, borderRadius: radius.sm, padding: 2, gap: 2, marginBottom: 4 },
    segmentItem: { flex: 1, paddingVertical: 7, borderRadius: 3, alignItems: "center" },
    segmentActive: { backgroundColor: colors.surface },
    segmentText: { fontSize: 12, color: colors.sub },
    input: { height: 38, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 10, fontSize: 12, color: colors.ink, backgroundColor: colors.fieldBg },
    switchRow: { flexDirection: "row", alignItems: "center", marginTop: 16, gap: 10 },
    switchLabel: { fontSize: 13, color: colors.ink },
    switchSub: { fontSize: 10.5, color: colors.faint, marginTop: 3 },
    probeText: { fontSize: 11.5, color: colors.sub, marginTop: 10 },
    linkBtn: { marginTop: 12, height: 38, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.fieldBorder, alignItems: "center", justifyContent: "center" },
    linkText: { fontSize: 12.5, color: colors.ink },
    presetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    presetTest: { fontSize: 11.5, color: colors.brand, fontWeight: "600" },
    presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
    presetChip: { borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: colors.surface },
    presetChipActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
    presetText: { fontSize: 11.5, color: colors.ink },
    presetMs: { fontSize: 10, color: colors.success, marginTop: 2 },
    mirrorNote: { fontSize: 10.5, color: colors.faint, lineHeight: 16, marginTop: 8 },
  });