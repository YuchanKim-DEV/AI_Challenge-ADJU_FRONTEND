import { useCallback, useEffect, useState } from "react";
import ApiConsole from "./components/ApiConsole";
import ChatPanel from "./components/ChatPanel";
import CoveragePanel from "./components/CoveragePanel";
import InsuranceInput from "./components/InsuranceInput";
import SidePanel from "./components/SidePanel";
import { api } from "./lib/api";
import type { InsuranceProfile } from "./lib/insurance";

type Tab = "coverage" | "panel" | "console";

export default function App() {
  const [userId, setUserId] = useState<number | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("coverage");

  const [profile, setProfile] = useState<InsuranceProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [mocked, setMocked] = useState(false);
  // 보험정보가 갱신되면 값이 올라가고, 챗봇이 이를 감지해 안내 메시지를 띄운다
  const [profileRev, setProfileRev] = useState(0);

  useEffect(() => {
    api.health().then(setOnline);
  }, []);

  const loadProfile = useCallback(async (id: number | null) => {
    if (id == null) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      const { data, mocked } = await api.getInsuranceProfile(id);
      setProfile(data);
      setMocked(mocked);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile(userId);
  }, [userId, loadProfile]);

  function handleUpdated() {
    loadProfile(userId);
    setProfileRev((r) => r + 1);
  }

  return (
    <div className="layout">
      {/* 좌측: 챗봇 + 보험정보 입력 */}
      <div className="left">
        <ChatPanel userId={userId} profileRev={profileRev} />
        <InsuranceInput userId={userId} onUpdated={handleUpdated} />
      </div>

      {/* 우측: 보장현황 / 사용자·문서 / API 콘솔 */}
      <div className="right">
        <div className={`status status--${online ? "up" : online === false ? "down" : "unknown"}`}>
          API {online == null ? "확인 중…" : online ? "온라인" : "오프라인"}
        </div>

        <div className="tabs">
          <button className={tab === "coverage" ? "tab tab--on" : "tab"} onClick={() => setTab("coverage")}>
            보장 현황
          </button>
          <button className={tab === "panel" ? "tab tab--on" : "tab"} onClick={() => setTab("panel")}>
            사용자 · 문서
          </button>
          <button className={tab === "console" ? "tab tab--on" : "tab"} onClick={() => setTab("console")}>
            API
          </button>
        </div>

        {tab === "coverage" && <CoveragePanel profile={profile} loading={profileLoading} mocked={mocked} />}
        {tab === "panel" && <SidePanel userId={userId} onSelectUser={setUserId} />}
        {tab === "console" && <ApiConsole />}
      </div>
    </div>
  );
}
