import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { Ticket, createTicket, fetchTickets } from "../lib/site-api";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await fetchTickets());
    } catch {
      // 官网不可用时保留空列表
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("请填写标题和内容");
      return;
    }
    setBusy(true);
    try {
      await createTicket({ title: title.trim(), content: content.trim(), contact: contact.trim() });
      setTitle("");
      setContent("");
      Alert.alert("已提交", "工单已提交，处理结果会显示在下方。");
      await load();
    } catch {
      Alert.alert("提交失败", "请检查网络或稍后再试。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>提交问题 / 建议</Text>
        <Text style={styles.label}>标题</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="一句话描述问题" placeholderTextColor={colors.faint} style={styles.input} />
        <Text style={styles.label}>详细描述</Text>
        <TextInput value={content} onChangeText={setContent} placeholder="复现步骤、机型、版本号…" placeholderTextColor={colors.faint} multiline textAlignVertical="top" style={[styles.input, { height: 110 }]} />
        <Text style={styles.label}>联系方式（选填）</Text>
        <TextInput value={contact} onChangeText={setContact} placeholder="邮箱 / QQ / 微信" placeholderTextColor={colors.faint} style={styles.input} autoCapitalize="none" />
        <Pressable style={[styles.submit, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          <Text style={styles.submitText}>{busy ? "提交中…" : "提交工单"}</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>我的工单</Text>
      {loading ? <ActivityIndicator color={colors.brand} /> : null}
      {items.map((t) => (
        <View key={t.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.ticketTitle} numberOfLines={1}>{t.title}</Text>
            <Text style={[styles.status, t.status === "closed" ? { color: colors.success } : { color: colors.warnText }]}>
              {t.status === "closed" ? "已解决" : "处理中"}
            </Text>
          </View>
          <Text style={styles.ticketMeta}>{t.created_at}</Text>
          <Text style={styles.ticketContent} numberOfLines={3}>{t.content}</Text>
          {t.reply ? (
            <View style={styles.reply}>
              <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.brand} />
              <Text style={styles.replyText}>{t.reply}</Text>
            </View>
          ) : null}
        </View>
      ))}
      {!loading && !items.length ? <Text style={styles.empty}>还没有提交过工单</Text> : null}
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 10 },
    cardTitle: { fontSize: 14.5, fontWeight: "600", color: colors.ink, marginBottom: 4 },
    label: { fontSize: 11.5, color: colors.sub, marginTop: 10, marginBottom: 5 },
    input: { borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 9, fontSize: 13, color: colors.ink, backgroundColor: colors.fieldBg },
    submit: { marginTop: 14, height: 44, borderRadius: 10, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    submitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    section: { fontSize: 12, color: colors.faint, marginTop: 18, marginBottom: 8, marginLeft: 2 },
    rowBetween: { flexDirection: "row", alignItems: "center", gap: 8 },
    ticketTitle: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.ink },
    status: { fontSize: 11 },
    ticketMeta: { fontSize: 10.5, color: colors.faint, marginTop: 4 },
    ticketContent: { fontSize: 12.5, color: colors.sub, lineHeight: 19, marginTop: 8 },
    reply: { flexDirection: "row", gap: 6, marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: colors.brandSoft },
    replyText: { flex: 1, fontSize: 12, color: colors.brand, lineHeight: 18 },
    empty: { textAlign: "center", color: colors.faint, fontSize: 12.5, marginTop: 16 },
  });
