// 보험정보 조회 API 스키마 (송지섭 님 설계안 기준, 2026-08-31)
// 엔드포인트가 아직 미배포 상태라, 호출 실패 시 목업으로 폴백해 시연이 가능하도록 함.

export interface CoverageSource {
  document_id: number;
  clause: string;
  embedding_id: number;
}

export interface Coverage {
  coverage_id: number;
  category_code: string;
  rider_name: string;
  coverage_amount: number;
  coverage_condition: string;
  coverage_start_date: string;
  coverage_end_date: string | null;
  computed_status: "active" | "expired" | string;
  source?: CoverageSource;
}

export interface Policy {
  policy_id: number;
  company_name: string;
  policy_name: string;
  policy_number: string;
  policyholder_relation: string;
  contract_date: string;
  monthly_premium: number;
  status: string;
  coverages: Coverage[];
}

export interface CoverageCategory {
  category_code: string;
  category_name: string;
  has_coverage: boolean;
  total_amount: number;
  policy_names: string[];
}

export interface InsuranceSummary {
  company_count: number;
  policy_count: number;
  monthly_premium_total: number;
  premium_to_income_ratio: number;
}

export interface InsuranceProfile {
  user: {
    id: number;
    name: string;
    age: number;
    birth_date: string;
    monthly_income: number;
    is_driver: boolean | null;
  };
  summary: InsuranceSummary;
  coverage_ontology: CoverageCategory[];
  policies: Policy[];
}

