import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { UserRead } from "../lib/types";

interface Props {
  userId: number | null;
  onSelectUser: (id: number | null) => void;
}

export default function SidePanel({ userId, onSelectUser }: Props) {
  const [users, setUsers] = useState<UserRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", birth_date: "", phone: "" });
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await api.listUsers());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createUser() {
    if (!form.name || !form.birth_date || !form.phone) {
      setError("이름·생년월일·연락처는 필수입니다.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const u = await api.createUser({
        name: form.name,
        birth_date: form.birth_date,
        phone: form.phone.replace(/\D/g, ""),
      });
      setForm({ name: "", birth_date: "", phone: "" });
      await refresh();
      onSelectUser(u.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!userId) {
      setUploadMsg("먼저 사용자를 선택하세요.");
      return;
    }
    setUploadMsg(`업로드 중… (${file.name})`);
    try {
      const res = await api.uploadDocument(userId, file);
      setUploadMsg(`✅ ${res.filename} — ${res.status}`);
    } catch (err) {
      setUploadMsg(`⚠️ ${(err as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <aside className="side">
      <div className="side__block">
        <div className="side__head">
          <h2>사용자</h2>
          <button className="ghost" onClick={refresh} disabled={loading}>
            {loading ? "…" : "새로고침"}
          </button>
        </div>
        {error && <p className="err">{error}</p>}
        <select
          value={userId ?? ""}
          onChange={(e) => onSelectUser(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">— 사용자 선택 —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} (#{u.id})
            </option>
          ))}
        </select>
      </div>

      <div className="side__block">
        <h2>사용자 생성</h2>
        <input
          placeholder="이름"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="date"
          value={form.birth_date}
          onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
        />
        <input
          placeholder="연락처 (숫자 11자리)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <button onClick={createUser} disabled={creating}>
          {creating ? "생성 중…" : "생성"}
        </button>
      </div>

      <div className="side__block">
        <h2>보험증권 업로드</h2>
        <p className="hint">선택한 사용자에게 문서를 업로드하면 임베딩되어 챗봇 근거로 사용됩니다.</p>
        <input ref={fileRef} type="file" onChange={onUpload} disabled={!userId} />
        {uploadMsg && <p className="upload-msg">{uploadMsg}</p>}
      </div>
    </aside>
  );
}
