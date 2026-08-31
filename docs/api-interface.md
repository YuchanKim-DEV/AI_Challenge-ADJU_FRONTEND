# ADJU Care API — 인터페이스 (v0.1.0)

Base URL: `http://<WAS2>:18000` (개발 중엔 SSH 포워딩으로 `http://localhost:18000` 권장)
전체 스펙: `docs/openapi.json` (실서버 `/openapi.json`에서 취득, 2026-08-31)

## Health
- `GET /health` → 200

## Users
- `POST /users` — 사용자 생성
  - body(`UserCreate`): `{ name, birth_date, phone, email?, monthly_income?, annual_income?, other_income? }`
    - `birth_date`: `YYYY-MM-DD` / `phone`: 숫자 11자리
  - 201 → `UserRead`: 위 필드 + `id, create_time, update_time`
- `GET /users` — 목록 → `UserRead[]`
- `GET /users/{user_id}` → `UserRead`
- `PATCH /users/{user_id}` — 부분 수정(`UserUpdate`, 모든 필드 optional)
- `DELETE /users/{user_id}`

## Documents (보험증권 업로드)
- `POST /users/{user_id}/documents` — multipart/form-data
  - field: `file` (바이너리)
  - → `DocumentUploadResponse`: `{ document_id, filename, status }`

## Chat (질의응답)
- `POST /users/{user_id}/chat`
  - body(`ChatRequest`): `{ question: string }`
  - → `ChatResponse`: `{ answer: string, sources: Source[] }`
  - `Source`: `{ file_id, chunk_id, file_name, page_no?, snippet, score }`

## 참고
- 현재 `/chat`은 단발 응답(비스트리밍). 실시간 스트리밍은 추후 SSE 엔드포인트 추가 시 전환.
- LLM(gemma-4-E2B, 8080)은 WAS2 내부에서만 접근 → 프론트는 항상 FastAPI(18000)를 통해 호출.
