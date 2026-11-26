import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { Colors, Scheme, ThemeMode, colorsOf, glassColorsOf, mixHex } from "../theme";
import { THEME_PRESETS } from "./theme-presets";
import { initAccent, subscribeAccent } from "./accent";

const KEY = "college.theme.mode.v1";
const GLASS_KEY = "college.glass.v1";

type ThemeValue = {
  mode: ThemeMode;
  scheme: Scheme;
  colors: Colors;
  setMode: (mode: ThemeMode) => void;
  accent: string;
  glass: boolean;
  setGlass: (on: boolean) => void;
  glassBase: string;
};

const Ctx = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [accent, setAccentState] = useState("classic");
  const [glass, setGlassState] = useState(false);

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
    AsyncStorage.getItem(GLASS_KEY).then((v) => setGlassState(v === "1")).catch(() => {});
  }, []);

  const scheme: Scheme = mode === "system" ? (system === "dark" ? "dark" : "light") : mode;
  const colors = useMemo(() => {
    const base = glass ? glassColorsOf(scheme) : colorsOf(scheme);
    const preset = THEME_PRESETS.find((p) => p.id === accent) ?? THEME_PRESETS[0];
    const soft = scheme === "dark" ? mixHex(preset.brand, base.bg, 0.82) : mixHex(preset.brand, "#FFFFFF", 0.9);
    return {
      ...base,
      brand: preset.brand,
      brandSoft: soft,
      infoBg: soft,
      infoBorder: mixHex(preset.brand, base.bg, scheme === "dark" ? 0.6 : 0.78),
    };
  }, [scheme, accent, glass]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  const setGlass = useCallback((on: boolean) => {
    setGlassState(on);
    AsyncStorage.setItem(GLASS_KEY, on ? "1" : "0").catch(() => {});
  }, []);

  const glassBase = scheme === "dark" ? "#070B14" : "#EFF5FF";
  const value = useMemo<ThemeValue>(() => ({ mode, scheme, colors, setMode, accent, glass, setGlass, glassBase }), [mode, scheme, colors, setMode, accent, glass, setGlass, glassBase]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used inside ThemeProvider");
  return v;
}