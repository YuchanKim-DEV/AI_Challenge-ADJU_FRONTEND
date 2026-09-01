# ADJU — AI 금융 부관 (Team ADJU)

> 이 파일은 Claude Code가 이 폴더에서 실행될 때 자동으로 읽는 프로젝트 지침입니다.
> **새 세션 시작 시 반드시 이 파일 → `HANDOFF.md` 순으로 읽으세요.**
> 서버 배포/운영 작업이면 `docs/deploy.md`, `docs/troubleshooting.md`도 함께 읽으세요.

## 프로젝트 개요
- **제품명**: ADJU (AI 금융 부관) — 사용자가 가입한 보험상품·보험증권 내용을 기반으로
  대화형으로 질문하면 즉시 답변해 주는 AI 서비스.
- **핵심 흐름**: 보험증권(PDF 등) 업로드 → 임베딩(RAG) → 챗봇으로 보장 내용 질의응답.
- **확장 방향**: 보장 분석/부족 보장 추천 → 투자 현황 분석, 자산관리, 금융 설계 등 개인 금융 전반.
- **UI 컨셉**: 좌측 챗봇(실시간 업데이트되어 답변). 온톨로지는 사용하지 않고 텍스트 데이터 입력.

## 공모전
- **2026 금융 AI Challenge** — https://daker.ai/public/hackathons/2026-finance-ai-challenge
- **마감**: 2026-09-07(월) · 서버 접속 가능 기간: ~2026-12-31
- 확장 가능 공모전:
  - K-Startup 보훈부 공고(pbancSn=178931): 2026-09-17(목) 마감, 상금은 사업자금 재투자
  - K-GovTech(k-govtech.kr): 2026-09-21(월) 마감, 제품·서비스 개발 분야

## 팀
| 이름 | 역할 |
| --- | --- |
| 최별규 | PM / 문서 |
| 송지섭 | AI (WAS2 도커·LLM 서빙·FastAPI, DB) |
| 김유찬 | DevOps / **화면(프론트) 개발** ← 이 리포 주 담당 |

## 인프라 (트라이코큐브 서버 3대)
접속: 계정 `ubuntu`, SSH 포트 **30022**, 외부 IP + pem 키. 상세는 `docs/servers.md`.

| 서버 | 외부 IP | 서비스 | 포트 |
| --- | --- | --- | --- |
| WAS1 | 180.210.89.242 | **프론트엔드** (docker nginx, `web` 계정) — 외부 접속 http/https 정상 | 80, 443 |
| WAS2 | 180.210.78.147 | FastAPI (`adju-care-agent`), LLM 서빙(llama.cpp) | 18000, 8080 |
| DB | 180.210.88.242 | PostgreSQL 16 + pgvector | 15432 |

- **LLM**: `gemma-4-E2B-it-qat-UD-Q4_K_XL.gguf` (llama-server, ctx 8192). `127.0.0.1:8080`에만 바인딩 → WAS2 내부에서만 호출.
- **FastAPI**: 도커 컨테이너 `adju-care-agent_api_1`, 호스트 `0.0.0.0:18000` 노출. OpenAPI: `docs/openapi.json`.
- **DB**: `adjudb`, 계정 `postgres`. 스키마 DDL은 `docs/db-schema.sql`. 임베딩은 BGE-M3 (dense 1024 / sparse 250002).

## API 요약 (ADJU Care API v0.1.0)
- `POST /users` · `GET /users` · `GET|PATCH|DELETE /users/{id}`
- `POST /users/{user_id}/documents` — 보험증권 업로드 (multipart, field: `file`)
- `POST /users/{user_id}/chat` — `{question}` → `{answer, sources[]}`
- `GET /health`
전체 계약: `docs/api-interface.md`, `docs/openapi.json`.

## 이 리포 구조
- `frontend/` — 화면 (Vite + React + TypeScript). 개발 실행: `cd frontend && npm install && npm run dev`
  - `Dockerfile` / `nginx.conf.template` — 배포용 (2단계 빌드 → nginx 서빙 + `/api` 프록시)
- `docs/` — 서버/DB/API 문서 + `deploy.md`(배포 절차·운영 명령어)
- `HANDOFF.md` — 현재 진행 상황 (세션 시작 시 함께 읽기)

## 서버 접속 (로컬 `~/.ssh/config`에 등록됨)
```bash
ssh was     # = was1, 프론트 서버. 접속 시 localhost:8000 → 배포 화면
ssh was2    # FastAPI + LLM. 접속 시 localhost:18000 → Swagger
ssh db      # PostgreSQL.   접속 시 localhost:15432
```
> 화면: **http://180.210.89.242** (외부 접속 가능, https도 지원 — 자체 서명 인증서라 경고 발생)
> WAS1은 NIC 2개(공인 IP가 eth1에 매핑)라 **재부팅 시 라우팅 재설정 필요**.
> 미적용 시 외부 접속이 끊긴다 → `docs/troubleshooting.md` 1번 항목 참고.

## 작업 규칙
- **커밋 시 푸시까지** — 작업이 끝나면 commit에서 멈추지 말고 `git push`까지 완료할 것 (2026-08-31 변경).
  커밋 메시지에 Claude 서명(Co-Authored-By 등)은 넣지 말 것.
- 서버 작업은 읽기 확인 우선. 운영 서비스(WAS2/DB) 재시작·삭제 같은 파괴적 작업은 반드시 사전 확인.
- 포트 개방 여부 확인 시 **연속 스캔 금지** (방화벽 스캔 탐지에 걸려 전부 차단으로 오판됨).
  포트당 1회, 15초 이상 간격. 확실한 검증은 서버에서 `tcpdump` 캡처.
- 비밀번호/pem 키 등 시크릿은 이 리포에 커밋하지 말 것 (`.gitignore` 확인). `docs/servers.md`는 로컬 참고용.
