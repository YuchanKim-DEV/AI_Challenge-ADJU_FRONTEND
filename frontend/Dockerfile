# ---------- 1단계: 빌드 ----------
FROM node:20-alpine AS build
WORKDIR /app

# 의존성 레이어 캐시 (package*.json 바뀔 때만 재설치)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# VITE_API_BASE=/api → 같은 도메인의 nginx가 FastAPI로 프록시
ENV VITE_API_BASE=/api
RUN npm run build

# ---------- 2단계: 서빙 ----------
FROM nginx:1.27-alpine

# nginx 공식 이미지는 templates/*.template 를 envsubst 처리 후 conf.d 로 복사
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY adju-common.conf.tpl /adju-common.conf.tpl
COPY docker-entrypoint-adju.sh /docker-entrypoint.d/05-adju-common.sh
COPY --from=build /app/dist /usr/share/nginx/html

# 자체 서명 인증서 (공인 인증서 발급 전 임시 HTTPS)
RUN apk add --no-cache openssl && mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
      -keyout /etc/nginx/certs/self.key -out /etc/nginx/certs/self.crt \
      -subj "/C=KR/O=Team ADJU/CN=180.210.89.242" \
      -addext "subjectAltName=IP:180.210.89.242,DNS:localhost" 2>/dev/null

# FastAPI 주소 (docker run -e 로 덮어쓸 수 있음)
ENV API_UPSTREAM=http://10.20.10.240:18000

EXPOSE 80 443
