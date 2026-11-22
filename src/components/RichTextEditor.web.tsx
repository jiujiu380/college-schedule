import React, { useState } from "react";
import { TextInput } from "react-native";
import { useTheme } from "../lib/theme-context";

function toText(html: string): string {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|h3|li)>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
}

export function RichTextEditor({ initialHtml, onChange }: { initialHtml: string; dark: boolean; onChange: (html: string) => void }) {
  const { colors } = useTheme();
  const [text, setText] = useState(() => toText(initialHtml));
  return (
    <TextInput
      value={text}
      multiline
      textAlignVertical="top"
      placeholder="写点什么…"
      placeholderTextColor={colors.faint}
      onChangeText={(t) => {
        setText(t);
        onChange("<p>" + t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>") + "</p>");
      }}
      style={{ flex: 1, padding: 14, fontSize: 15, lineHeight: 24, color: colors.ink, backgroundColor: colors.surface }}
    />
  );
}
