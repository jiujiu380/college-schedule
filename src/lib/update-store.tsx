import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { ensureChannel } from "./notifications";
import {
  CheckResult,
  DEFAULT_UPDATE_CONFIG,
  UpdateConfig,
  checkForUpdate,
  loadCachedCheck,
  loadUpdateConfig,
  saveUpdateConfig,
} from "./updates";

type UpdateValue = {
  cfg: UpdateConfig;
  result: CheckResult | null;
  checking: boolean;
  check: () => Promise<CheckResult>;
  updateConfig: (cfg: UpdateConfig) => Promise<void>;
};

const Ctx = createContext<UpdateValue | null>(null);

const SIX_HOURS = 6 * 60 * 60 * 1000;
const NOTIFIED_KEY = "college.update.notified.v1";

async function notifyUpdate(result: CheckResult): Promise<void> {
  if (result.status !== "available" || !result.latest) return;
  try {
    const seen = await AsyncStorage.getItem(NOTIFIED_KEY);
    if (seen === result.latest) return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "发现新版本 v" + result.latest,
        body: "点此查看更新内容并下载安装包",
        data: { kind: "update", version: result.latest },
        sound: "default",
      },
      trigger: Platform.OS === "android" ? null : null,
    });
    await AsyncStorage.setItem(NOTIFIED_KEY, result.latest);
  } catch {
    // 通知失败不影响检查更新
  }
}

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [cfg, setCfg] = useState<UpdateConfig>(DEFAULT_UPDATE_CONFIG);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const running = useRef(false);

  const run = useCallback(async (config: UpdateConfig) => {
    if (running.current) return null as unknown as CheckResult;
    running.current = true;
    setChecking(true);
    try {
      const r = await checkForUpdate(config);
      setResult(r);
      return r;
    } finally {
      running.current = false;
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const config = await loadUpdateConfig();
      if (!alive) return;
      setCfg(config);
      const cached = await loadCachedCheck();
      if (!alive) return;
      if (cached) setResult(cached);
      const stale = !cached || Date.now() - cached.checkedAt > SIX_HOURS;
      if (stale) {
        setTimeout(() => {
          if (!alive) return;
          void run(config).then((r) => {
            if (alive && r) void notifyUpdate(r);
          }).catch(() => {});
        }, 900);
      }
    })();
    return () => {
      alive = false;
    };
  }, [run]);

  const value = useMemo<UpdateValue>(
    () => ({
      cfg,
      result,
      checking,
      check: () => run(cfg),
      updateConfig: async (next: UpdateConfig) => {
        setCfg(next);
        await saveUpdateConfig(next);
      },
    }),
    [cfg, result, checking, run],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUpdate(): UpdateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUpdate must be used inside UpdateProvider");
  return v;
}