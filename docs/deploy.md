# 프론트 배포 — WAS1 (김유찬)

_최종: 2026-08-31_

## 구성

```
브라우저 ──> WAS1 :80  (docker nginx, web 계정)
               ├─ /            → dist/ 정적 파일
               └─ /api/*       → WAS2 10.20.10.240:18000 (FastAPI)
                                  └─ DB 10.30.10.240:15432 / LLM 127.0.0.1:8080
```

- 브라우저는 **WAS1만** 바라봄 → same-origin → **CORS 설정 불필요**
- 실행 계정: `web` (uid 1001, docker 그룹)
- 소스 위치: `/home/web/adju-frontend`
- 컨테이너: `adju-frontend` (`--restart unless-stopped`)

## SSH 접속

`~/.ssh/config`에 등록되어 있음.

```bash
ssh was      # = ssh was1, 프론트 서버 (180.210.89.242)
ssh was2     # FastAPI + LLM  (180.210.78.147)
ssh db       # PostgreSQL     (180.210.88.242)
```

접속하면 터널이 자동으로 열림:

| 접속 | 브라우저 주소 | 내용 |
| --- | --- | --- |
| `ssh was` | http://localhost:8000 | 배포된 ADJU 화면 |
| `ssh was2` | http://localhost:18000/docs | FastAPI Swagger |
| `ssh db` | `localhost:15432` | PostgreSQL (DB 툴에서) |

> 외부 IP 직접 접속은 **80/18000 포트가 인프라 단에서 차단**되어 불가.
> 열려 있는 건 SSH(30022)뿐 → 개방 요청 필요.

## 파일 전송

```bash
scp ./파일 was:~/              # 올리기
scp was:~/파일 ./              # 내려받기
rsync -avz --exclude node_modules ./frontend/ was:/tmp/fe/   # 폴더 동기화
```

---

## 재배포 (프론트 수정 후)

```bash
cd ~/Desktop/ADJU

# 1) 소스 전송  (COPYFILE_DISABLE: macOS ._* 잔여파일 방지)
COPYFILE_DISABLE=1 tar --exclude=node_modules --exclude=dist --exclude=.env \
  --exclude='*.tsbuildinfo' -czf - -C frontend . | \
  ssh was 'cat > /tmp/fe.tgz && sudo rm -rf /home/web/adju-frontend && \
           sudo mkdir -p /home/web/adju-frontend && \
           sudo tar -xzf /tmp/fe.tgz -C /home/web/adju-frontend && \
           rm /tmp/fe.tgz && sudo chown -R web:web /home/web/adju-frontend'

# 2) 빌드 + 재기동
ssh was 'sudo -iu web bash -c "
  cd ~/adju-frontend && docker build -t adju-frontend:latest . && \
  docker rm -f adju-frontend; \
  docker run -d --name adju-frontend --restart unless-stopped -p 80:80 \
    --log-opt max-size=10m --log-opt max-file=3 adju-frontend:latest"'

# 3) 확인
ssh was 'curl -s -o /dev/null -w "화면 %{http_code}\n" http://localhost/;
         curl -s -o /dev/null -w "api  %{http_code}\n" http://localhost/api/health'
```

## ⚠️ 라우팅 설정 (재부팅 시 반드시 재적용)

WAS1은 NIC가 2개이고 **공인 IP가 eth1(10.200.40.77)에 매핑**되어 있다.
도커 컨테이너 응답이 eth0으로 나가면 외부에서 접속이 안 되므로 아래 설정이 필요하다.
자세한 원인은 `docs/troubleshooting.md` 1번 항목 참고.

```bash
sudo iptables -t mangle -A PREROUTING -i eth1 -m conntrack --ctstate NEW -j CONNMARK --set-mark 2
sudo iptables -t mangle -A PREROUTING -j CONNMARK --restore-mark
sudo ip rule add fwmark 2 lookup 2 priority 100
sudo ip route add 172.17.0.0/16 dev docker0 table 2   # ★ 빠뜨리면 접속 불가
```

확인:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://180.210.89.242/    # 200
```

### 영구화 (2026-09-01 적용 완료)

위 설정은 메모리에만 남으므로 systemd 서비스로 부팅 시 자동 적용되게 해두었다.

- 스크립트: `/usr/local/bin/adju-routing.sh` (중복 실행해도 안전)
- 유닛: `/etc/systemd/system/adju-routing.service` (`enabled` + `active`)
- docker.service 이후에 실행됨 (docker0 인터페이스가 생긴 뒤여야 하므로)

```bash
systemctl status adju-routing        # 상태 확인
sudo systemctl restart adju-routing  # 수동 재적용
```

> 검증: 라우팅을 일부러 삭제한 뒤 서비스 재실행 → 자동 복원, 외부 접속 200 확인.

## 운영 명령어

```bash
ssh was 'sudo -iu web docker ps'                       # 상태
ssh was 'sudo -iu web docker logs -f adju-frontend'    # 로그 (Ctrl+C)
ssh was 'sudo -iu web docker restart adju-frontend'    # 재시작
ssh was 'df -h /'                                      # 디스크
ssh was2 'docker logs --tail 50 adju-care-agent_api_1' # API 로그
```

---

## 최초 구축에 사용한 명령어 (기록)

### 1. WAS1 도커 설치
```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu noble stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 2. web 계정 생성
```bash
sudo useradd -m -s /bin/bash web
sudo usermod -aG docker web
```

### 3. 소스 배치 · 빌드 · 기동
```bash
sudo mkdir -p /home/web/adju-frontend
sudo tar -xzf /tmp/adju-frontend.tgz -C /home/web/adju-frontend
sudo find /home/web/adju-frontend -name "._*" -delete
sudo chown -R web:web /home/web/adju-frontend

sudo -iu web bash -c "cd ~/adju-frontend && docker build -t adju-frontend:latest ."
sudo -iu web bash -c "docker run -d --name adju-frontend --restart unless-stopped -p 80:80 \
  --log-opt max-size=10m --log-opt max-file=3 adju-frontend:latest"
```

### 4. 연결 확인
```bash
ssh was1 'curl -s -o /dev/null -w "%{http_code}\n" http://10.20.10.240:18000/health'  # 200
ssh was1 'curl -s -o /dev/null -w "%{http_code}\n" http://localhost/'                 # 200
ssh was1 'curl -s -o /dev/null -w "%{http_code}\n" http://localhost/api/health'       # 200
```

### 5. WAS2에서 임시 배포분 제거 (프론트만)
```bash
docker rm -f adju-frontend
docker rmi adju-frontend:latest
rm -rf ~/adju-frontend
# adju-care-agent(FastAPI) · llama.cpp · 모델 파일은 손대지 않음
```