/** 시연용 목업 — API 배포 전까지 사용 */
export const MOCK_PROFILES: Record<number, InsuranceProfile> = {
  1: {
    user: { id: 1, name: "홍길동", age: 23, birth_date: "2003-05-14", monthly_income: 2200000, is_driver: null },
    summary: { company_count: 1, policy_count: 1, monthly_premium_total: 45000, premium_to_income_ratio: 2.0 },
    coverage_ontology: [
      { category_code: "DEATH_DISABILITY", category_name: "사망/후유장해", has_coverage: true, total_amount: 50000000, policy_names: ["삼성생명"] },
      { category_code: "DISEASE", category_name: "질병", has_coverage: true, total_amount: 3000000, policy_names: ["삼성생명"] },
      { category_code: "SURGERY", category_name: "입원/수술", has_coverage: false, total_amount: 0, policy_names: [] },
      { category_code: "ACTUAL_MEDICAL", category_name: "실손의료비", has_coverage: false, total_amount: 0, policy_names: [] },
      { category_code: "DRIVER", category_name: "운전자", has_coverage: false, total_amount: 0, policy_names: [] },
    ],
    policies: [
      {
        policy_id: 101, company_name: "삼성생명", policy_name: "삼성 어린이보험",
        policy_number: "SS-2008-CH-0231", policyholder_relation: "부모",
        contract_date: "2008-03-01", monthly_premium: 45000, status: "active",
        coverages: [
          { coverage_id: 5001, category_code: "SURGERY", rider_name: "수술비특약", coverage_amount: 1000000, coverage_condition: "질병/재해 수술 1회당 100만원 한도", coverage_start_date: "2008-03-01", coverage_end_date: "2025-12-31", computed_status: "expired", source: { document_id: 12, clause: "제3조(수술비특약의 보장개시일 및 종료일)", embedding_id: 90012 } },
          { coverage_id: 5002, category_code: "DISEASE", rider_name: "질병진단비특약", coverage_amount: 3000000, coverage_condition: "질병 진단 확정 시 1회 지급", coverage_start_date: "2008-03-01", coverage_end_date: null, computed_status: "active", source: { document_id: 12, clause: "제5조(질병진단비의 지급사유)", embedding_id: 90015 } },
          { coverage_id: 5003, category_code: "DEATH_DISABILITY", rider_name: "사망/후유장해특약", coverage_amount: 50000000, coverage_condition: "사망 또는 80% 이상 후유장해 시 지급", coverage_start_date: "2008-03-01", coverage_end_date: null, computed_status: "active", source: { document_id: 12, clause: "제2조(보험금의 지급사유)", embedding_id: 90010 } },
        ],
      },
    ],
  },
  2: {
    user: { id: 2, name: "김순자", age: 68, birth_date: "1958-02-10", monthly_income: 1800000, is_driver: false },
    summary: { company_count: 4, policy_count: 6, monthly_premium_total: 385000, premium_to_income_ratio: 21.4 },
    coverage_ontology: [
      { category_code: "DEATH_DISABILITY", category_name: "사망/후유장해", has_coverage: true, total_amount: 80000000, policy_names: ["삼성생명", "교보생명"] },
      { category_code: "DISEASE", category_name: "질병(암 등)", has_coverage: true, total_amount: 40000000, policy_names: ["삼성생명", "현대해상"] },
      { category_code: "SURGERY", category_name: "입원/수술", has_coverage: true, total_amount: 5000000, policy_names: ["현대해상"] },
      { category_code: "ACTUAL_MEDICAL", category_name: "실손의료비", has_coverage: true, total_amount: 0, policy_names: ["DB손해보험"] },
      { category_code: "CAREGIVING", category_name: "간병", has_coverage: false, total_amount: 0, policy_names: [] },
    ],
    policies: [
      { policy_id: 201, company_name: "삼성생명", policy_name: "삼성 종신보험", policy_number: "SS-1995-LI-1120", policyholder_relation: "본인", contract_date: "1995-06-01", monthly_premium: 120000, status: "active",
        coverages: [
          { coverage_id: 6001, category_code: "DEATH_DISABILITY", rider_name: "종신보장 주계약", coverage_amount: 50000000, coverage_condition: "사망 시 지급", coverage_start_date: "1995-06-01", coverage_end_date: null, computed_status: "active", source: { document_id: 21, clause: "제1조", embedding_id: 91001 } },
          { coverage_id: 6002, category_code: "DISEASE", rider_name: "암진단비특약", coverage_amount: 20000000, coverage_condition: "암 진단 확정 시 1회 지급", coverage_start_date: "1995-06-01", coverage_end_date: null, computed_status: "active", source: { document_id: 21, clause: "제4조", embedding_id: 91004 } },
        ] },
      { policy_id: 202, company_name: "교보생명", policy_name: "교보 실버보장보험", policy_number: "KB-2001-SR-0087", policyholder_relation: "본인", contract_date: "2001-09-15", monthly_premium: 65000, status: "active",
        coverages: [
          { coverage_id: 6003, category_code: "DEATH_DISABILITY", rider_name: "재해후유장해특약", coverage_amount: 30000000, coverage_condition: "재해로 인한 후유장해 발생 시 지급률에 따라 지급", coverage_start_date: "2001-09-15", coverage_end_date: null, computed_status: "active", source: { document_id: 22, clause: "제3조", embedding_id: 91020 } },
        ] },
      { policy_id: 203, company_name: "현대해상", policy_name: "현대 건강보험", policy_number: "HD-2010-HL-3345", policyholder_relation: "본인", contract_date: "2010-04-20", monthly_premium: 88000, status: "active",
        coverages: [
          { coverage_id: 6004, category_code: "SURGERY", rider_name: "수술비특약", coverage_amount: 5000000, coverage_condition: "질병/재해 수술 1회당 500만원 한도", coverage_start_date: "2010-04-20", coverage_end_date: null, computed_status: "active", source: { document_id: 23, clause: "제3조", embedding_id: 91030 } },
          { coverage_id: 6005, category_code: "DISEASE", rider_name: "암진단비특약(중복)", coverage_amount: 20000000, coverage_condition: "암 진단 확정 시 1회 지급 — 삼성생명과 중복 가입", coverage_start_date: "2010-04-20", coverage_end_date: null, computed_status: "active", source: { document_id: 23, clause: "제5조", embedding_id: 91031 } },
        ] },
      { policy_id: 204, company_name: "DB손해보험", policy_name: "DB 실손의료비보험", policy_number: "DB-2015-AM-7789", policyholder_relation: "본인", contract_date: "2015-11-01", monthly_premium: 62000, status: "active",
        coverages: [
          { coverage_id: 6006, category_code: "ACTUAL_MEDICAL", rider_name: "실손의료비특약", coverage_amount: 0, coverage_condition: "실제 부담 의료비의 90%, 연간 5000만원 한도 실비 보장", coverage_start_date: "2015-11-01", coverage_end_date: null, computed_status: "active", source: { document_id: 24, clause: "제2조", embedding_id: 91040 } },
        ] },
      { policy_id: 205, company_name: "KB손해보험", policy_name: "KB 상해보험", policy_number: "KBI-2018-AC-4432", policyholder_relation: "본인", contract_date: "2018-02-10", monthly_premium: 50000, status: "active",
        coverages: [
          { coverage_id: 6007, category_code: "DEATH_DISABILITY", rider_name: "상해사망특약", coverage_amount: 20000000, coverage_condition: "상해로 인한 사망 시 지급", coverage_start_date: "2018-02-10", coverage_end_date: null, computed_status: "active", source: { document_id: 25, clause: "제2조", embedding_id: 91050 } },
        ] },
    ],
  },
};

export function formatWon(v: number): string {
  if (v === 0) return "—";
  if (v >= 100000000) return `${(v / 100000000).toFixed(v % 100000000 === 0 ? 0 : 1)}억원`;
  if (v >= 10000) return `${(v / 10000).toLocaleString()}만원`;
  return `${v.toLocaleString()}원`;
}
