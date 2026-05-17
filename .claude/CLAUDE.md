# 装修手记 — 项目背景知识

## 项目概述

这是一个基于 [Hugo](https://gohugo.io/) 的静态文档网站，使用 [LotusDocs](https://lotusdocs.dev) 主题，记录一次完整装修旅程中的点滴：与设计师和工长的沟通、设计方案的反复迭代、施工进度的实时把控，以及随时迸发的灵感。

网站标题为「装修手记」，默认语言为中文（zh-CN）。

## 技术栈

| 组件 | 版本/说明 |
|------|----------|
| Hugo | v0.160.1 Extended |
| 主题 | LotusDocs |
| Bootstrap | v5（通过 Hugo Module） |
| 字体 | Inter, Fira Code |
| 服务 | Nginx (Alpine) |
| 容器 | Docker 多阶段构建 |
| CI/CD | GitHub Actions → Docker Hub |

## 项目结构

```
.
├── Dockerfile              # 多阶段构建：Hugo builder → Nginx
├── entrypoint.sh           # 启动脚本：配置 Basic Auth
├── nginx.conf              # Nginx 站点配置
├── .github/workflows/      # GitHub Actions CI
├── mysite/                 # Hugo 站点根目录
│   ├── hugo.toml           # Hugo 主配置
│   ├── content/docs/       # 网站内容
│   │   ├── _index.md       # 首页
│   │   ├── communication/  # 沟通记录
│   │   ├── design/         # 设计方案
│   │   ├── construction/   # 施工进度
│   │   └── discussion/     # 讨论/头脑风暴
│   ├── themes/lotusdocs/   # LotusDocs 主题（本地副本）
│   ├── assets/             # SCSS/JS 资源
│   ├── i18n/zh.toml        # 中文翻译
│   └── public/             # 构建产物（由 Hugo 生成）
└── .claude/                # Claude Code 配置
```

## 内容组织

网站内容按装修流程分为四大板块：

1. **沟通** (`docs/communication/`) — 与设计师、工长、供应商的沟通要点与备忘
2. **设计** (`docs/design/`) — 从第一稿到定稿，记录设计方案的演变与取舍
3. **施工** (`docs/construction/`) — 施工节点、材料进场、验收事项的跟踪记录
4. **讨论** (`docs/discussion/`) — 头脑风暴、灵感记录

每个板块使用 Hugo 的 `_index.md` 作为分类首页，内容页使用 Markdown 编写。

## Hugo 配置要点

- `baseURL = '/'` — 相对路径部署
- `enableEmoji = true` — 支持 Emoji
- `enableGitInfo = true` — 页面显示 Git 提交信息
- `markup.goldmark.renderer.unsafe = true` — 允许原始 HTML（用于自定义组件）
- 主题特性：暗色模式、Prism 代码高亮、FlexSearch 站内搜索、目录导航、面包屑

## 构建与部署

### 本地构建

```bash
cd mysite
hugo --gc --minify
```

构建产物输出到 `mysite/public/`。

### Docker 构建

```bash
docker build -t decorator .
```

Dockerfile 分两个阶段：
1. **Builder**：使用 Hugo 官方镜像编译站点
2. **Runtime**：使用 Nginx Alpine 提供服务

### 运行容器

```bash
docker run -e BASIC_AUTH_USER=admin -e BASIC_AUTH_PASSWORD=secret -p 80:80 decorator
```

- `BASIC_AUTH_USER` 和 `BASIC_AUTH_PASSWORD` 用于配置 Nginx Basic Auth
- 若未设置环境变量，Basic Auth 会被禁用（仅输出警告）

### CI/CD

`.github/workflows/docker-build.yml`：每次 push 触发构建，镜像推送到 Docker Hub (`huyiyu/decorator:<short_sha>`)。

## Nginx 配置

- 监听 80 端口
- 静态资源缓存 1 个月
- Hugo 路由回退：`try_files $uri $uri/ /index.html`
- 可选 Basic Auth 保护

## 开发注意事项

1. **内容编辑**：直接修改 `mysite/content/docs/` 下的 Markdown 文件
2. **主题定制**：LotusDocs 主题在 `mysite/themes/lotusdocs/` 中，可直接修改
3. **样式调整**：SCSS 文件在 `mysite/assets/` 中，Hugo 会自动编译
4. **图片资源**：放到 `mysite/content/docs/<section>/` 下与 Markdown 同目录引用
5. **不要提交 `public/`**：这是构建产物，已由 `.gitignore` 排除
6. **Hugo 版本**：使用 Extended 版本（需要 SCSS 编译）
