import { useEffect, useState } from "react";
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
    const t1 = setTimeout(() => setStep(1), 1000);
    const t2 = setTimeout(() => setStep(2), 2000);
    const t3 = setTimeout(onDone, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div className="loading">
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
