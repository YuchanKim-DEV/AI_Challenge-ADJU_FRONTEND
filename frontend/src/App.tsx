import { useCallback, useState } from "react";
import ChatPanel from "./components/ChatPanel";
import LoadingScreen from "./components/LoadingScreen";
import PersonaSelect, { type Persona } from "./components/PersonaSelect";
import UploadPanel from "./components/UploadPanel";

type Screen = "persona" | "loading" | "chat";

export default function App() {
  const [screen, setScreen] = useState<Screen>("persona");
  const [persona, setPersona] = useState<Persona | null>(null);
  // 업로드된 문서를 챗봇에 알리기 위한 신호
  const [uploaded, setUploaded] = useState<{ name: string; seq: number } | null>(null);

  const goChat = useCallback(() => setScreen("chat"), []);

  function selectPersona(p: Persona) {
    setPersona(p);
    setUploaded(null);
    setScreen("loading");
  }

  function reset() {
    setPersona(null);
    setUploaded(null);
    setScreen("persona");
  }

  function handleUploaded(name: string) {
    setUploaded((prev) => ({ name, seq: (prev?.seq ?? 0) + 1 }));
  }

  // 1. 페르소나 선택
  if (screen === "persona") return <PersonaSelect onSelect={selectPersona} />;

  // 2. 보험 조회 로딩 (3초)
  if (screen === "loading" && persona) return <LoadingScreen persona={persona} onDone={goChat} />;

  // 3. 채팅 (두 페르소나 공용)
  if (!persona) return null;
  return (
    <div className="layout">
      <div className="left">
        <div className="topbar">
          <button className="topbar__back" onClick={reset}>
            ← 사용자 변경
          </button>
          <div className="topbar__who">
            <span className="topbar__emoji">{persona.emoji}</span>
            {persona.name} <span className="topbar__age">{persona.age}세</span>
          </div>
        </div>
        <ChatPanel userId={persona.id} uploaded={uploaded} />
      </div>

      <div className="right">
        <UploadPanel persona={persona} onUploaded={handleUploaded} />
      </div>
    </div>
  );
}
