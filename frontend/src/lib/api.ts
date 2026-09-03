import type {
  ChatResponse,
  ChatTurn,
  DocumentUploadResponse,
  UserCreate,
  UserRead,
} from "./types";

export const API_BASE = (import.meta.env.VITE_API_BASE as string) || "/api";
const BASE = API_BASE;

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = typeof body?.detail === "string" ? body.detail : JSON.stringify(body?.detail ?? body);
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status} ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  async listUsers(skip = 0, limit = 100): Promise<UserRead[]> {
    return handle<UserRead[]>(await fetch(`${BASE}/users?skip=${skip}&limit=${limit}`));
  },

  async getUser(userId: number): Promise<UserRead> {
    return handle<UserRead>(await fetch(`${BASE}/users/${userId}`));
  },

  async updateUser(userId: number, patch: Partial<UserCreate>): Promise<UserRead> {
    return handle<UserRead>(
      await fetch(`${BASE}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    );
  },

  async deleteUser(userId: number): Promise<void> {
    const res = await fetch(`${BASE}/users/${userId}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  },

  async createUser(payload: UserCreate): Promise<UserRead> {
    return handle<UserRead>(
      await fetch(`${BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  },

  async uploadDocument(userId: number, file: File): Promise<DocumentUploadResponse> {
    const form = new FormData();
    form.append("file", file);
    return handle<DocumentUploadResponse>(
      await fetch(`${BASE}/users/${userId}/documents`, {
        method: "POST",
        body: form,
      }),
    );
  },

  /** 보험정보 텍스트 반영 (전용 엔드포인트) */
  async updateInsuranceText(userId: number, text: string): Promise<{ message?: string }> {
    return handle<{ message?: string }>(
      await fetch(`${BASE}/users/${userId}/insurance-summary/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }),
    );
  },

  /** 이전 대화(history)를 함께 보내 맥락을 유지한다. */
  async chat(userId: number, question: string, history: ChatTurn[] = []): Promise<ChatResponse> {
    return handle<ChatResponse>(
      await fetch(`${BASE}/users/${userId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      }),
    );
  },

  /** 가입 보험 요약 조회 */
  async getInsuranceSummary(userId: number): Promise<unknown> {
    return handle<unknown>(await fetch(`${BASE}/users/${userId}/insurance-summary`));
  },

  /** 대화 이력 초기화 */
  async resetChat(userId: number): Promise<void> {
    await fetch(`${BASE}/users/${userId}/chat`, { method: "DELETE" });
  },
};
