import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { fetchSiteUpdate } from "./site-api";

export const REPO_OWNER = "jiujiu380";
export const REPO_NAME = "college-schedule";
export const GITHUB_API = "https://api.github.com";
export const GITHUB_DL = "https://github.com";

const CFG_KEY = "college.update.config.v1";
const CACHE_KEY = "college.update.lastcheck.v1";

export type UpdateConfig = {
  /** 更新来源：官网优先，失败回退 GitHub */
  source: "site" | "github";
  /** 更新接口镜像，留空表示直连 api.github.com。可填 https://ghproxy.net/https://api.github.com */
  apiBase: string;
  /** 下载站点镜像，留空表示直连 github.com */
  downloadBase: string;
  /** 自动测速：GitHub 延迟超过阈值时改用镜像 */
  autoProbe: boolean;
  /** 延迟阈值（毫秒） */
  probeThresholdMs: number;
};

export const DEFAULT_UPDATE_CONFIG: UpdateConfig = {
  source: "site",
  apiBase: "",
  downloadBase: "",
  autoProbe: true,
  probeThresholdMs: 1500,
};

export type ReleaseInfo = {
  version: string;
  tag: string;
  name: string;
  notes: string;
  apkUrl: string;
  htmlUrl: string;
  publishedAt: string;
  apkSize?: number;
};

export type UpdateStatus = "latest" | "available" | "error";

export type CheckResult = {
  status: UpdateStatus;
  current: string;
  latest?: string;
  release?: ReleaseInfo;
  source: "github" | "mirror" | "site";
  latencyMs?: number;
  error?: string;
  notFound?: boolean;
  checkedAt: number;
};

export function appVersion(): string {
  return Constants.expoConfig?.version ?? "1.0.0";
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => Number(n.replace(/[^0-9]/g, "")) || 0);
  const pb = b.split(".").map((n) => Number(n.replace(/[^0-9]/g, "")) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

export async function loadUpdateConfig(): Promise<UpdateConfig> {
  try {
    const raw = await AsyncStorage.getItem(CFG_KEY);
    if (!raw) return DEFAULT_UPDATE_CONFIG;
    return { ...DEFAULT_UPDATE_CONFIG, ...(JSON.parse(raw) as Partial<UpdateConfig>) };
  } catch {
    return DEFAULT_UPDATE_CONFIG;
  }
}

export async function saveUpdateConfig(cfg: UpdateConfig): Promise<void> {
  await AsyncStorage.setItem(CFG_KEY, JSON.stringify(cfg));
}

export async function loadCachedCheck(): Promise<CheckResult | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckResult;
  } catch {
    return null;
  }
}

async function saveCachedCheck(result: CheckResult): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(result));
}

/** 测量一次 HTTP 往返，失败返回 null */
export async function probe(url: string, timeoutMs = 5000): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
    });
    // 只要拿到响应就算可达（404 也说明网络通畅）
    return Date.now() - start;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type MirrorPreset = {
  id: string;
  name: string;
  apiBase: string;
  downloadBase: string;
};

/**
 * 常用公共镜像。注意：
 * - 公共镜像只能代理【公开仓库】，私有仓库的 Release 无法通过它们下载；
 * - 清华 TUNA 的 github-release 仅镜像白名单仓库，不能作为通用 API 反代，故未列为预设；
 * - 公共镜像稳定性随时间变化，建议用下方“一键测速”挑选当前可用且最快的。
 */
export const MIRROR_PRESETS: MirrorPreset[] = [
  { id: "github", name: "GitHub 直连", apiBase: "", downloadBase: "" },
  {
    id: "ghproxy",
    name: "ghproxy.net",
    apiBase: "https://ghproxy.net/https://api.github.com",
    downloadBase: "https://ghproxy.net/https://github.com",
  },
  {
    id: "ghproxycom",
    name: "gh-proxy.com",
    apiBase: "https://gh-proxy.com/https://api.github.com",
    downloadBase: "https://gh-proxy.com/https://github.com",
  },
  {
    id: "ghfast",
    name: "ghfast.top",
    apiBase: "https://ghfast.top/https://api.github.com",
    downloadBase: "https://ghfast.top/https://github.com",
  },
];

export async function testPresets(): Promise<{ id: string; name: string; ms: number | null }[]> {
  const path = `/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
  const results = await Promise.all(
    MIRROR_PRESETS.map(async (p) => {
      const base = p.apiBase ? p.apiBase.replace(/\/$/, "") : GITHUB_API;
      const ms = await probe(base + path, 6000);
      return { id: p.id, name: p.name, ms };
    }),
  );
  return results;
}

export async function probeSources(cfg: UpdateConfig): Promise<{ github: number | null; mirror: number | null }> {
  const path = `/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
  const api = cfg.apiBase.trim().replace(/\/$/, "");
  const [github, mirror] = await Promise.all([
    probe(GITHUB_API + path),
    api ? probe(api + path) : Promise.resolve(null),
  ]);
  return { github, mirror };
}

function normalizeBase(base: string, fallback: string): string {
  const b = base.trim().replace(/\/$/, "");
  return b || fallback;
}

