export interface Persona {
  id: number;
  name: string;
  age: number;
  tagline: string;
  detail: string;
  emoji: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 1,
    name: "홍길동",
    age: 23,
    emoji: "🧑‍💻",
    tagline: "부모님이 들어준 보험, 내용을 모른다",
    detail:
      "어릴 때 부모님이 가입해 준 자녀보험이 있지만 어떤 보장이 있는지 모릅니다. 수술을 앞두고 보장 여부를 확인하려 합니다.",
  },
  {
    id: 2,
    name: "김순자",
    age: 68,
    emoji: "👵",
    tagline: "보험이 많은데 뭘 보장받는지 헷갈린다",
    detail:
      "여러 보험사에 6건이 가입되어 있습니다. 중복 가입은 없는지, 간병 보장은 있는지 확인하려 합니다.",
  },
];

interface Props {
  onSelect: (p: Persona) => void;
}

export default function PersonaSelect({ onSelect }: Props) {
  return (
    <div className="persona">
      <div className="persona__head">
        <div className="brand__logo">ADJU</div>
        <h1>AI 금융 부관</h1>
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
