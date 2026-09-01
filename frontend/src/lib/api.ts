import type {
  ChatResponse,
  DocumentUploadResponse,
  UserCreate,
  UserRead,
} from "./types";
import { MOCK_PROFILES, type InsuranceProfile } from "./insurance";

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

  /**
   * 가입 보험정보 조회.
   * 엔드포인트가 아직 미배포라 실패 시 목업으로 폴백한다 (시연 가능하도록).
   * 배포되면 fallback 분기만 제거하면 됨.
   */
  async getInsuranceProfile(userId: number): Promise<{ data: InsuranceProfile; mocked: boolean }> {
    try {
      const res = await fetch(`${BASE}/users/${userId}/insurance`);
      if (res.ok) return { data: (await res.json()) as InsuranceProfile, mocked: false };
    } catch {
      /* 네트워크 실패 시에도 폴백 */
    }
    const mock = MOCK_PROFILES[userId] ?? MOCK_PROFILES[1];
    return { data: structuredClone(mock), mocked: true };
  },

  /** 보험정보 텍스트 추가 (좌측 입력 영역 → 업데이트 버튼) */
  async updateInsuranceText(userId: number, text: string): Promise<{ ok: boolean; mocked: boolean }> {
    try {
      const res = await fetch(`${BASE}/users/${userId}/insurance/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) return { ok: true, mocked: false };
    } catch {
      /* 폴백 */
    }
    return { ok: true, mocked: true };
  },

  async chat(userId: number, question: string): Promise<ChatResponse> {
    return handle<ChatResponse>(
      await fetch(`${BASE}/users/${userId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      }),
    );
  },
};
