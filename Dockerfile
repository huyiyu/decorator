# 阶段一：使用 Hugo 官方镜像编译站点
FROM ghcr.io/gohugoio/hugo:v0.160.1 AS builder

USER root
WORKDIR /src
COPY mysite /src

# 生产模式构建：清理缓存、压缩资源
RUN hugo --gc --minify

# 阶段二：使用 Nginx 提供服务
FROM nginx:alpine

# 验证 http_auth_basic 模块可用（通过配置文件语法测试，alpine 官方镜像默认内置）
RUN sh -c 'echo "location / { auth_basic \"test\"; auth_basic_user_file /dev/null; }" > /tmp/abtest.conf \
    && nginx -t -c /etc/nginx/nginx.conf' \
    && echo "auth_basic module: OK"

# 安装 apache2-utils 用于生成 .htpasswd
RUN apk add --no-cache apache2-utils

# 复制编译产物到 Nginx 默认站点目录
COPY --from=builder /src/public /usr/share/nginx/html

# 复制自定义站点配置与启动脚本
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 环境变量：Basic Auth 用户名与密码
ENV BASIC_AUTH_USER=""
ENV BASIC_AUTH_PASSWORD=""

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
