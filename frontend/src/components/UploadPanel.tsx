import { useState } from "react";
import { api } from "../lib/api";

interface Props {
  userId: number;
  /** 보험정보 입력 완료 시 챗봇에 알림 */
  onUploaded: (summary: string) => void;
}

const PLACEHOLDER = `가입하신 보험 내용을 아는 대로 적어주세요.

예시)
삼성생명 어린이보험 (2008년 가입)
- 수술비특약: 수술 1회당 100만원, 2025년 12월 만료
- 질병진단비특약: 진단 시 300만원
월 보험료 45,000원

※ 보험사·상품명·특약명·보장금액·가입시기 중
   기억나는 것만 적어도 됩니다.`;

/** 우측 패널 — 보험정보 직접 입력 */
export default function UploadPanel({ userId, onUploaded }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.updateInsuranceText(userId, body);
      setMsg("보험정보가 반영되었습니다.");
    } catch (e) {
      setMsg(`반영 실패: ${(e as Error).message}`);
      setBusy(false);
      return;
    }
    onUploaded(body);
    setText("");
    setBusy(false);
  }

  return (
    <div className="upload">
      <h2>보험정보 입력</h2>
      <p className="hint">
        가입하신 보험을 입력하면 내용을 분석해 대화에 반영합니다.
        <br />
        형식은 자유롭게, 아는 만큼만 적으셔도 됩니다.
      </p>

      <textarea
        className="upload__text"
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setMsg(null);
        }}
      />

      <button onClick={send} disabled={!text.trim() || busy}>
        {busy ? "분석 중…" : "보내기"}
      </button>

      {msg && <p className="upload-msg">{msg}</p>}
    </div>
  );
}
