# 阿里云 ACR + ECS 部署设计文档（修订版）

## 概述

将装修手记站点的 CI/CD 从 Docker Hub 迁移到阿里云 ACR，通过 GitHub Actions 自动部署到 ECS。SSL 证书部署在前置反向代理（Nginx）上，ECS 上运行纯 HTTP 服务。

## 架构

```
用户 → decorator.huyiyu.com
         ↓
      反向代理服务器 (Nginx)
      - 80 → 301 HTTPS
      - 443 (HTTPS, 证书在代理上) → HTTP 转发
         ↓ HTTP
      ECS 47.121.143.26:20080
      容器 Nginx (纯 HTTP, 无 SSL)
```

**证书管理全部在反向代理服务器上完成**，ECS 无需 certbot、无需 systemd timer。

## 详细设计

### 1. GitHub Actions 工作流

| 步骤 | 操作 |
|:---|:---|
| Checkout | `actions/checkout@v5` |
| Login ACR | `docker/login-action` → 使用 `ACR_USERNAME` + `ACR_PASSWORD` |
| Build & Push | 构建镜像推送到 ACR |
| SSH Deploy | SSH 到 ECS 执行 `docker compose pull && up -d` |

**所需 Secrets：**
- `ACR_USERNAME` — 阿里云 ACR 用户名
- `ACR_PASSWORD` — 阿里云 ACR 密码
- `ECS_HOST` = `47.121.143.26`
- `ECS_USERNAME` = `root`
- `ECS_SSH_KEY` — SSH 私钥

### 2. Nginx 配置 (纯 HTTP)

**文件**: `nginx.conf`

仅监听 80 端口，纯 HTTP。无 SSL、无 certbot ACME 路径。

### 3. Docker Compose (ECS 部署)

**文件**: `/opt/decorator/docker-compose.yml`

- 单容器，映射 `20080:80`
- volume 挂载：`nginx.conf`、`entrypoint.sh`
- 环境变量：`BASIC_AUTH_USER`、`BASIC_AUTH_PASSWORD`

### 4. HTTPS 方案

全部在反向代理服务器上完成：
- 代理上安装 certbot，申请 `decorator.huyiyu.com` 证书
- Nginx stream/proxy 配置：80 → ECS:20080 (HTTP)，443(HTTPS) → ECS:20080 (HTTP)
- 代理上配置 systemd timer 自动续签

### 5. 需更改的文件

| 文件 | 操作 |
|:---|:---|
| `.github/workflows/docker-build.yml` | 修改：ACR 登录 + SSH 部署步骤 |
| `nginx.conf` | 修改：恢复纯 HTTP 配置 |

## 不变的内容

- `Dockerfile` — 无需修改
- `entrypoint.sh` — 无需修改
- Hugo 站点内容 — 无需修改
