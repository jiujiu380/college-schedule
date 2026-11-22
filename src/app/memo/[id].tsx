import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, PanResponder, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RichTextEditor } from "../../components/RichTextEditor";
import Svg, { Path } from "react-native-svg";
import { ScreenStatusBar } from "../../components/ScreenStatusBar";
import { Memo, Stroke, loadMemos, upsertMemo } from "../../lib/memos";
import { useTheme } from "../../lib/theme-context";
import { Colors, radius } from "../../theme";

export default function MemoEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isNew = id === "new";
  const [memoId, setMemoId] = useState(isNew ? "m-" + Date.now().toString(36) : String(id));
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [tab, setTab] = useState<"text" | "draw">("text");
  const [loaded, setLoaded] = useState(isNew);
  const [color, setColor] = useState("#2F5BFF");
  const [width, setWidth] = useState(3);
  const [preview, setPreview] = useState("");
  const pathRef = useRef("");

  useEffect(() => {
    if (isNew) return;
    loadMemos().then((list) => {
      const found = list.find((m) => m.id === String(id));
      if (found) {
        setMemoId(found.id);
        setTitle(found.title);
        setHtml(found.body);
        setStrokes(found.strokes ?? []);
      }
      setLoaded(true);
    });
  }, [id]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          pathRef.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          setPreview(pathRef.current);
        },
        onPanResponderMove: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          pathRef.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
          setPreview(pathRef.current);
        },
        onPanResponderRelease: () => {
          if (pathRef.current) {
            const path = pathRef.current;
            const c = colorRef.current;
            const w = widthRef.current;
            setStrokes((s) => [...s, { path, color: c, width: w }]);
          }
          pathRef.current = "";
          setPreview("");
        },
      }),
    [],
  );
  const colorRef = useRef(color);
  colorRef.current = color;
  const widthRef = useRef(width);
  widthRef.current = width;

  const save = async () => {
    if (!title.trim() && !html.replace(/<[^>]*>/g, "").trim() && !strokes.length) {
      Alert.alert("内容为空", "写点文字或画几笔再保存吧。");
      return;
    }
    const memo: Omit<Memo, "updatedAt"> = { id: memoId, title: title.trim() || "无标题", body: html, strokes };
    await upsertMemo(memo);
    router.back();
  };

  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenStatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable>
        <TextInput value={title} onChangeText={setTitle} placeholder="标题" placeholderTextColor={colors.faint} style={styles.titleInput} />
        <Pressable style={styles.saveBtn} onPress={save}><Text style={styles.saveText}>保存</Text></Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "text" && styles.tabActive]} onPress={() => setTab("text")}>
          <Ionicons name="text-outline" size={14} color={tab === "text" ? colors.brand : colors.sub} />
          <Text style={[styles.tabText, tab === "text" && { color: colors.brand }]}>文字</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "draw" && styles.tabActive]} onPress={() => setTab("draw")}>
          <Ionicons name="brush-outline" size={14} color={tab === "draw" ? colors.brand : colors.sub} />
          <Text style={[styles.tabText, tab === "draw" && { color: colors.brand }]}>画板</Text>
        </Pressable>
      </View>

      {tab === "text" ? (
        <RichTextEditor initialHtml={html} dark={scheme === "dark"} onChange={setHtml} />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={[styles.canvas, { backgroundColor: colors.surface }]} {...responder.panHandlers}>
            <Svg style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
              {strokes.map((s, i) => <Path key={i} d={s.path} stroke={s.color} strokeWidth={s.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
              {preview ? <Path d={preview} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
            </Svg>
          </View>
          <View style={styles.drawBar}>
            {["#111827", "#2F5BFF", "#E11D48", "#059669", "#F59E0B"].map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} style={[styles.colorDot, { backgroundColor: c }, color === c && { borderWidth: 2, borderColor: colors.ink }]} />
            ))}
            <View style={{ flex: 1 }} />
            <Pressable style={styles.toolBtn} onPress={() => setStrokes((s) => s.slice(0, -1))}><Ionicons name="arrow-undo" size={16} color={colors.sub} /></Pressable>
            <Pressable style={styles.toolBtn} onPress={() => setStrokes([])}><Ionicons name="trash-outline" size={16} color={colors.danger} /></Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    topBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line },
    titleInput: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.ink, paddingVertical: 6 },
    saveBtn: { backgroundColor: colors.brand, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
    saveText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
    tabs: { flexDirection: "row", gap: 6, padding: 8, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line },
    tab: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    tabActive: { backgroundColor: colors.brandSoft },
    tabText: { fontSize: 12, color: colors.sub },
    webFallback: { flex: 1, padding: 14, fontSize: 15, lineHeight: 24, textAlignVertical: "top" },
    canvas: { flex: 1, margin: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
    drawBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface },
    colorDot: { width: 22, height: 22, borderRadius: 11 },
    toolBtn: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.chipBg },
  });