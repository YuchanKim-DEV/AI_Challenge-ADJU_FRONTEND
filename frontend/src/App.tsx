import { useEffect, useState } from "react";
import ApiConsole from "./components/ApiConsole";
import ChatPanel from "./components/ChatPanel";
import SidePanel from "./components/SidePanel";
import { api } from "./lib/api";

type Tab = "panel" | "console";

export default function App() {
  const [userId, setUserId] = useState<number | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("panel");

  useEffect(() => {
    api.health().then(setOnline);
  }, []);

  return (
    <div className="layout">
      {/* 좌측: 챗봇 */}
      <ChatPanel userId={userId} />

      {/* 우측: 사용자·문서 / API 콘솔 */}
      <div className="right">
        <div className={`status status--${online ? "up" : online === false ? "down" : "unknown"}`}>
          API {online == null ? "확인 중…" : online ? "온라인" : "오프라인 (.env의 VITE_API_TARGET / SSH 포워딩 확인)"}
        </div>

        <div className="tabs">
          <button className={tab === "panel" ? "tab tab--on" : "tab"} onClick={() => setTab("panel")}>
            사용자 · 문서
          </button>
          <button className={tab === "console" ? "tab tab--on" : "tab"} onClick={() => setTab("console")}>
            API 콘솔
          </button>
        </div>

        {tab === "panel" ? (
          <SidePanel userId={userId} onSelectUser={setUserId} />
        ) : (
          <ApiConsole />
        )}
      </div>
    </div>
  );
}
