import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Persona } from "./PersonaSelect";

const STEPS = ["가입 보험 조회 중…", "보장 내용 분석 중…", "대화 준비 중…"];

interface Props {
  persona: Persona;
  onDone: () => void;
}

/** 페르소나 선택 후 3초간 보험 조회 로딩 */
export default function LoadingScreen({ persona, onDone }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // 서버가 대화 이력을 보관하므로, 새로 시작할 때 초기화한다.
    // (초기화하지 않으면 새로고침해도 이전 대화가 이어져 시연이 꼬임)
    // 실패해도 화면 흐름은 그대로 진행 (시연 중단 방지)
    api
      .resetChat(persona.id)
      .catch(() => {})
      .finally(() => {
        api.getInsuranceSummary(persona.id).catch(() => {});
      });

    const t1 = setTimeout(() => setStep(1), 1000);
    const t2 = setTimeout(() => setStep(2), 2000);
    const t3 = setTimeout(onDone, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone, persona]);

  return (
    <div className="loading">
      <img className="loading__logo" src="/logo.png" alt="ADJU Care" />
      <div className="loading__emoji">{persona.emoji}</div>
      <div className="loading__name">{persona.name}님의 보험을 찾고 있습니다</div>

      <div className="loading__spinner" />

      <ul className="loading__steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? "done" : i === step ? "now" : ""}>
            <span className="loading__mark">{i < step ? "✓" : i === step ? "•" : "·"}</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
