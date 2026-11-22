export type DebugEntry = { t: number; level: "info" | "warn" | "error"; msg: string };

const entries: DebugEntry[] = [];
const subs = new Set<() => void>();

export function dlog(level: DebugEntry["level"], msg: string): void {
  entries.unshift({ t: Date.now(), level, msg });
  if (entries.length > 200) entries.pop();
  subs.forEach((cb) => cb());
}

export function getLogs(): DebugEntry[] {
  return [...entries];
}

export function clearLogs(): void {
  entries.length = 0;
  subs.forEach((cb) => cb());
}

export function subscribeLogs(cb: () => void): () => void {
  subs.add(cb);
  return () => subs.delete(cb);
}

export function logsText(): string {
  return getLogs()
    .map((e) => "[" + new Date(e.t).toLocaleTimeString() + "] " + e.level.toUpperCase() + " " + e.msg)
    .join("\n");
}
