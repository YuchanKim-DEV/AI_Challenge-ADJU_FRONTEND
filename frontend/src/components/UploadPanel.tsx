import { useState } from "react";
import { api } from "../lib/api";
import type { Persona } from "./PersonaSelect";

interface Props {
  persona: Persona;
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
현대해상 수술비 보장보험 신규 가입
- 수술비특약: 수술 1회당 300만원
- 계약일 2026-09-03, 만기 없음

※ 계약일(가입일)을 꼭 함께 적어주세요.
   날짜가 없으면 반영에 실패할 수 있습니다.`;

/**
 * 입력 텍스트에 날짜가 있는지 확인.
 * 서버가 날짜를 추출하지 못하면 빈 값으로 저장되어 조회가 실패하므로,
 * 보내기 전에 사용자에게 경고한다.
 */
function hasDate(text: string): boolean {
  return [
    /\d{4}\s*[-./]\s*\d{1,2}\s*[-./]\s*\d{1,2}/, // 2026-09-03, 2026.9.3, 2026/09/03
    /\d{4}\s*년\s*\d{1,2}\s*월/, // 2026년 9월
    /\d{2}\s*[-./]\s*\d{1,2}\s*[-./]\s*\d{1,2}/, // 26-09-03
  ].some((re) => re.test(text));
}

/** 우측 패널 — 보험정보 직접 입력 */
export default function UploadPanel({ persona, onUploaded }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // 날짜 없이 보내겠다고 한 번 더 확인했는지
  const [dateConfirmed, setDateConfirmed] = useState(false);
  // 이 페이지를 유지하는 동안만 남는 전송 이력 (새로고침하면 초기화)
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const dateMissing = text.trim().length > 0 && !hasDate(text);

  function update(v: string) {
    setText(v);
    setMsg(null);
    setErr(null);
    setDateConfirmed(false);
  }

  function applyPreset(preset: string) {
    update(preset);
  }

  async function send() {
    const body = text.trim();
    if (!body || busy) return;

    // 날짜가 없으면 한 번 경고하고, 다시 누르면 그대로 전송
    if (dateMissing && !dateConfirmed) {
      setDateConfirmed(true);
      setErr("계약일이 없습니다. 날짜를 추가하시거나, 그대로 보내려면 한 번 더 누르세요.");
      return;
    }

    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await api.updateInsuranceText(persona.id, body);
      setMsg(res?.message || "보험정보가 반영되었습니다.");
    } catch (e) {
      setErr(`반영 실패: ${(e as Error).message}`);
      setBusy(false);
      return;
    }
    setHistory((h) => [
      {
        id: ++seq,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        text: body,
      },
      ...h,
    ]);
    onUploaded(body);
    setText("");
    setDateConfirmed(false);
    setBusy(false);
  }

  return (
    <div className="upload">
      <h2>보험정보 입력</h2>
      <p className="hint">
        가입하신 보험을 입력하면 내용을 분석해 대화에 반영합니다.
        <br />
        아래 예시를 눌러 바로 채울 수도 있습니다.
      </p>

      <div className="preset">
        {persona.presets.map((p) => (
          <button key={p.label} className="preset__btn" onClick={() => applyPreset(p.text)}>
            {p.label}
          </button>
        ))}
      </div>

      <textarea
        className="upload__text"
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(e) => update(e.target.value)}
      />

      {dateMissing && !err && (
        <p className="warn-msg">계약일(예: {new Date().toISOString().slice(0, 10)})을 함께 적어주세요.</p>
      )}

      <button onClick={send} disabled={!text.trim() || busy}>
        {busy ? "분석 중…" : dateMissing && dateConfirmed ? "날짜 없이 보내기" : "보내기"}
      </button>

      {err && <p className="err">{err}</p>}
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
