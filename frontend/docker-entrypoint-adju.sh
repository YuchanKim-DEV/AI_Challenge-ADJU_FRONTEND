#!/bin/sh
# API_UPSTREAM 치환 후 공통 설정 배치 (nginx 기동 전 실행)
sed "s|__API_UPSTREAM__|${API_UPSTREAM}|g" /adju-common.conf.tpl > /etc/nginx/adju-common.conf

# Let's Encrypt 인증서가 마운트되어 있으면 그것을, 없으면 자체 서명 인증서를 사용
LE_DIR=/etc/letsencrypt/live/${CERT_DOMAIN:-ins.tricocube.com}
if [ -f "$LE_DIR/fullchain.pem" ]; then
  ln -sf "$LE_DIR/fullchain.pem" /etc/nginx/certs/live.crt
  ln -sf "$LE_DIR/privkey.pem"   /etc/nginx/certs/live.key
  echo "[adju] Let's Encrypt 인증서 사용: $LE_DIR"
else
  ln -sf /etc/nginx/certs/self.crt /etc/nginx/certs/live.crt
  ln -sf /etc/nginx/certs/self.key /etc/nginx/certs/live.key
  echo "[adju] 자체 서명 인증서 사용"
fi
