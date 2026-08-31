# HANDOFF — 현재 진행 상황

_최종 업데이트: 2026-08-31 (김유찬)_

## ✅ 완료 (인프라/AI — 송지섭)
- **WAS2**: 도커 설치, llama.cpp 설치, LLM 모델 다운·서빙 완료
  - 모델: `gemma-4-E2B-it-qat-UD-Q4_K_XL.gguf` (gemma4-e2b QAT Q4), 포트 8080, 정상 응답
  - WAS2 → DB 요청 전달 테스트 완료, API I/F 작성 완료
- **DB**: pgvector (postgresql + pgvector), 포트 15432, DB `adjudb` 생성
- **FastAPI** 컨테이너 `adju-care-agent` 기동 중 (포트 18000, OpenAPI 노출 확인)

## 🔄 진행 중 (AI — 송지섭)
- API 테스트 중
  - 파일 업로드 부분 미완
  - LLM 사용(연동) 부분 미완

## 🖥️ 화면 개발 (김유찬) — 이 리포에서 시작
- **2026-08-31 스캐폴드 생성**: `frontend/` (Vite + React + TypeScript)
  - 좌측 챗봇 패널 + 우측 사용자/문서 패널 레이아웃
  - 실제 API(`/users`, `/users/{id}/documents`, `/users/{id}/chat`)에 연결
  - 답변 로딩·sources(근거) 표시 UI 포함
- **다음 할 일**
  - [ ] `frontend/.env`의 `VITE_API_BASE`를 실제 접근 경로로 설정 (아래 "API 접근" 참고)
  - [ ] 문서 업로드 → 챗봇 질의 e2e 흐름 실제 서버로 검증
  - [ ] 답변 스트리밍(실시간) — 현재 `/chat`은 단발 응답. SSE 엔드포인트 추가되면 스트리밍 UI로 전환 (송지섭 협의)
  - [ ] 로고(Logo.png) 적용, 디자인 다듬기

## ⚠️ API 접근 관련 (프론트에서 반드시 확인)
- FastAPI(18000)는 WAS2에서 `0.0.0.0` 바인딩이라 외부 IP(180.210.78.147:18000)로 직접 접근 가능할 수 있으나,
  **방화벽 정책상 18000 포트가 외부 개방됐는지 확인 필요.** (SSH 30022만 확인된 상태)
  - 개방 안 됐으면: 개발 중에는 SSH 로컬 포워딩 사용
    `ssh -i <was2.pem> -p 30022 -L 18000:localhost:18000 ubuntu@180.210.78.147`
    → 이후 `VITE_API_BASE=http://localhost:18000`
- LLM(8080)은 `127.0.0.1`에만 바인딩되어 있어 **WAS2 내부에서만** 호출됨(FastAPI 컨테이너가 사용). 프론트는 8080 직접 호출 안 함.

## 문서
- 기획서: `(첨부1) 2026 금융 AI Challenge 공모전 기획서_v2.pdf` (2026-08-31 V2)
- API 명세: `docs/api-interface.md`, `docs/openapi.json`
- DB 스키마: `docs/db-schema.sql`
- 서버 접속: `docs/servers.md`
