import { useEffect, useState } from "react";
import ChatPanel from "./components/ChatPanel";
import SidePanel from "./components/SidePanel";
import { api } from "./lib/api";

export default function App() {
  const [userId, setUserId] = useState<number | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    api.health().then(setOnline);
  }, []);

  return (
    <div className="layout">
      {/* 좌측: 챗봇 */}
      <ChatPanel userId={userId} />
      {/* 우측: 사용자 / 문서 */}
      <div className="right">
        <div className={`status status--${online ? "up" : online === false ? "down" : "unknown"}`}>
          API {online == null ? "확인 중…" : online ? "온라인" : "오프라인 (.env의 VITE_API_TARGET / SSH 포워딩 확인)"}
        </div>
        <SidePanel userId={userId} onSelectUser={setUserId} />
      </div>
    </div>
  );
}
