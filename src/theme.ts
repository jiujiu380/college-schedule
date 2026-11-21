export type Scheme = "light" | "dark";
export type ThemeMode = "system" | "light" | "dark";

export const lightColors = {
  bg: "#F2F3F5",
  surface: "#FFFFFF",
  ink: "#111827",
  sub: "#6B7280",
  faint: "#9CA3AF",
  line: "#E5E7EB",
  lineSoft: "#F0F1F3",
  brand: "#2F5BFF",
  brandSoft: "#EDF2FF",
  danger: "#DC2626",
  success: "#059669",
  fieldBg: "#FFFFFF",
  fieldBorder: "#DDE0E5",
  chipBg: "#F3F4F6",
  chipBorder: "#DDE0E5",
  chipActiveBg: "#E9ECF1",
  warnBg: "#FFF7E6",
  warnBorder: "#F3E3C3",
  warnText: "#B45309",
  infoBg: "#F3F6FF",
  infoBorder: "#D6E0FF",
  tabInactive: "#9CA3AF",
  overlay: "rgba(17,24,39,0.04)",
};

export type Colors = typeof lightColors;

export const darkColors: Colors = {
  bg: "#0B0D12",
  surface: "#151922",
  ink: "#F4F6FA",
  sub: "#C2C9D6",
  faint: "#98A2B3",
  line: "#2C3240",
  lineSoft: "#1D2330",
  brand: "#6B8DFF",
  brandSoft: "#1B2440",
  danger: "#FF7070",
  success: "#3DDC97",
  fieldBg: "#11151D",
  fieldBorder: "#343B4A",
  chipBg: "#1F242E",
  chipBorder: "#2B3140",
  chipActiveBg: "#2A3140",
  warnBg: "#2A2113",
  warnBorder: "#4A3A1D",
  warnText: "#E6A85C",
  infoBg: "#161F33",
  infoBorder: "#2A3A5E",
  tabInactive: "#6B7280",
  overlay: "rgba(255,255,255,0.06)",
};

export function colorsOf(scheme: Scheme): Colors {
  return scheme === "dark" ? darkColors : lightColors;
}

export const radius = { sm: 4, md: 6, lg: 8 };

type Tint = { bg: string; bar: string; fg: string };

const tintsLight: Tint[] = [
  { bg: "#EAF1FF", bar: "#2F5BFF", fg: "#1E43B8" },
  { bg: "#E8F7EF", bar: "#12A47A", fg: "#0B6B4C" },
  { bg: "#FFF1E6", bar: "#F08A3C", fg: "#9A4A12" },
  { bg: "#F3EBFF", bar: "#8B5CF6", fg: "#5B2FA8" },
  { bg: "#FFEBF0", bar: "#F0526E", fg: "#A31430" },
  { bg: "#E6F6FB", bar: "#2A9DD1", fg: "#0D5D80" },
  { bg: "#FBF4DA", bar: "#D9A514", fg: "#7A5C0B" },
  { bg: "#EDF6E6", bar: "#7BA33C", fg: "#44601A" },
];

const tintsDark: Tint[] = [
  { bg: "#18233C", bar: "#6B8DFF", fg: "#C7D6FF" },
  { bg: "#14261F", bar: "#2FB98A", fg: "#B9EBD6" },
  { bg: "#2A1F14", bar: "#F0A05C", fg: "#FFD3AE" },
  { bg: "#221A33", bar: "#A78BFA", fg: "#DCCBFF" },
  { bg: "#2A1720", bar: "#F2748C", fg: "#FFC6D2" },
  { bg: "#132731", bar: "#4FB3DC", fg: "#BFE8F7" },
  { bg: "#282212", bar: "#E3BC4A", fg: "#F5DFA0" },
  { bg: "#1D2614", bar: "#8FBA55", fg: "#D6ECB4" },
];

export function courseTint(id: string, scheme: Scheme = "light"): Tint {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const list = scheme === "dark" ? tintsDark : tintsLight;
  return list[h % list.length];
}