import { formatWon, type InsuranceProfile } from "../lib/insurance";

interface Props {
  profile: InsuranceProfile | null;
  loading: boolean;
  mocked: boolean;
}

export default function CoveragePanel({ profile, loading, mocked }: Props) {
  if (loading) return <div className="side"><p className="hint">보험정보 불러오는 중…</p></div>;
  if (!profile) return <div className="side"><p className="hint">사용자를 선택하면 가입 보험정보가 표시됩니다.</p></div>;

  const { user, summary, coverage_ontology, policies } = profile;
  const gaps = coverage_ontology.filter((c) => !c.has_coverage);

  return (
    <div className="side">
      {mocked && (
        <p className="hint mock-note">
          ※ 보험정보 API 미배포 상태로 <b>샘플 데이터</b>를 표시 중입니다.
        </p>
      )}

      {/* 가입 요약 */}
      <div className="side__block">
        <h2>{user.name} ({user.age}세)</h2>
        <div className="stat">
          <div><span>보험사</span><b>{summary.company_count}곳</b></div>
          <div><span>보유 증권</span><b>{summary.policy_count}건</b></div>
          <div><span>월 보험료</span><b>{summary.monthly_premium_total.toLocaleString()}원</b></div>
          <div>
            <span>소득 대비</span>
            <b className={summary.premium_to_income_ratio >= 15 ? "warn" : ""}>
              {summary.premium_to_income_ratio}%
            </b>
          </div>
        </div>
        {summary.premium_to_income_ratio >= 15 && (
          <p className="hint">월 소득의 {summary.premium_to_income_ratio}%를 보험료로 지출 중입니다. 중복 보장 점검이 필요할 수 있습니다.</p>
        )}
      </div>

      {/* 보장 현황 */}
      <div className="side__block">
        <h2>보장 현황</h2>
        {coverage_ontology.map((c) => (
          <div key={c.category_code} className={`cov ${c.has_coverage ? "cov--on" : "cov--off"}`}>
            <div className="cov__head">
              <span className="cov__mark">{c.has_coverage ? "✓" : "✕"}</span>
              <span className="cov__name">{c.category_name}</span>
              <span className="cov__amt">{c.has_coverage ? formatWon(c.total_amount) : "미보장"}</span>
            </div>
            {c.policy_names.length > 0 && (
              <div className="cov__from">
                {c.policy_names.join(" · ")}
                {c.policy_names.length > 1 && <span className="cov__dup">중복</span>}
              </div>
            )}
          </div>
        ))}
        {gaps.length > 0 && (
          <p className="hint">
            부족한 보장 {gaps.length}건: {gaps.map((g) => g.category_name).join(", ")}
          </p>
        )}
      </div>

      {/* 보유 증권 */}
      <div className="side__block">
        <h2>보유 증권 {policies.length}건</h2>
        {policies.map((p) => (
          <details key={p.policy_id} className="pol">
            <summary>
              <span className="pol__co">{p.company_name}</span>
              <span className="pol__nm">{p.policy_name}</span>
              <span className="pol__fee">{p.monthly_premium.toLocaleString()}원</span>
            </summary>
            <div className="pol__meta">
              증권번호 {p.policy_number} · 계약일 {p.contract_date} · 계약자 {p.policyholder_relation}
            </div>
            {p.coverages.map((cv) => (
              <div key={cv.coverage_id} className={`rider ${cv.computed_status === "expired" ? "rider--exp" : ""}`}>
                <div className="rider__head">
                  <span>{cv.rider_name}</span>
                  <span className="rider__amt">{formatWon(cv.coverage_amount)}</span>
                  {cv.computed_status === "expired" && <span className="badge--exp">만료</span>}
                </div>
                <div className="rider__cond">{cv.coverage_condition}</div>
                <div className="rider__term">
                  {cv.coverage_start_date} ~ {cv.coverage_end_date ?? "만기 없음"}
                  {cv.source && <span className="rider__src"> · {cv.source.clause}</span>}
                </div>
              </div>
            ))}
          </details>
        ))}
      </div>
    </div>
  );
}
