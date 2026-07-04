# ACR + ECS 部署 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将装修手记从 Docker Hub 迁移到阿里云 ACR，通过 GitHub Actions 自动部署到 ECS。SSL 证书在前置反向代理处理，ECS 纯 HTTP。

**Architecture:** GitHub Actions 构建镜像 → 推送 ACR → SSH 到 ECS 执行 docker-compose 更新。反向代理服务器负责 HTTPS + 证书。

**Tech Stack:** GitHub Actions, Docker, docker-compose, Nginx, ACR

## Global Constraints

- ACR 镜像地址: `crpi-i0f04sdy87xuuifl.cn-hangzhou.personal.cr.aliyuncs.com/decorator`
- ECS IP: `47.121.143.26`
- ECS 部署目录: `/opt/decorator/`
- 域名: `decorator.huyiyu.com`
- SSH 别名: `aliyun`（root 用户）
- ECS 端口映射：`20080:80`（仅 HTTP）
- 证书在反向代理服务器上管理

---

### Task 1: 修改 GitHub Actions 工作流

**Files:**
- Modify: `.github/workflows/docker-build.yml`

- [ ] **Step 1: 重写 docker-build.yml**

```yaml
name: Build and Push Docker Image

on:
  push:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v5

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v4

      - name: Login to Alibaba Cloud ACR
        uses: docker/login-action@v4
        with:
          registry: crpi-i0f04sdy87xuuifl.cn-hangzhou.personal.cr.aliyuncs.com
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Get short commit hash
        id: vars
        run: echo "short_sha=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT

      - name: Build and push Docker image
        uses: docker/build-push-action@v7
        with:
          context: .
          push: true
          tags: crpi-i0f04sdy87xuuifl.cn-hangzhou.personal.cr.aliyuncs.com/decorator:${{ steps.vars.outputs.short_sha }}

      - name: Deploy to ECS via SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.ECS_HOST }}
          username: ${{ secrets.ECS_USERNAME }}
          key: ${{ secrets.ECS_SSH_KEY }}
          script: |
            cd /opt/decorator
            export TAG=${{ steps.vars.outputs.short_sha }}
            docker compose pull
            docker compose up -d --remove-orphans
            docker image prune -f
```

- [ ] **Step 2: 提交**

```bash
git add .github/workflows/docker-build.yml
git commit -m "ci: migrate to ACR with auto-deploy to ECS"
```

---

### Task 2: 恢复 Nginx 纯 HTTP 配置

**Files:**
- Modify: `nginx.conf`

- [ ] **Step 1: 写入纯 HTTP 配置**

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        auth_basic "Restricted Area";
        auth_basic_user_file /etc/nginx/.htpasswd;
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf)$ {
        expires 1M;
        add_header Cache-Control "public, immutable";
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add nginx.conf
git commit -m "fix: revert to HTTP-only nginx config

- SSL handled by reverse proxy, ECS runs HTTP only
- Remove certbot ACME location (not needed on ECS)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: SSH 到 ECS — 首次部署

- [ ] **Step 1: 创建目录**

```bash
ssh aliyun 'mkdir -p /opt/decorator/nginx'
```

- [ ] **Step 2: 创建 docker-compose.yml**

```bash
ssh aliyun "cat > /opt/decorator/docker-compose.yml << 'DOCKERCOMPOSE'
services:
  decorator:
    image: crpi-i0f04sdy87xuuifl.cn-hangzhou.personal.cr.aliyuncs.com/decorator:latest
    container_name: decorator
    restart: unless-stopped
    ports:
      - "20080:80"
    volumes:
      - /opt/decorator/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - /opt/decorator/entrypoint.sh:/entrypoint.sh:ro
    environment:
      - BASIC_AUTH_USER=\${BASIC_AUTH_USER:-admin}
      - BASIC_AUTH_PASSWORD=\${BASIC_AUTH_PASSWORD:-decorator2024}
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
DOCKERCOMPOSE"
```

- [ ] **Step 3: 创建 .env 文件**

```bash
ssh aliyun "cat > /opt/decorator/.env << 'ENVFILE'
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=decorator2024
ENVFILE"
```

- [ ] **Step 4: SCP 本地文件到 ECS**

```bash
cd /Users/hushuying/github/decorator
scp nginx.conf aliyun:/opt/decorator/nginx/default.conf
scp entrypoint.sh aliyun:/opt/decorator/entrypoint.sh
```

- [ ] **Step 5: 登录 ACR 并拉取镜像启动**

```bash
ssh aliyun 'docker login crpi-i0f04sdy87xuuifl.cn-hangzhou.personal.cr.aliyuncs.com -u "$ACR_USERNAME" -p "$ACR_PASSWORD" && cd /opt/decorator && docker compose pull && docker compose up -d'
```

- [ ] **Step 6: 验证容器运行**

```bash
ssh aliyun 'docker ps | grep decorator && docker logs decorator --tail 10'
```

---

### Task 4: 验证部署

- [ ] **Step 1: 本地推送触发 CI/CD**

```bash
git push origin main
```
预期: GitHub Actions 自动触发构建 → 推送 ACR → 部署到 ECS

- [ ] **Step 2: 反向代理配置完成后验证**

通过 `curl http://47.121.143.26:20080` 验证 ECS 上应用可访问