function parseRelease(data: any, cfg: UpdateConfig): ReleaseInfo {
  const tag = String(data.tag_name ?? "");
  const version = tag.replace(/^v/i, "").replace(/-.*$/, "") || "0.0.0";
  const dlBase = normalizeBase(cfg.downloadBase, GITHUB_DL);
  const assets: any[] = Array.isArray(data.assets) ? data.assets : [];
  const apk = assets.find((a) => /\.apk$/i.test(String(a.name)));
  const apkUrl = apk
    ? String(apk.browser_download_url).replace(GITHUB_DL, dlBase)
    : `${dlBase}/${REPO_OWNER}/${REPO_NAME}/releases/latest/download/app-release.apk`;
  return {
    version,
    tag,
    name: String(data.name ?? tag),
    notes: String(data.body ?? "")
      .replace(/\r/g, "")
      .replace(/^#{1,6}\s*/gm, "")
      .slice(0, 1200),
    apkUrl,
    htmlUrl: String(data.html_url ?? `${GITHUB_DL}/${REPO_OWNER}/${REPO_NAME}/releases`).replace(GITHUB_DL, dlBase),
    publishedAt: String(data.published_at ?? ""),
    apkSize: apk?.size,
  };
}

/**
 * 检查更新：
 * 1. 若配置了镜像且开启自动测速，先测 GitHub 与镜像的延迟；
 * 2. GitHub 不通或延迟高于阈值且镜像更快时走镜像；
 * 3. 请求 releases/latest，比较版本号。
 */
export async function checkForUpdate(cfg: UpdateConfig): Promise<CheckResult> {
  const current = appVersion();

  if (cfg.source === "site") {
    try {
      const site = await fetchSiteUpdate();
      if (site) {
        const newer = compareVersions(site.version, current) > 0;
        const result: CheckResult = {
          status: newer ? "available" : "latest",
          current,
          latest: site.version,
          release: {
            version: site.version,
            tag: "site-" + site.version,
            name: "官网 v" + site.version,
            notes: site.notes ?? "",
            apkUrl: site.url,
            htmlUrl: site.url,
            publishedAt: site.created_at,
          },
          source: "site",
          checkedAt: Date.now(),
        };
        await saveCachedCheck(result);
        return result;
      }
    } catch {
      // 官网不可用时回退 GitHub
    }
  }
  const path = `/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
  const mirrorApi = cfg.apiBase.trim().replace(/\/$/, "");
  let base = GITHUB_API;
  let source: "github" | "mirror" = "github";
  let latencyMs: number | undefined;

  if (cfg.autoProbe && mirrorApi) {
    const { github, mirror } = await probeSources(cfg);
    if (github === null && mirror !== null) {
      base = mirrorApi;
      source = "mirror";
      latencyMs = mirror;
    } else if (github !== null && mirror !== null && github > cfg.probeThresholdMs && mirror < github) {
      base = mirrorApi;
      source = "mirror";
      latencyMs = mirror;
    } else if (github !== null) {
      latencyMs = github;
    } else if (mirror !== null) {
      base = mirrorApi;
      source = "mirror";
      latencyMs = mirror;
    }
  } else if (mirrorApi) {
    base = mirrorApi;
    source = "mirror";
  }

  const fetchLatest = async (host: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const start = Date.now();
    try {
      const res = await fetch(host + path, {
        signal: controller.signal,
        headers: { Accept: "application/vnd.github+json", "User-Agent": "college-schedule-app" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { data: await res.json(), ms: Date.now() - start };
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let { data, ms } = await fetchLatest(base);
    latencyMs = latencyMs ?? ms;
    const release = parseRelease(data, cfg);
    const newer = compareVersions(release.version, current) > 0;
    const result: CheckResult = {
      status: newer ? "available" : "latest",
      current,
      latest: release.version,
      release,
      source,
      latencyMs,
      checkedAt: Date.now(),
    };
    await saveCachedCheck(result);
    return result;
  } catch (firstError) {
    // 主源失败时尝试另一个源
    const fallback = base === GITHUB_API ? mirrorApi : GITHUB_API;
    if (fallback) {
      try {
        const { data, ms } = await fetchLatest(fallback);
        const release = parseRelease(data, cfg);
        const newer = compareVersions(release.version, current) > 0;
        const result: CheckResult = {
          status: newer ? "available" : "latest",
          current,
          latest: release.version,
          release,
          source: fallback === GITHUB_API ? "github" : "mirror",
          latencyMs: ms,
          checkedAt: Date.now(),
        };
        await saveCachedCheck(result);
        return result;
      } catch {
        // ignore
      }
    }
    const raw = firstError instanceof Error ? firstError.message : "网络请求失败";
    const notFound = /404/.test(raw);
    const result: CheckResult = {
      status: "error",
      current,
      source,
      latencyMs,
      error: notFound ? "尚未找到发布版本：GitHub 仓库还没有 Release，或仓库尚未公开。" : raw,
      notFound,
      checkedAt: Date.now(),
    };
    await saveCachedCheck(result);
    return result;
  }
}

export function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}