import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import type { ChatMessage } from "../lib/types";

interface Props {
  userId: number | null;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ChatPanel({ userId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    if (!userId) {
      alert("먼저 우측에서 사용자를 선택하거나 생성하세요.");
      return;
    }

    const userMsg: ChatMessage = { id: uid(), role: "user", content: q };
    const pendingId = uid();
    setMessages((m) => [
      ...m,
      userMsg,
      { id: pendingId, role: "assistant", content: "", pending: true },
    ]);
    setInput("");
    setBusy(true);

    try {
      const res = await api.chat(userId, q);
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? { ...msg, content: res.answer, sources: res.sources, pending: false }
            : msg,
        ),
      );
    } catch (e) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? { ...msg, content: `⚠️ 오류: ${(e as Error).message}`, pending: false }
            : msg,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <section className="chat">
      <header className="chat__header">
        <div className="brand">
          <span className="brand__logo">ADJU</span>
          <span className="brand__tag">AI 금융 부관</span>
        </div>
        <p className="chat__sub">가입한 보험의 보장 내용을 물어보세요.</p>
      </header>

      <div className="chat__scroll" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty">
            <p>예) “목 뒤 종양 수술도 보장되나요?”</p>
            <p>먼저 우측에서 보험증권을 업로드하면 더 정확히 답변해요.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`msg msg--${m.role}`}>
            <div className="msg__bubble">
              {m.pending ? (
                <span className="typing"><i /><i /><i /></span>
              ) : (
                <span className="msg__text">{m.content}</span>
              )}
            </div>
            {m.sources && m.sources.length > 0 && (
              <div className="sources">
                <div className="sources__title">근거 {m.sources.length}건</div>
                {m.sources.map((s, i) => (
                  <details className="source" key={`${s.file_id}-${i}`}>
                    <summary>
                      <span className="source__file">{s.file_name}</span>
                      {s.page_no != null && <span className="source__page">p.{s.page_no}</span>}
                      <span className="source__score">{(s.score * 100).toFixed(0)}%</span>
                    </summary>
                    <p className="source__snippet">{s.snippet}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="composer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={userId ? "질문을 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)" : "우측에서 사용자를 먼저 선택하세요"}
          rows={2}
        />
        <button onClick={send} disabled={busy || !input.trim()}>
          {busy ? "답변 중…" : "전송"}
        </button>
      </div>
    </section>
  );
}
