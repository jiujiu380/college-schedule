# gw666 官网系统（PHP + MySQL）

知酷课程表官网 + 管理后台 + App 接口。目录：`gw666/`

## 部署

1. 上传 `gw666/` 到站点根目录（PHP 8.0+，需 pdo_mysql、mbstring）
2. 建 MySQL 数据库（如 `gw666`，utf8mb4）
3. 浏览器访问 `https://你的域名/install.php`，填写数据库、管理员账号、站点地址
4. 安装完成后**删除 install.php**
5. 确保 `uploads/` 可写（logo 上传）
6. 后台：`/admin/login.php`

## 后台功能

- **概览**：公告数、待处理工单、版本记录
- **网站设置**：站点名称/简介/Logo/下载地址、SEO 关键词与描述、联系方式
- **公告管理**：富文本编辑（加粗/斜体/下划线/列表）、置顶、编辑、删除
- **版本更新**：版本号、下载地址、更新说明、强制更新、渠道（官网/GitHub）
- **工单**：查看用户提交、回复、标记已解决

## App 接口

Base：`https://你的域名/api.php`

| 接口 | 说明 |
|---|---|
| `?action=site` | 站点信息、下载地址、联系方式 |
| `?action=announcements` | 公告列表（置顶优先） |
| `?action=update` | 官网最新版本（供 App 内更新） |
| `?action=tickets&device_id=xxx` | 该设备的工单列表 |
| `POST ?action=ticket_create` | 提交工单，JSON：device_id/title/content/contact |
| `POST ?action=user_register` | 注册：username/password/email/qq/wechat/captcha |
| `POST ?action=user_login` | 登录：username/password/captcha，返回 token |
| `GET ?action=user_me&token=` | 当前用户信息 |
| `POST ?action=user_logout` | 退出登录 |
| `POST ?action=update_profile` | 修改昵称/头像：token/nickname/avatar_base64 |
| `POST ?action=sync_save` | 上传课表/备忘录/日程，JSON：token/data |
| `GET ?action=sync_load&token=` | 读取云端数据 |

## 极验验证码

后台「网站设置」填 GeeTest v4 的 Captcha ID / Key，并勾选启用；未配置时注册登录自动跳过验证。
极验后台需把官网域名加入白名单。App 通过 WebView 打开 `/captcha.php` 完成验证。

## 云同步

登录后课表变化约 5 秒自动上传；账号页可手动「上传当前数据 / 从云端恢复」。
云端数据存在 `user_data` 表（user_id / payload / updated_at），后台用户详情可看大小与时间。

## App 侧对接

- 公告：主站顶部横幅，点击进入公告页；接口失败自动隐藏
- 更新：默认「官网」来源，读取 `?action=update`；可在「检查更新 → 更新来源」切到 GitHub
- 工单：「我的 → 工单反馈」，提交后按设备号拉取回复
- 官网地址默认 `https://class.zcoow.cn`，改域名需同步改 `src/lib/site-api.ts` 的 `DEFAULT_SITE_BASE`

## 安全建议

- 首次登录后立即修改管理员密码（可直接在数据库用 `password_hash` 生成）
- 生产环境开启 HTTPS，关闭目录列表
- 定期备份数据库与 uploads