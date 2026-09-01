import { useState } from "react";
import { api } from "../lib/api";

interface Props {
  userId: number | null;
  onUpdated: () => void;
}

/**
 * 좌측 '보험정보 입력' 영역.
 * 새로 가입한 보험·특약을 텍스트로 입력 → '보험정보 업데이트' 클릭 시 즉시 반영.
 */
export default function InsuranceInput({ userId, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    const body = text.trim();
    if (!body || busy) return;
    if (!userId) {
      setMsg("먼저 사용자를 선택하세요.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await api.updateInsuranceText(userId, body);
      setText("");
      setMsg(res.mocked ? "반영되었습니다. (API 미배포 — 화면에만 적용)" : "보험정보가 반영되었습니다.");
      onUpdated();
    } catch (e) {
      setMsg(`반영 실패: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`insin ${open ? "insin--open" : ""}`}>
      <button className="insin__toggle" onClick={() => setOpen((v) => !v)}>
        <span>보험정보 입력</span>
        <span className="insin__chev">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="insin__body">
          <p className="hint">
            새로 가입한 보험이나 추가한 특약 내용을 자유롭게 입력하세요.
            업데이트하면 챗봇이 바뀐 보장 내용을 기준으로 답변합니다.
          </p>
          <textarea
            placeholder={"예) 현대해상 수술비특약 신규 가입\n수술 1회당 300만원, 2026-09-01 개시, 만기 없음"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
          />
          <button onClick={submit} disabled={busy || !text.trim()}>
            {busy ? "반영 중…" : "보험정보 업데이트"}
          </button>
          {msg && <p className="upload-msg">{msg}</p>}
        </div>
      )}
    </div>
  );
}
