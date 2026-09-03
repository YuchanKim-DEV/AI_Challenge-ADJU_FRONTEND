// ADJU Care API v0.1.0 스키마 (docs/openapi.json 기준)

export interface UserCreate {
  name: string;
  birth_date: string; // YYYY-MM-DD
  phone: string; // 숫자 11자리
  email?: string | null;
  monthly_income?: number | null;
  annual_income?: number | null;
  other_income?: number | null;
}

// 주의: 서버는 소득 필드를 Decimal → 문자열로 직렬화해서 돌려준다.
//       (UserCreate는 숫자로 보내도 되지만, UserRead는 문자열로 온다)
//       계산에 쓸 땐 반드시 Number(...)로 변환할 것.
export interface UserRead extends Omit<UserCreate, "monthly_income" | "annual_income" | "other_income"> {
  monthly_income?: string | null;
  annual_income?: string | null;
  other_income?: string | null;
  id: number;
  create_time: string;
  update_time: string;
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  status: string;
}

export interface Source {
  file_id: string;
  chunk_id: number;
  file_name: string;
  page_no?: number | null;
  snippet: string;
  score: number;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  answer: string;
  sources?: Source[];   // 서버 스키마상 optional
  history?: ChatTurn[];
}

// 프론트 내부 채팅 메시지 모델
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  pending?: boolean;
}
