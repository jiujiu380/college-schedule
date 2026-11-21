export type ThemePreset = {
  id: string;
  name: string;
  brand: string;
  tints: { bg: string; bar: string; fg: string }[];
};

/** 8 套课表配色，只影响课程格子与强调色 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "classic",
    name: "经典蓝",
    brand: "#2F5BFF",
    tints: [
      { bg: "#EAF1FF", bar: "#2F5BFF", fg: "#1E43B8" },
      { bg: "#E8F7EF", bar: "#12A47A", fg: "#0B6B4C" },
      { bg: "#FFF1E6", bar: "#F08A3C", fg: "#9A4A12" },
      { bg: "#F3EBFF", bar: "#8B5CF6", fg: "#5B2FA8" },
      { bg: "#FFEBF0", bar: "#F0526E", fg: "#A31430" },
      { bg: "#E6F6FB", bar: "#2A9DD1", fg: "#0D5D80" },
    ],
  },
  {
    id: "mint",
    name: "薄荷绿",
    brand: "#0E9F6E",
    tints: [
      { bg: "#E6F7F0", bar: "#0E9F6E", fg: "#066046" },
      { bg: "#EAF6FF", bar: "#3B82F6", fg: "#1D4ED8" },
      { bg: "#FEF3E2", bar: "#F59E0B", fg: "#92500E" },
      { bg: "#F3EFFF", bar: "#8B5CF6", fg: "#5B21B6" },
      { bg: "#FDE8EC", bar: "#EC4899", fg: "#9D174D" },
      { bg: "#E9F7E7", bar: "#65A30D", fg: "#3F6212" },
    ],
  },
  {
    id: "amber",
    name: "暖阳橙",
    brand: "#EA7A1B",
    tints: [
      { bg: "#FFF3E3", bar: "#EA7A1B", fg: "#8A4208" },
      { bg: "#FFF0DE", bar: "#D97706", fg: "#92400E" },
      { bg: "#FDF2E9", bar: "#F59E0B", fg: "#92400E" },
      { bg: "#FEF9E7", bar: "#CA8A04", fg: "#713F12" },
      { bg: "#FDEBE4", bar: "#F97316", fg: "#9A3412" },
      { bg: "#F5F0E6", bar: "#A16207", fg: "#713F12" },
    ],
  },
  {
    id: "violet",
    name: "紫罗兰",
    brand: "#7C3AED",
    tints: [
      { bg: "#F1EAFE", bar: "#7C3AED", fg: "#4C1D95" },
      { bg: "#EFEAFB", bar: "#8B5CF6", fg: "#5B21B6" },
      { bg: "#FBEAF7", bar: "#C026D3", fg: "#86198F" },
      { bg: "#EDE9FE", bar: "#6366F1", fg: "#3730A3" },
      { bg: "#FCE7F3", bar: "#DB2777", fg: "#9D174D" },
      { bg: "#F3E8FF", bar: "#A855F7", fg: "#6B21A8" },
    ],
  },
  {
    id: "rose",
    name: "樱花粉",
    brand: "#E11D6F",
    tints: [
      { bg: "#FDEBF1", bar: "#E11D6F", fg: "#9D174D" },
      { bg: "#FCE7F3", bar: "#DB2777", fg: "#9D174D" },
      { bg: "#FCE9EE", bar: "#F43F5E", fg: "#9F1239" },
      { bg: "#FFF0F6", bar: "#EC4899", fg: "#9D174D" },
      { bg: "#FBE8F2", bar: "#D946EF", fg: "#86198F" },
      { bg: "#FEF1F1", bar: "#FB7185", fg: "#9F1239" },
    ],
  },
  {
    id: "ocean",
    name: "深海蓝",
    brand: "#0E7490",
    tints: [
      { bg: "#E6F4F8", bar: "#0E7490", fg: "#155E75" },
      { bg: "#E8F1FB", bar: "#2563EB", fg: "#1E40AF" },
      { bg: "#E9F3F1", bar: "#0D9488", fg: "#115E59" },
      { bg: "#EDF4F6", bar: "#0891B2", fg: "#155E75" },
      { bg: "#EFF3FB", bar: "#4F46E5", fg: "#3730A3" },
      { bg: "#E6F6F4", bar: "#14B8A6", fg: "#115E59" },
    ],
  },
  {
    id: "forest",
    name: "森野绿",
    brand: "#4D7C0F",
    tints: [
      { bg: "#F0F5E6", bar: "#4D7C0F", fg: "#3F6212" },
      { bg: "#EAF4DF", bar: "#65A30D", fg: "#3F6212" },
      { bg: "#EEF6E8", bar: "#16A34A", fg: "#166534" },
      { bg: "#F4F1E4", bar: "#A16207", fg: "#713F12" },
      { bg: "#EAF3EC", bar: "#15803D", fg: "#14532D" },
      { bg: "#F1F5E9", bar: "#84CC16", fg: "#3F6212" },
    ],
  },
  {
    id: "mono",
    name: "黑白极简",
    brand: "#374151",
    tints: [
      { bg: "#F3F4F6", bar: "#4B5563", fg: "#1F2937" },
      { bg: "#ECEEF1", bar: "#374151", fg: "#111827" },
      { bg: "#F6F6F6", bar: "#6B7280", fg: "#374151" },
      { bg: "#EFF1F4", bar: "#9CA3AF", fg: "#374151" },
      { bg: "#F4F5F7", bar: "#52525B", fg: "#27272A" },
      { bg: "#ECEDEF", bar: "#71717A", fg: "#3F3F46" },
    ],
  },
];

export function presetById(id: string): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

export function tintFor(preset: ThemePreset, id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return preset.tints[h % preset.tints.length];
}
