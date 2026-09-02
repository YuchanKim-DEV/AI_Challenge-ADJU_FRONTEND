import { useState } from "react";
import { api } from "../lib/api";

interface Props {
  userId: number;
  /** 보험정보 입력 완료 시 챗봇에 알림 */
  onUploaded: (summary: string) => void;
}

interface HistoryItem {
  id: number;
  time: string;
  text: string;
}

let seq = 0;

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
  // 이 페이지를 유지하는 동안만 남는 전송 이력 (새로고침하면 초기화)
  const [history, setHistory] = useState<HistoryItem[]>([]);

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
    setHistory((h) => [
      { id: ++seq, time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }), text: body },
      ...h,
    ]);
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

      {history.length > 0 && (
        <div className="hist">
          <div className="hist__head">
            <span>보낸 내역 {history.length}건</span>
            <button className="hist__clear" onClick={() => setHistory([])}>
              지우기
            </button>
          </div>
          {history.map((h) => (
            <details key={h.id} className="hist__item">
              <summary>
                <span className="hist__time">{h.time}</span>
                <span className="hist__preview">{h.text.split("\n")[0]}</span>
              </summary>
              <pre>{h.text}</pre>
            </details>
          ))}
          <p className="hist__note">※ 새로고침하면 이 목록은 사라집니다.</p>
        </div>
      )}
    </div>
  );
}
