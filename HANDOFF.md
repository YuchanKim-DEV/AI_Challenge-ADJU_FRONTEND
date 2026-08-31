# HANDOFF — 현재 진행 상황

_최종 업데이트: 2026-08-31 (김유찬)_

> 새 세션은 `CLAUDE.md` → 이 파일 → 필요 시 `docs/deploy.md` 순으로 읽으면 됨.

---

## 한 줄 요약
프론트 개발·도커화·**WAS1 배포까지 완료**. 서버 내부에선 정상 동작하나
**80 포트가 인프라 단에서 차단되어 외부 브라우저 접속 불가**(SSH 터널로만 확인 가능).
AI 쪽 업로드·LLM 연동 대기 중이라 e2e 검증은 아직.

---

## ✅ 완료

### 인프라/AI (송지섭)
- **WAS2**: 도커, llama.cpp, LLM 서빙 (`gemma-4-E2B-it-qat-UD-Q4_K_XL.gguf`, 포트 8080, ctx 8192)
- **DB**: PostgreSQL 16 + pgvector, 포트 15432, `adjudb`
- **FastAPI**: 컨테이너 `adju-care-agent_api_1`, 포트 18000, `/health` 200

### 화면 (김유찬)
- `frontend/` — Vite + React + TS. 좌측 챗봇 / 우측 사용자·문서 패널
- 퍼블리싱 완료 — 다크 테마(색 토큰 12개), 채팅 말풍선, 타이핑 인디케이터,
  근거(sources) 접이식 카드, 820px 반응형
- API 연동 코드 완료 (`src/lib/api.ts`) — users / documents / chat / health

### 배포 (2026-08-31 신규)
- **WAS1에 프론트 배포 완료.** 상세 절차·명령어는 `docs/deploy.md`
- Docker 29.7.2 설치 (WAS1엔 아무것도 없던 상태였음), `systemctl enabled`
- 배포 전용 계정 **`web`** 생성 (uid 1001, docker 그룹) — 소스 `/home/web/adju-frontend`
- 컨테이너 `adju-frontend` (`--restart unless-stopped`, 로그 10MB×3)
- 2단계 빌드로 이미지 73.8MB (node 단계는 빌드 후 폐기)
- **검증**: 화면 200 / `/api/health` 200 / WAS1→WAS2 내부망 200

### 형상 관리
- GitHub Private: **https://github.com/YuchanKim-Dev/ADJU**
- 시크릿 제외 (`docs/servers.md`, `.env`, `*.pem`, `node_modules/`)

### API 스펙 대조 (2026-08-31)
서버 실물 `/openapi.json`을 받아 프론트 타입과 대조 → 2건 수정:
- `UserRead`의 소득 필드는 **문자열로 옴**(서버가 Decimal을 string 직렬화).
  프론트는 number로 알고 있었음 → `string`으로 정정. **계산 시 `Number()` 변환 필수**
- `ChatResponse.sources`는 optional → 타입 반영 (화면 코드는 이미 방어 중)
- `GET /users`에 `skip`/`limit` 존재, **limit 기본값 100**

---

## 🏗 현재 아키텍처

```
브라우저 → WAS1:80 (docker nginx, web 계정)
             ├─ /      → 정적 화면 (React dist)
             └─ /api/* → WAS2:18000 FastAPI (내부망 10.20.10.240)
                           ├─ DB  10.30.10.240:15432 (pgvector)
                           └─ LLM 127.0.0.1:8080 (내부 전용)
```
- 브라우저는 **WAS1만 바라봄 → same-origin → CORS 설정 불필요**
- 서버 역할: **WAS1 = 프론트(김유찬)**, WAS2 = AI(송지섭), DB = 데이터

---

## 🔌 접속 방법

`~/.ssh/config`에 별칭 등록됨 (로컬 맥, 리포엔 미포함).

```bash
ssh was     # = ssh was1, 프론트 서버 180.210.89.242
ssh was2    # FastAPI + LLM   180.210.78.147
ssh db      # PostgreSQL      180.210.88.242
```

접속하면 터널 자동 개방:

| 접속 | 브라우저/툴 | 내용 |
| --- | --- | --- |
| `ssh was` | http://localhost:8000 | **배포된 ADJU 화면** |
| `ssh was2` | http://localhost:18000/docs | FastAPI Swagger |
| `ssh db` | `localhost:15432` | PostgreSQL |

키: `~/.ssh/tricocube-was{1,2}-key.pem`, `~/.ssh/tricocube-db-key.pem`
(원본은 `~/Downloads/트라이코큐브_펨키_extracted/` — **macOS TCC가 Downloads 접근을 차단**하므로
반드시 `~/.ssh/` 쪽 사본을 사용할 것)

---

## 🚧 미해결 — 우선순위 순

### 1. 외부 포트 차단 (최우선, 외부 협조 필요)
- 열린 포트는 **SSH 30022뿐**. 80·18000·8080 전부 timeout
- 서버 UFW는 `inactive` → **인프라(트라이코큐브) 단 정책, 서버 안에서 해결 불가**
- 필요 조치: WAS1 TCP 80 인바운드 개방 요청 (관리 콘솔이 있으면 직접 가능)
- 우회안: 서버에 `cloudflared` 설치 시 아웃바운드 터널로 공개 HTTPS 주소 확보 가능
  (단 URL을 아는 사람은 누구나 접근 → 아래 인증 이슈와 함께 판단)

### 2. 보안 (80 개방 **전에** 반드시)
- **FastAPI 무인증** — `get_current_user_id`가 path parameter를 그대로 반환하는 스텁.
  `GET /users`로 전체 사용자 조회 가능. API 키 등 최소 인증 필요 (송지섭 협의)
- **DB가 `0.0.0.0` 바인딩** + 비밀번호 단순(`adju1!`, 문서·메신저로 유출됨)
  → 내부 IP 바인딩 + 비밀번호 교체
- WAS2 보안 업데이트 **151건** 미적용 (커널 포함 시 재부팅 → LLM 중단, 팀 협의 필요)
- DB 백업 미설정 — 유실 시 임베딩 재생성 필요
- **WAS2 디스크 77%** (12G 여유) — 업로드 누적 시 위험. WAS1은 25%로 여유
- 시연/개발은 **가짜 데이터만** 사용 (보험증권엔 질병정보 등 민감정보 포함 가능)

### 3. 기능 (AI 담당 대기)
- 파일 업로드 API 미완, LLM 연동 미완
- 업로드 → 질의 **e2e 검증 대기**
- 답변 스트리밍(SSE) 미적용 — 현재 단발 응답.
  엔드포인트 추가되면 프론트 전환 (nginx는 `proxy_buffering off`로 이미 대비됨)

### 4. 화면
- 로고 이미지(`Logo.png`) 미적용 — 현재 "ADJU" 텍스트에 그라디언트
- 노션에 있다는 UI 시안과 대조 필요 (현재 디자인은 임의 판단)
- 시연용 원클릭 흐름 검토 (현재는 사용자 생성 → 선택 → 업로드 → 질문 순)

---

## 📁 문서
- `docs/deploy.md` — **배포/재배포 절차, 운영 명령어, 구축 이력** (신규)
- `docs/api-interface.md`, `docs/openapi.json` — API 명세
- `docs/db-schema.sql` — DB 스키마
- `docs/servers.md` — 서버 접속정보 (**gitignore, 커밋 금지**)
- 기획서: `(첨부1) 2026 금융 AI Challenge 공모전 기획서_v2.pdf`
