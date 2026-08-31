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

export interface UserRead extends UserCreate {
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

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

// 프론트 내부 채팅 메시지 모델
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  pending?: boolean;
}
