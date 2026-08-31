# ADJU — AI 금융 부관

가입한 보험상품·증권 내용을 기반으로 대화형 질의응답을 제공하는 AI 서비스.
2026 금융 AI Challenge 출품작 (Team ADJU).

- 프로젝트 지침/컨텍스트: **[CLAUDE.md](CLAUDE.md)** (Claude Code가 자동 로드)
- 현재 진행 상황: **[HANDOFF.md](HANDOFF.md)**
- 문서: [docs/](docs/) — 서버 접속, DB 스키마, API 명세

## 프론트엔드 실행
```bash
cd frontend
npm install
# .env 에서 API 접근 방식 설정 (기본: dev 프록시 /api → localhost:18000)
# 서버 API(18000)가 외부 비개방이면 별도 터미널에서 SSH 포워딩:
#   ssh -i ~/Downloads/트라이코큐브_펨키_extracted/트라이코큐브/tricocube-was2-key.pem \
#       -p 30022 -L 18000:localhost:18000 ubuntu@180.210.78.147
npm run dev    # http://localhost:5173
```

## 구조
```
ADJU/
├─ CLAUDE.md        # Claude Code 프로젝트 지침 (팀/서버/DB/API/규칙)
├─ HANDOFF.md       # 진행 상황
├─ docs/            # servers.md, db-schema.sql, api-interface.md, openapi.json
└─ frontend/        # Vite + React + TS (좌측 챗봇 + 우측 사용자/문서)
```

## 화면 개요
- **좌측**: 챗봇 — 질문 입력, 답변(+근거 sources) 표시, 로딩 인디케이터
- **우측**: 사용자 선택/생성, 보험증권 업로드, API 상태 표시

> 팀: 최별규(PM) · 송지섭(AI) · 김유찬(DevOps/화면)
> 마감: 2026-09-07 · 서버 접속 가능: ~2026-12-31
