root /usr/share/nginx/html;
index index.html;

gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
gzip_min_length 1024;

location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Let's Encrypt 도메인 소유 확인용 (인증서 갱신 시 사용)
location ^~ /.well-known/acme-challenge/ {
    root /var/www/certbot;
    default_type "text/plain";
}

location / {
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass __API_UPSTREAM__/;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    client_max_body_size 50m;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
    proxy_buffering off;
}
