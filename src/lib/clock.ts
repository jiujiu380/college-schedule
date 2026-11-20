/**
 * 统一的“当前时间”入口。
 * 构建时可通过 EXPO_PUBLIC_DEMO_NOW 固定时间，用于演示 / 截图 / 验收，
 * 未设置时始终返回真实时间。
 */
const DEMO_NOW = process.env.EXPO_PUBLIC_DEMO_NOW;

export function currentNow(): Date {
  if (DEMO_NOW) {
    const d = new Date(DEMO_NOW);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export const isDemoClock = Boolean(DEMO_NOW);
