import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type RefreshFn = () => Promise<void> | void;

const RefreshContext = createContext<{ refreshing: boolean; refresh: () => Promise<void>; register: (fn: RefreshFn) => () => void }>({
  refreshing: false,
  refresh: async () => {},
  register: () => () => {},
});

export function AppRefreshProvider({ children }: { children: React.ReactNode }) {
  const tasks = useRef(new Set<RefreshFn>());
  const [refreshing, setRefreshing] = useState(false);

  const register = useCallback((fn: RefreshFn) => {
    tasks.current.add(fn);
    return () => {
      tasks.current.delete(fn);
    };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const started = Date.now();
    await Promise.all(
      [...tasks.current].map((fn) =>
        Promise.resolve()
          .then(fn)
          .catch(() => undefined),
      ),
    );
    const wait = Math.max(0, 450 - (Date.now() - started));
    if (wait) await new Promise((r) => setTimeout(r, wait));
    setRefreshing(false);
  }, []);

  return <RefreshContext.Provider value={{ refreshing, refresh, register }}>{children}</RefreshContext.Provider>;
}

export function useGlobalRefresh() {
  return useContext(RefreshContext);
}

/** 注册一个“全局刷新”时执行的任务；组件卸载自动移除。 */
export function useRefreshTask(fn: RefreshFn): void {
  const { register } = useGlobalRefresh();
  const latest = useRef(fn);
  latest.current = fn;
  useEffect(() => register(() => latest.current()), [register]);
}
