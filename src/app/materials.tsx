import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenStatusBar } from "../components/ScreenStatusBar";
import { Material, addMaterial, copyMaterialFile, deleteMaterial, loadMaterials } from "../lib/materials";
import { useSchedule } from "../lib/schedule-store";
import { useTheme } from "../lib/theme-context";
import { Colors, radius } from "../theme";

const FILE_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "*/*",
];

export default function MaterialsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tables, activeId } = useSchedule();
  const active = tables.find((t) => t.id === activeId) ?? tables[0];
  const courses = active?.courses ?? [];
  const [selected, setSelected] = useState(courseId || courses[0]?.id || "");
  const [list, setList] = useState<Material[]>([]);
  const [menu, setMenu] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [preview, setPreview] = useState<Material | null>(null);

  useEffect(() => {
    if (courseId) setSelected(courseId);
  }, [courseId]);

  const load = useCallback(async () => setList(await loadMaterials()), []);
  useEffect(() => { void load(); }, [load]);

  const materials = useMemo(() => list.filter((m) => m.courseId === selected), [list, selected]);
  const course = courses.find((c) => c.id === selected);

  const pickFile = async () => {
    setMenu(false);
    const res = await DocumentPicker.getDocumentAsync({ type: FILE_TYPES, copyToCacheDirectory: true, multiple: false });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    try {
      const uri = await copyMaterialFile(asset.uri, asset.name);
      await addMaterial({ courseId: selected, kind: "file", name: asset.name, uri, mime: asset.mimeType });
      await load();
    } catch (e) {
      Alert.alert("保存失败", String(e instanceof Error ? e.message : e));
    }
  };

  const pickImage = async () => {
    setMenu(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("没有相册权限", "请在系统设置中允许访问照片。");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    const name = asset.fileName || "照片-" + Date.now() + ".jpg";
    try {
      const uri = await copyMaterialFile(asset.uri, name);
      await addMaterial({ courseId: selected, kind: "image", name, uri, mime: asset.mimeType });
      await load();
    } catch (e) {
      Alert.alert("保存失败", String(e instanceof Error ? e.message : e));
    }
  };

  const saveNote = async () => {
    if (!noteTitle.trim() && !noteBody.trim()) return;
    await addMaterial({ courseId: selected, kind: "note", name: noteTitle.trim() || "课堂笔记", text: noteBody.trim() });
    setNoteTitle("");
    setNoteBody("");
    setNoteOpen(false);
    await load();
  };

  const open = (m: Material) => {
    if (m.kind === "note") setPreview(m);
    else if (m.kind === "image") setPreview(m);
    else if (m.uri) {
      Sharing.shareAsync(m.uri, { mimeType: m.mime, dialogTitle: m.name }).catch(() => {});
    }
  };

  const remove = (m: Material) => {
    Alert.alert("删除资料", `确定删除「${m.name}」？`, [
      { text: "取消", style: "cancel" },
      { text: "删除", style: "destructive", onPress: async () => setList(await deleteMaterial(m.id)) },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={styles.head}>
        <View>
          <Text style={styles.title}>课程资料柜</Text>
          <Text style={styles.sub}>{course?.name ?? "选择课程"} · {materials.length} 份资料</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setMenu(true)}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.addText}>添加</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 12 }}>
        {courses.map((c) => (
          <Pressable key={c.id} onPress={() => setSelected(c.id)} style={[styles.chip, selected === c.id && styles.chipOn]}>
            <Text style={[styles.chipText, selected === c.id && { color: "#FFFFFF" }]} numberOfLines={1}>{c.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {materials.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="folder-open-outline" size={26} color={colors.faint} />
          <Text style={styles.emptyText}>这门课还没有资料{"\n"}可以添加 PPT、PDF、照片或课堂笔记</Text>
          <Pressable style={styles.emptyBtn} onPress={() => setMenu(true)}><Text style={styles.emptyBtnText}>添加第一份资料</Text></Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          {materials.map((m, i) => (
            <Pressable key={m.id} style={[styles.row, i !== materials.length - 1 && styles.rowBorder]} onPress={() => open(m)} onLongPress={() => remove(m)}>
              <View style={styles.iconWrap}>
                <Ionicons name={m.kind === "image" ? "image-outline" : m.kind === "note" ? "document-text-outline" : "document-attach-outline"} size={18} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{m.name}</Text>
                <Text style={styles.meta}>{m.kind === "note" ? (m.text || "").slice(0, 48) : new Date(m.createdAt).toLocaleDateString()}</Text>
              </View>
              <Pressable onPress={() => remove(m)} hitSlop={8}><Ionicons name="trash-outline" size={15} color={colors.faint} /></Pressable>
            </Pressable>
          ))}
        </View>
      )}
      <Text style={styles.tip}>点资料查看或分享，长按删除。文件保存在本机，卸载 App 会一并清除。</Text>

      <Modal visible={menu} transparent animationType="slide" onRequestClose={() => setMenu(false)}>
        <View style={styles.mask}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}><Text style={styles.sheetTitle}>添加资料</Text><Pressable onPress={() => setMenu(false)}><Ionicons name="close" size={22} color={colors.sub} /></Pressable></View>
            <Pressable style={styles.option} onPress={pickFile}><Ionicons name="document-attach-outline" size={19} color={colors.brand} /><Text style={styles.optionText}>选择文件（PPT / PDF / Word / Excel）</Text></Pressable>
            <Pressable style={styles.option} onPress={pickImage}><Ionicons name="image-outline" size={19} color={colors.brand} /><Text style={styles.optionText}>从相册选择照片</Text></Pressable>
            <Pressable style={styles.option} onPress={() => { setMenu(false); setNoteOpen(true); }}><Ionicons name="create-outline" size={19} color={colors.brand} /><Text style={styles.optionText}>新建课堂笔记</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={noteOpen} transparent animationType="slide" onRequestClose={() => setNoteOpen(false)}>
        <View style={styles.mask}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}><Text style={styles.sheetTitle}>新建笔记</Text><Pressable onPress={() => setNoteOpen(false)}><Ionicons name="close" size={22} color={colors.sub} /></Pressable></View>
            <TextInput value={noteTitle} onChangeText={setNoteTitle} placeholder="标题，如 第三章重点" placeholderTextColor={colors.faint} style={styles.input} />
            <TextInput value={noteBody} onChangeText={setNoteBody} placeholder="写下课堂笔记…" placeholderTextColor={colors.faint} style={[styles.input, { height: 130, marginTop: 8, textAlignVertical: "top" }]} multiline />
            <Pressable style={styles.primary} onPress={saveNote}><Text style={styles.primaryText}>保存笔记</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <View style={styles.previewMask}>
          <View style={styles.previewCard}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle} numberOfLines={1}>{preview?.name}</Text>
              <Pressable onPress={() => setPreview(null)}><Ionicons name="close" size={22} color={colors.sub} /></Pressable>
            </View>
            {preview?.kind === "image" && preview.uri ? <Image source={{ uri: preview.uri }} style={styles.previewImage} resizeMode="contain" /> : null}
            {preview?.kind === "note" ? <ScrollView style={{ maxHeight: 360 }}><Text style={styles.noteBody}>{preview.text || "（空笔记）"}</Text></ScrollView> : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
    title: { fontSize: 20, fontWeight: "800", color: colors.ink },
    sub: { fontSize: 11, color: colors.faint, marginTop: 4 },
    addBtn: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.brand, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9 },
    addText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "600" },
    chip: { maxWidth: 160, paddingHorizontal: 12, height: 32, borderRadius: 8, backgroundColor: colors.chipBg, borderWidth: 1, borderColor: colors.line, justifyContent: "center" },
    chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
    chipText: { fontSize: 11.5, color: colors.sub },
    empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
    emptyText: { fontSize: 11.5, color: colors.faint, textAlign: "center", lineHeight: 18 },
    emptyBtn: { marginTop: 4, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 9, backgroundColor: colors.brand },
    emptyBtnText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "600" },
    card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
    row: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
    iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
    name: { fontSize: 13, fontWeight: "600", color: colors.ink },
    meta: { fontSize: 10.5, color: colors.faint, marginTop: 3 },
    tip: { fontSize: 10.5, color: colors.faint, lineHeight: 17, marginTop: 12 },
    mask: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 26 },
    sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10 },
    sheetTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.ink },
    option: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 15, borderTopWidth: 1, borderTopColor: colors.line },
    optionText: { fontSize: 13, color: colors.ink },
    input: { height: 44, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 13, color: colors.ink, backgroundColor: colors.fieldBg },
    primary: { marginTop: 16, height: 46, borderRadius: radius.sm, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
    primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    previewMask: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
    previewCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, maxHeight: "80%" },
    previewImage: { width: "100%", height: 300, borderRadius: 10, backgroundColor: colors.chipBg },
    noteBody: { fontSize: 13, lineHeight: 22, color: colors.ink },
  });