# 阿里云 ACR + ECS 部署设计文档

## 概述

将装修手记站点的 CI/CD 从 Docker Hub 迁移到阿里云容器镜像服务（ACR），并通过 GitHub Actions 自动部署到阿里云 ECS。同时为 `decorator.huyiyu.com` 配置 Let's Encrypt HTTPS。

## 架构

```
Git push → GitHub Actions
                ↓
      阿里云 ACR (镜像仓库)
                ↓
      阿里云 ECS (47.121.143.26)
      /opt/decorator/
      ├── docker-compose.yml    ← 管理应用容器
      ├── nginx.conf            ← HTTPS 版 Nginx 配置
      ├── entrypoint.sh         ← Basic Auth + 启动逻辑
      └── letsencrypt/          ← 证书文件（通过 volume 挂载）

宿主机 certbot + systemd timer → 自动续签证书
```

## 详细设计

### 1. GitHub Actions 工作流

**文件**: `.github/workflows/docker-build.yml`

| 步骤 | 操作 |
|:---|:---|
| Checkout | `actions/checkout@v5` |
| Login ACR | `docker/login-action` → 使用 `ACR_USERNAME` + `ACR_PASSWORD` |
| Build & Push | 构建镜像推送到 ACR |
| SSH Deploy | SSH 到 ECS 执行 `docker-compose pull && up -d` |

**所需 Secrets：**
- `ACR_USERNAME` — 阿里云 ACR 用户名
- `ACR_PASSWORD` — 阿里云 ACR 密码
- `ECS_HOST` = `47.121.143.26`
- `ECS_USERNAME` = `root`
- `ECS_SSH_KEY` — SSH 私钥（与 `ssh aliyun` 使用的密钥一致）

### 2. Nginx 配置 (HTTPS)

**文件**: `nginx.conf`

监听 80 端口做 HTTP→HTTPS 重定向；监听 443 加载 Let's Encrypt 证书。保留原有 Basic Auth 逻辑。

### 3. Docker Compose (ECS 部署)

**文件**: `/opt/decorator/docker-compose.yml`（不提交到仓库，通过 SCP 部署）

- 单容器服务，映射 80 和 443 端口
- volume 挂载：`/etc/letsencrypt`（证书）、`nginx.conf`（配置）、`entrypoint.sh`（启动脚本）
- 支持环境变量 `BASIC_AUTH_USER`、`BASIC_AUTH_PASSWORD`

### 4. HTTPS 方案

| 组件 | 方式 |
|:---|:---|
| 证书申请 | 宿主机安装 certbot，首次 `certbot certonly --standalone -d decorator.huyiyu.com` |
| 自动续签 | `certbot-renew.service` + `certbot-renew.timer`（每天凌晨检查） |
| 证书加载 | Nginx 容器通过 volume 挂载宿主机 `/etc/letsencrypt` |
| 续签后重载 | 续签脚本执行 `docker exec decorator nginx -s reload` |

### 5. 需更改的文件

| 文件 | 操作 |
|:---|:---|
| `.github/workflows/docker-build.yml` | 修改：ACR 登录 + SSH 部署步骤 |
| `nginx.conf` | 修改：添加 HTTPS 配置 |

### 6. 首次部署流程（从本地机器执行）

1. 通过 `ssh aliyun` 连接 ECS，创建 `/opt/decorator/` 目录
2. 安装 certbot 并申请证书
3. 上传 `docker-compose.yml`、`nginx.conf`、`entrypoint.sh`
4. 启动容器
5. 配置 systemd timer 自动续签证书
6. 验证 `https://decorator.huyiyu.com` 可用

## 不变的内容

- `Dockerfile` — 无需修改
- `entrypoint.sh` — 逻辑不变，仅调整 Basic Auth 文件名路径
- Hugo 站点内容 — 无需修改
