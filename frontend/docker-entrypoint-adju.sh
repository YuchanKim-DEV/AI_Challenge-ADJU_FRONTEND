#!/bin/sh
# API_UPSTREAM 치환 후 공통 설정 배치 (nginx 기동 전 실행)
sed "s|__API_UPSTREAM__|${API_UPSTREAM}|g" /adju-common.conf.tpl > /etc/nginx/adju-common.conf
