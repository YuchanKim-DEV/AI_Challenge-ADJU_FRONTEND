import type {
  ChatResponse,
  DocumentUploadResponse,
  UserCreate,
  UserRead,
} from "./types";

const BASE = (import.meta.env.VITE_API_BASE as string) || "/api";

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

  async listUsers(): Promise<UserRead[]> {
    return handle<UserRead[]>(await fetch(`${BASE}/users`));
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
