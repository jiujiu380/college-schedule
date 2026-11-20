# 课表系统 · Campus Schedule (MVP)

Expo (SDK 58) + React Native + Expo Router 的课表应用。界面为教务系统风格（浅灰底、细边框表格、蓝色强调），无渐变。

## 已实现

- **课表表格**：节次行（1-2 / 3-4 / 中午 / 5-6 / 7-8 / 9-10 / 11-12），课程按学科配色
- **十字定位**：今天所在列 + 当前节次所在行同时高亮，交叉单元格蓝色描边
- **周切换**：上一周 / 下一周 / 回到今天，自动滚动到今天所在列
- **课程详情**：教师、地点、节次、时间、周次、学分、总课时
- **主站**：今日课程、本周课程与学分、教务通知占位
- **作息方案**：夏季 / 秋季两套作息，按 10 月 7 日自动切换
- **上课提醒**：本地通知，课前 10 分钟，按当前作息排期，Android 高优先级横幅
- **用户协议**：首次启动强制阅读，滚动到底部才能同意；「我的 → 通用」可复查
- **静态课表导入**：JSON 粘贴 / 文件选择 / 示例，导入后与接口数据区分标注

## 数据源与优先级

| 来源 | 触发 | 界面标识 | 说明 |
|---|---|---|---|
| `api` | 登录教务系统并成功拉取 | 无横幅 | 实时数据（适配层待接入） |
| `static` | 手动导入 JSON | 琥珀色横幅「静态课表 · N 门 · 非教务实时数据」+ 主站「静态数据」标签 | 离校 / 接口故障时的备选 |
| `demo` | 未登录或未导入 | 灰色提示条「当前为演示数据」 | 仅用于界面演示 |

接入真实接口后，登录成功即写入 `api` 数据源，课表、主站、提醒、今日课程会统一改用接口数据；接口请求失败时回退到已导入的静态课表并提示。

## 静态课表格式

入口：「我的 → 通用 → 静态课表导入」，支持**粘贴 JSON**、**选择文件**、**填入示例**。示例文件见 [docs/sample-timetable.json](docs/sample-timetable.json)。

```json
{
  "name": "2026 秋季学期（静态备份）",
  "courses": [
    {
      "name": "高等数学 A(2)",
      "teacher": "张伟",
      "location": "致远楼 302",
      "weekday": "周一",
      "periods": "1-2",
      "weeks": "1-16",
      "credit": 5
    }
  ]
}
```

字段兼容写法：

- `weekday`：`1-7`、`"周一"`、`"星期一"`
- `periods`：`"1-2"`，或 `startPeriod` + `endPeriod`
- `weeks`：`"1-16"`、`"1-16,18"`、`"4-12/2"`、`[1,2,3]`
- `name` 也可写 `courseName` / `课程名`，`location` 可写 `room` / `教室`

解析器会跳过非法条目并在导入页提示原因。

## 本地运行

```bash
npm install
npx expo start            # Expo Go 扫码
npx expo start --web      # 浏览器预览 http://localhost:8081
npx expo export --platform web
```

演示时钟（固定“当前时间”，便于截图/验收）：

```bash
EXPO_PUBLIC_DEMO_NOW="2026-11-20T10:10:00+08:00" npx expo export --platform web
```

## 目录

```
src/
  app/
    index.tsx            协议 / 登录态分流
    agreement.tsx        用户协议
    login.tsx            登录页
    import.tsx           静态课表导入
    (tabs)/
      home.tsx           主站
      schedule.tsx       课表表格 + 十字高亮 + 数据源横幅
      settings.tsx       我的 / 数据源 / 提醒 / 导入 / 协议
    course/[id].tsx      课程详情
  lib/
    schedule.ts          课程模型 + 演示数据
    schedule-store.tsx   课表状态（数据源 / 作息 / 静态导入）
    static-timetable.ts  JSON 解析 + 本地存储
    season.ts            夏 / 秋作息与 10-07 切换
    notifications.ts     本地通知排期与权限
    agreement.ts         协议文本与同意状态
    config.ts            教务地址配置
    api/school.ts        教务接口适配层（待接入）
    time.ts              节次 / 周次 / 当前节次
    clock.ts             演示时钟
  components/ScreenStatusBar.tsx
  theme.ts               设计变量 + 课程配色
```

## 接入内蒙古农业大学教务系统

已确认地址（开发机不可达，需校园网 / VPN）：

- 登录：`zyjwxt.imau.edu.cn`（正方 `/jwglxt`）
- 课表页：`http://zyjw.imau.edu.cn/jwglxt/kbcx/xskbcx_cxXsgrkb.html`

1. 校内抓取登录请求（`/jwglxt/xtgl/login_slogin.html`、`login_getPublicKey.html`，密码 RSA 加密）与课表查询请求；
2. 在 `src/lib/api/school.ts` 实现 `login()` 与 `fetchCourses()`；
3. 成功后调用 store 的接口数据设置，把 `source` 置为 `api`；失败则保留 `static` 并提示。

无法连校园网时，提供登录页 HTML、课表页 HTML 与一次请求的 HAR 也可实现。


## 更新检测（GitHub Releases）

- **入口**：「我的 → 通用 → 检查更新」；发现新版本时「主站」顶部也会出现提示条
- **机制**：读取 `repos/{owner}/{repo}/releases/latest`，解析 tag 中的版本号与当前 `app.json` 版本比较，有新版本即展示更新说明与下载按钮
- **自动检查**：应用启动后静默检查一次，结果缓存 6 小时
- **镜像与测速**：内置 GitHub 直连 / ghproxy.net / gh-proxy.com / ghfast.top 预设，可一键测速后填入；开启自动测速后先测 GitHub 与镜像延迟，GitHub 超过阈值（默认 1500ms）且镜像更快时自动改走镜像，主源失败还会尝试备用源
- **稳定方案**：公共镜像稳定性波动且不能代理私有仓库，推荐自建 Cloudflare Worker 反代，见 [docs/mirror-worker.md](docs/mirror-worker.md)；清华 TUNA 的 github-release 仅镜像白名单仓库，不能作为通用反代
- **发布**：GitHub Actions 构建后自动发布 Release，tag 形如 `v1.0.0-build-12`，资源固定为 `app-release.apk`，下载地址可用 `/releases/latest/download/app-release.apk`

> 版本比较只取 `major.minor.patch`，发布新版本前请同步修改 `package.json` 与 `app.json` 的 version。

## Android 通知说明

- 启动即创建高优先级通知渠道 `class-reminders`（横幅样式），首次开启提醒时申请 `POST_NOTIFICATIONS`
- 点击通知会跳转到对应课程的详情页
- 本地通知在设备重启后不会自动恢复，重新打开应用并再次开启提醒会重新排期


## 深色模式

- 入口：「我的 → 外观 → 深色模式」，可选「跟随系统 / 浅色 / 深色」，选择结果本地持久化
- 全部页面、课表配色、导航栏与状态栏都会跟随切换；课表课程卡在深色下使用独立的深色配色表

## 赞助

- 入口：「我的 → 通用 → 赞助支持」
- 当前为收款方式占位页，微信 / 支付宝收款码待补充；后续把图片放进来即可替换占位区域

## 构建

- GitHub Actions：push 到 `main` 自动构建 APK 与 Web 包（`.github/workflows/android-build.yml`）
- EAS：`npx eas-cli build --platform android --profile preview`（需 `eas init` 与 Expo 账号）