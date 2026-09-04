import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "../lib/api";
import type { ChatMessage } from "../lib/types";

interface Props {
  userId: number | null;
  /** 증권이 업로드되면 분석 안내 메시지를 대화에 추가한다. */
  uploaded?: { name: string; seq: number } | null;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ChatPanel({ userId, uploaded = null }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // isComposing을 지원하지 않는 브라우저 대비 이중 방어
  const composingRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // 보험정보가 입력되면 분석 중 → 완료 안내를 순차로 보여준다
  useEffect(() => {
    if (!uploaded) return;
    const pendingId = uid();
    setMessages((m) => [
      ...m,
      { id: uid(), role: "user", content: uploaded.name },
      { id: pendingId, role: "assistant", content: "", pending: true },
    ]);
    const t = setTimeout(() => {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? {
                ...msg,
                pending: false,
                content:
                  "입력하신 보험정보를 반영했습니다. 보장 항목과 특약 내용을 확인했어요.\n" +
                  "이 내용을 기준으로 궁금한 점을 물어보세요.",
              }
            : msg,
        ),
      );
    }, 1800);
    return () => clearTimeout(t);
  }, [uploaded]);

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
    // 한글 등 IME 조합 중에는 Enter를 전송으로 처리하지 않는다.
    // (조합 중 전송하면 입력창을 비운 뒤 조합이 확정되어 마지막 글자가 되돌아옴)
    if (e.nativeEvent.isComposing || composingRef.current) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <section className="chat">
      <header className="chat__header">
        <img className="chat__logo" src="/logo.png" alt="ADJU Care" />
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
                <div className="msg__text">
                  {/* LLM 답변에 표·굵게·목록 등 마크다운이 포함되므로 렌더링한다.
                      remarkGfm: GitHub 스타일 표(| --- |) 지원 */}
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ children }) => (
                        <div className="md-table__wrap">
                          <table className="md-table">{children}</table>
                        </div>
                      ),
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
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
          onCompositionStart={() => { composingRef.current = true; }}
          onCompositionEnd={() => { composingRef.current = false; }}
          placeholder="질문을 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)"
          rows={2}
        />
        <button onClick={send} disabled={busy || !input.trim()}>
          {busy ? "답변 중…" : "전송"}
        </button>
      </div>
    </section>
  );
}
