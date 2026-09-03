export interface Persona {
  id: number;
  name: string;
  age: number;
  tagline: string;
  detail: string;
  emoji: string;
  /** 시연용 보험정보 입력 프리셋 (검증된 문구) */
  presets: { label: string; text: string }[];
}

/** 오늘 날짜 (YYYY-MM-DD) — 프리셋의 계약일로 사용 */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 서버 users 테이블의 실제 id. 기본 보험 데이터는 서버에 등록되어 있음(2026-09-03).
export const PERSONAS: Persona[] = [
  {
    id: 1,
    name: "홍길동",
    age: 23,
    emoji: "🧑‍💻",
    tagline: "부모님이 들어준 보험, 내용을 모른다",
    detail:
      "어릴 때 부모님이 가입해 준 자녀보험이 있지만 어떤 보장이 있는지 모릅니다. 수술을 앞두고 보장 여부를 확인하려 합니다.",
    presets: [
      {
        label: "수술비특약 가입",
        text: `현대해상 수술비 보장보험 신규 가입
- 수술비특약: 질병/재해 수술 1회당 300만원 한도
- 계약일 ${today()}, 만기 없음
- 월 보험료 32,000원`,
      },
      {
        label: "운전자보험 가입",
        text: `삼성화재 운전자보험 신규 가입
- 벌금 2,000만원, 변호사선임비 500만원
- 계약일 ${today()}, 만기 없음
- 월 보험료 18,000원`,
      },
    ],
  },
  {
    id: 2,
    name: "김순자",
    age: 68,
    emoji: "👵",
    tagline: "보험이 많은데 뭘 보장받는지 헷갈린다",
    detail:
      "여러 보험사에 6건이 가입되어 있습니다. 중복 가입은 없는지, 간병 보장은 있는지 확인하려 합니다.",
    presets: [
      {
        label: "간병인보험 가입",
        text: `KB손해보험 간병인지원보험 신규 가입
- 간병인지원일당특약: 간병인 사용 시 1일 15만원, 연간 180일 한도
- 계약일 ${today()}, 만기 없음
- 월 보험료 48,000원`,
      },
      {
        label: "간병비보험 가입",
        text: `메리츠화재 간병비보장보험 신규 가입
- 간병비특약: 입원 간병비 1일 10만원
- 계약일 ${today()}, 만기 없음
- 월 보험료 35,000원`,
      },
    ],
  },
];

interface Props {
  onSelect: (p: Persona) => void;
}

export default function PersonaSelect({ onSelect }: Props) {
  return (
    <div className="persona">
      <div className="persona__head">
        <img className="persona__logo" src="/logo.png" alt="ADJU Care — 당신의 AI 보험 부관" />
        <p>가입한 보험을 대화로 확인하세요. 체험할 사용자를 선택해 주세요.</p>
      </div>

      <div className="persona__list">
        {PERSONAS.map((p) => (
          <button key={p.id} className="persona__card" onClick={() => onSelect(p)}>
            <div className="persona__emoji">{p.emoji}</div>
            <div className="persona__name">
              {p.name} <span>{p.age}세</span>
            </div>
            <div className="persona__tag">{p.tagline}</div>
            <div className="persona__detail">{p.detail}</div>
            <div className="persona__go">이 사용자로 시작하기 →</div>
          </button>
        ))}
      </div>
    </div>
  );
}
