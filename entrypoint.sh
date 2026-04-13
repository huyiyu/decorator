#!/bin/sh
set -e

# 清除 Nginx 版本信息（隐藏版本号）
if ! grep -q "server_tokens off" /etc/nginx/nginx.conf; then
    sed -i 's/server_tokens on/server_tokens off/' /etc/nginx/nginx.conf || true
    # 若不存在显式配置，则在 http 块内追加
    sed -i '/http {/a \    server_tokens off;' /etc/nginx/nginx.conf || true
fi

# 根据环境变量生成 Basic Auth 密码文件或关闭认证
if [ -n "$BASIC_AUTH_USER" ] && [ -n "$BASIC_AUTH_PASSWORD" ]; then
    echo "Generating .htpasswd for user: $BASIC_AUTH_USER"
    htpasswd -cb /etc/nginx/.htpasswd "$BASIC_AUTH_USER" "$BASIC_AUTH_PASSWORD"
else
    echo "WARNING: BASIC_AUTH_USER or BASIC_AUTH_PASSWORD not set, disabling basic auth."
    sed -i 's/auth_basic "Restricted Area";/# auth_basic "Restricted Area";/' /etc/nginx/conf.d/default.conf
    sed -i 's/auth_basic_user_file \/etc\/nginx\/.htpasswd;/# auth_basic_user_file \/etc\/nginx\/.htpasswd;/' /etc/nginx/conf.d/default.conf
fi

exec "$@"
