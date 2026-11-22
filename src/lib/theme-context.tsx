import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { Colors, Scheme, ThemeMode, colorsOf, mixHex } from "../theme";
import { THEME_PRESETS } from "./theme-presets";
import { initAccent, subscribeAccent } from "./accent";

const KEY = "college.theme.mode.v1";

type ThemeValue = {
  mode: ThemeMode;
  scheme: Scheme;
  colors: Colors;
  setMode: (mode: ThemeMode) => void;
  accent: string;
};

const Ctx = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [accent, setAccentState] = useState("classic");

  useEffect(() => {
    initAccent().then(setAccentState);
    return subscribeAccent(setAccentState);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "system") setModeState(v);
      })
      .catch(() => {});
  }, []);

  const scheme: Scheme = mode === "system" ? (system === "dark" ? "dark" : "light") : mode;
  const colors = useMemo(() => {
    const base = colorsOf(scheme);
    const preset = THEME_PRESETS.find((p) => p.id === accent) ?? THEME_PRESETS[0];
    const soft = scheme === "dark" ? mixHex(preset.brand, base.bg, 0.82) : mixHex(preset.brand, "#FFFFFF", 0.9);
    return {
      ...base,
      brand: preset.brand,
      brandSoft: soft,
      infoBg: soft,
      infoBorder: mixHex(preset.brand, base.bg, scheme === "dark" ? 0.6 : 0.78),
    };
  }, [scheme, accent]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ThemeValue>(() => ({ mode, scheme, colors, setMode, accent }), [mode, scheme, colors, setMode, accent]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used inside ThemeProvider");
  return v;
}