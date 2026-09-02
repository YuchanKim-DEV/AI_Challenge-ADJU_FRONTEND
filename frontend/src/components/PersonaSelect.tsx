export interface Persona {
  id: number;
  name: string;
  age: number;
  tagline: string;
  detail: string;
  emoji: string;
  /** 로딩 화면에서 서버에 등록하는 기존 가입 보험 내용 */
  baseline: string;
}

// id는 서버 users 테이블의 실제 id (2026-09-02 생성). 서버 데이터가 바뀌면 함께 수정할 것.
export const PERSONAS: Persona[] = [
  {
    id: 20,
    name: "홍길동",
    age: 23,
    emoji: "🧑‍💻",
    tagline: "부모님이 들어준 보험, 내용을 모른다",
    detail:
      "어릴 때 부모님이 가입해 준 자녀보험이 있지만 어떤 보장이 있는지 모릅니다. 수술을 앞두고 보장 여부를 확인하려 합니다.",
    baseline: `홍길동(23세, 2003-05-14생)님의 가입 보험 내역
월 소득 220만원 / 보유 증권 1건 / 월 보험료 45,000원

[삼성생명 - 삼성 어린이보험]
증권번호 SS-2008-CH-0231, 계약일 2008-03-01, 계약자 부모, 월 보험료 45,000원
- 수술비특약: 질병/재해 수술 1회당 100만원 한도.
  보장기간 2008-03-01 ~ 2025-12-31. 현재 만료되어 보장되지 않음.
- 질병진단비특약: 질병 진단 확정 시 1회 300만원 지급. 현재 유효.
- 사망/후유장해특약: 사망 또는 80% 이상 후유장해 시 5,000만원 지급. 현재 유효.

[보장 요약]
- 사망/후유장해: 보장 있음 (5,000만원)
- 질병: 보장 있음 (300만원)
- 입원/수술: 보장 없음 (수술비특약이 2025년 12월 만료됨)
- 실손의료비: 보장 없음
- 운전자: 보장 없음`,
  },
  {
    id: 21,
    name: "김순자",
    age: 68,
    emoji: "👵",
    tagline: "보험이 많은데 뭘 보장받는지 헷갈린다",
    detail:
      "여러 보험사에 6건이 가입되어 있습니다. 중복 가입은 없는지, 간병 보장은 있는지 확인하려 합니다.",
    baseline: `김순자(68세, 1958-02-10생)님의 가입 보험 내역
월 소득 180만원 / 보험사 4곳 / 보유 증권 5건 / 월 보험료 합계 385,000원 (소득 대비 21.4%)

[삼성생명 - 삼성 종신보험] 계약일 1995-06-01, 월 120,000원
- 종신보장 주계약: 사망 시 5,000만원. 유효.
- 암진단비특약: 암 진단 확정 시 1회 2,000만원. 유효.

[교보생명 - 교보 실버보장보험] 계약일 2001-09-15, 월 65,000원
- 재해후유장해특약: 재해로 인한 후유장해 시 지급률에 따라 최대 3,000만원. 유효.

[현대해상 - 현대 건강보험] 계약일 2010-04-20, 월 88,000원
- 수술비특약: 질병/재해 수술 1회당 500만원 한도. 유효.
- 암진단비특약: 암 진단 시 2,000만원. 삼성생명 암진단비와 중복 가입 상태.

[DB손해보험 - DB 실손의료비보험] 계약일 2015-11-01, 월 62,000원
- 실손의료비특약: 실제 부담 의료비의 90%, 연간 5,000만원 한도. 유효.

[KB손해보험 - KB 상해보험] 계약일 2018-02-10, 월 50,000원
- 상해사망특약: 상해로 인한 사망 시 2,000만원. 유효.

[보장 요약]
- 사망/후유장해: 보장 있음 (합계 8,000만원, 삼성생명·교보생명)
- 질병(암 등): 보장 있음 (합계 4,000만원, 삼성생명·현대해상 중복 가입)
- 입원/수술: 보장 있음 (500만원, 현대해상)
- 실손의료비: 보장 있음 (DB손해보험)
- 간병: 보장 없음. 간병인 사용이나 간병비 관련 특약이 하나도 없음.`,
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
