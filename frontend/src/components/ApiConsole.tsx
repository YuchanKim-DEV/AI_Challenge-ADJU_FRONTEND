import { useState } from "react";
import { API_BASE } from "../lib/api";

/** 명세서(openapi.json v0.1.0) 기준 8개 엔드포인트 */
type Kind = "none" | "list" | "id" | "idBody" | "body" | "file" | "chat";

interface Endpoint {
  key: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  label: string;
  kind: Kind;
  template?: string;
}

const ENDPOINTS: Endpoint[] = [
  { key: "health", method: "GET", path: "/health", label: "헬스체크", kind: "none" },
  { key: "listUsers", method: "GET", path: "/users", label: "사용자 목록", kind: "list" },
  {
    key: "createUser",
    method: "POST",
    path: "/users",
    label: "사용자 생성",
    kind: "body",
    template: JSON.stringify(
      {
        name: "홍길동",
        birth_date: "1990-01-01",
        phone: "01012345678",
        email: "test@example.com",
        monthly_income: 3000000,
        annual_income: 36000000,
        other_income: 0,
      },
      null,
      2,
    ),
  },
  { key: "getUser", method: "GET", path: "/users/{id}", label: "사용자 조회", kind: "id" },
  {
    key: "patchUser",
    method: "PATCH",
    path: "/users/{id}",
    label: "사용자 수정",
    kind: "idBody",
    template: JSON.stringify({ monthly_income: 4000000 }, null, 2),
  },
  { key: "deleteUser", method: "DELETE", path: "/users/{id}", label: "사용자 삭제", kind: "id" },
  {
    key: "upload",
    method: "POST",
    path: "/users/{id}/documents",
    label: "보험증권 업로드",
    kind: "file",
  },
  { key: "chat", method: "POST", path: "/users/{id}/chat", label: "챗봇 질의", kind: "chat" },
];

interface LogEntry {
  id: number;
  time: string;
  method: string;
  url: string;
  status: number | null;
  ok: boolean;
  ms: number;
  requestBody?: string;
  responseBody: string;
}

let logSeq = 0;

