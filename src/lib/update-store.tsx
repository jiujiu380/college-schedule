import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
          if (alive) void run(config);
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
