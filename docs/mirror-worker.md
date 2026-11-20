# 自建稳定镜像（Cloudflare Worker）

公共 GitHub 代理（ghproxy.net / gh-proxy.com / ghfast.top 等）稳定性随时间和地区波动，且**无法代理私有仓库的 Release**。最稳的做法是用 Cloudflare Workers 自建一个反代：

- 免费额度每天 10 万请求，足够个人/班级使用
- 可绑定自己的域名，避免公共域名被限速
- 需要私有仓库时，把 GitHub Token 存为 Worker Secret，由 Worker 代签

## 1. 创建 Worker

Cloudflare Dashboard → Workers & Pages → Create → Worker，粘贴：

```js
const TARGETS = {
  "/api": "https://api.github.com",
  "/gh": "https://github.com",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const [, prefix, ...rest] = url.pathname.split("/");
    const target = TARGETS["/" + prefix];
    if (!target) return new Response("not found", { status: 404 });

    const headers = { "User-Agent": "college-schedule-mirror" };
    // 私有仓库：在 Worker 设置 GH_TOKEN 后自动带上
    if (env.GH_TOKEN) headers.Authorization = `Bearer ${env.GH_TOKEN}`;

    const upstream = target + "/" + rest.join("/") + url.search;
    const res = await fetch(upstream, { headers, redirect: "follow" });

    const out = new Response(res.body, { status: res.status, headers: res.headers });
    out.headers.set("Access-Control-Allow-Origin", "*");
    out.headers.set("Cache-Control", "no-store");
    return out;
  },
};
```

## 2. 配置

- 公开仓库：不需要任何 Secret
- 私有仓库：Settings → Variables and Secrets 添加 `GH_TOKEN`（fine-grained，Contents: Read）

## 3. 填到应用里

「我的 → 检查更新 → 更新源（镜像）」：

- 更新接口地址：`https://<你的worker域名>/api`
- 下载站点地址：`https://<你的worker域名>/gh`

点「测试延迟」确认返回毫秒数，再「保存镜像设置」。

## 说明

- 清华 TUNA 的 `github-release` 只镜像白名单内的开源项目，不能作为本项目 Release 的通用反代，因此没有内置为预设。
- 应用会自动测速：GitHub 延迟高于阈值且镜像更快时走镜像；主源失败会尝试备用源。