export default function ApiConsole() {
  const [epKey, setEpKey] = useState(ENDPOINTS[0].key);
  const [userIdInput, setUserIdInput] = useState("");
  const [skip, setSkip] = useState("0");
  const [limit, setLimit] = useState("100");
  const [bodyText, setBodyText] = useState(ENDPOINTS[0].template ?? "");
  const [question, setQuestion] = useState("내 보험에서 암 진단비는 얼마인가요?");
  const [file, setFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const ep = ENDPOINTS.find((e) => e.key === epKey)!;
  const needsId = ep.kind === "id" || ep.kind === "idBody" || ep.kind === "file" || ep.kind === "chat";

  function selectEndpoint(key: string) {
    setEpKey(key);
    const next = ENDPOINTS.find((e) => e.key === key)!;
    setBodyText(next.template ?? "");
  }

  function buildUrl(): string {
    let path = ep.path;
    if (needsId) path = path.replace("{id}", userIdInput || "0");
    if (ep.kind === "list") path += `?skip=${skip || 0}&limit=${limit || 100}`;
    return `${API_BASE}${path}`;
  }

  async function run() {
    if (needsId && !userIdInput.trim()) {
      pushLog(ep.method, buildUrl(), null, false, 0, undefined, "user_id를 입력하세요.");
      return;
    }
    if (ep.kind === "file" && !file) {
      pushLog(ep.method, buildUrl(), null, false, 0, undefined, "파일을 선택하세요.");
      return;
    }

    const url = buildUrl();
    const init: RequestInit = { method: ep.method };
    let reqPreview: string | undefined;

    if (ep.kind === "body" || ep.kind === "idBody") {
      try {
        JSON.parse(bodyText); // 형식 검증만 하고 원문 그대로 전송
      } catch {
        pushLog(ep.method, url, null, false, 0, bodyText, "요청 본문이 올바른 JSON이 아닙니다.");
        return;
      }
      init.headers = { "Content-Type": "application/json" };
      init.body = bodyText;
      reqPreview = bodyText;
    } else if (ep.kind === "chat") {
      const payload = JSON.stringify({ question }, null, 2);
      init.headers = { "Content-Type": "application/json" };
      init.body = payload;
      reqPreview = payload;
    } else if (ep.kind === "file" && file) {
      const form = new FormData();
      form.append("file", file);
      init.body = form; // Content-Type은 브라우저가 boundary 포함해 자동 설정
      reqPreview = `multipart/form-data — file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }

    setRunning(true);
    const started = performance.now();
    try {
      const res = await fetch(url, init);
      const ms = Math.round(performance.now() - started);
      const raw = await res.text();
      let pretty = raw;
      try {
        pretty = JSON.stringify(JSON.parse(raw), null, 2);
      } catch {
        /* JSON이 아니면 원문 그대로 */
      }
      pushLog(ep.method, url, res.status, res.ok, ms, reqPreview, pretty || "(본문 없음)");
    } catch (e) {
      const ms = Math.round(performance.now() - started);
      pushLog(ep.method, url, null, false, ms, reqPreview, `네트워크 오류: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  }

  function pushLog(
    method: string,
    url: string,
    status: number | null,
    ok: boolean,
    ms: number,
    requestBody: string | undefined,
    responseBody: string,
  ) {
    setLogs((prev) =>
      [
        {
          id: ++logSeq,
          time: new Date().toLocaleTimeString("ko-KR"),
          method,
          url,
          status,
          ok,
          ms,
          requestBody,
          responseBody,
        },
        ...prev,
      ].slice(0, 20),
    );
  }

  return (
    <div className="console">
      <div className="side__block">
        <div className="side__head">
          <h2>API 콘솔</h2>
          <span className="hint">base: {API_BASE}</span>
        </div>

        <select value={epKey} onChange={(e) => selectEndpoint(e.target.value)}>
          {ENDPOINTS.map((e) => (
            <option key={e.key} value={e.key}>
              {e.method} {e.path} — {e.label}
            </option>
          ))}
        </select>

        <div className="console__url">
          <span className={`method method--${ep.method.toLowerCase()}`}>{ep.method}</span>
          <code>{buildUrl()}</code>
        </div>

        {needsId && (
          <input
            placeholder="user_id (숫자)"
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value.replace(/\D/g, ""))}
          />
        )}

        {ep.kind === "list" && (
          <div className="console__row">
            <input placeholder="skip" value={skip} onChange={(e) => setSkip(e.target.value)} />
            <input placeholder="limit" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </div>
        )}

        {(ep.kind === "body" || ep.kind === "idBody") && (
          <textarea
            className="console__body"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            spellCheck={false}
          />
        )}

        {ep.kind === "chat" && (
          <textarea
            className="console__body"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        )}

        {ep.kind === "file" && (
          <>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <p className="hint">PDF · PNG · JPG · TXT / 최대 20MB</p>
          </>
        )}

        {ep.method === "DELETE" && (
          <p className="err">주의: 삭제는 되돌릴 수 없습니다.</p>
        )}

        <button onClick={run} disabled={running}>
          {running ? "요청 중…" : "요청 보내기"}
        </button>
      </div>

      <div className="side__block">
        <div className="side__head">
          <h2>응답 기록</h2>
          {logs.length > 0 && (
            <button className="ghost" onClick={() => setLogs([])}>
              지우기
            </button>
          )}
        </div>

        {logs.length === 0 && <p className="hint">아직 요청이 없습니다.</p>}

        {logs.map((l) => (
          <details key={l.id} className="log" open={l.id === logs[0].id}>
            <summary>
              <span className={`badge ${l.ok ? "badge--ok" : "badge--fail"}`}>
                {l.status ?? "ERR"}
              </span>
              <span className="log__method">{l.method}</span>
              <span className="log__time">{l.time}</span>
              <span className="log__ms">{l.ms}ms</span>
            </summary>
            <code className="log__url">{l.url}</code>
            {l.requestBody && (
              <>
                <div className="log__label">요청</div>
                <pre>{l.requestBody}</pre>
              </>
            )}
            <div className="log__label">응답</div>
            <pre>{l.responseBody}</pre>
          </details>
        ))}
      </div>
    </div>
  );
}
