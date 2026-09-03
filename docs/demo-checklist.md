# 시연 체크리스트

> 시연·리허설 **직전에 반드시 1회 실행**할 것.
> 리허설 때 입력한 보험정보가 서버에 누적되어, 초기화하지 않으면
> 시나리오 첫 질문부터 답변이 달라진다.

## 1. 데이터 초기화 (필수)

```bash
ssh was2
C=$(docker ps -q | head -1)
docker exec $C python3 -c "
import json
p='/app/src/adju_care_agent/api/mock_data/insurance_summary.json'
b='/app/src/adju_care_agent/api/mock_data/insurance_summary_backup.json'
cur=json.load(open(p)); bak=json.load(open(b))
for k in ['1','2']: cur[k]=bak[k]
json.dump(cur, open(p,'w'), ensure_ascii=False, indent=2)
print('복원 완료')
"
```

대화 이력도 함께 초기화(페르소나 선택 시 자동 호출되지만 수동으로도 가능):
```bash
ssh was 'for u in 1 2; do curl -s -X DELETE http://10.20.10.240:18000/users/$u/chat -o /dev/null; done'
```

> 지섭님이 **페르소나 선택 시 자동 초기화**를 적용하면 이 절차는 불필요해진다.

## 2. 초기 상태 확인

```bash
ssh was 'B=http://10.20.10.240:18000
for u in 1 2; do curl -s $B/users/$u/insurance-summary | python3 -c "
import sys,json;d=json.load(sys.stdin)
xs=[c for c in d[\"coverage_ontology\"] if c[\"category_code\"] in {\"SURGERY\",\"CAREGIVING\"}]
print(d[\"user\"][\"name\"], \"증권\", d[\"summary\"][\"policy_count\"], \"건, 변경\", len(d.get(\"change_log\") or []), \"건\")"
done'
```

**기대값**
```
홍길동  증권 1건, 변경 0건   (입원/수술 미보장)
김순자  증권 5건, 변경 0건   (간병 미보장)
```
변경 이력이 0건이 아니면 초기화가 안 된 것.

## 3. 브라우저 준비

- 주소: **https://ins.tricocube.com**
- **강력 새로고침** (`Cmd+Shift+R`) — 캐시 때문에 이전 화면이 뜨는 경우가 있음

---

## 시연 진행 순서

### 시나리오 1 — 청년 (홍길동 23세)
1. 홍길동 카드 선택 → 로딩 3초
2. 질문: **"목 뒤 종양 수술을 받을 예정인데 수술비 보장을 받을 수 있어?"**
   → 수술비특약이 2025-12-31 만료되어 보장 안 됨을 안내
3. 우측 **[수술비특약 가입]** 프리셋 버튼 클릭 → **보내기**
4. 질문: **"그럼 지금은 수술비 보장이 어떻게 달라졌어?"**
   → "이전 보장 없음 → 3,000,000원 보장(현대해상)" 대비 설명

### 시나리오 2 — 노년 (김순자 68세)
1. 상단 **← 사용자 변경** → 김순자 선택 (대화 자동 초기화)
2. 질문: **"내 보험 중에서 간병인을 사용할 때 보장받을 수 있는 보험이 있어?"**
   → 간병 보장 없음 안내
3. 우측 **[간병인보험 가입]** 프리셋 클릭 → **보내기**
4. 질문: **"새로 가입한 보험까지 포함하면 간병비 보장이 어떻게 달라졌어?"**
   → "이전 보장 없음 → 1일 15만원, 연간 180일 한도" 대비 설명

---

## 주의사항

- **보험정보는 프리셋 버튼 사용을 권장.** 자유 입력 시 서버가 날짜를 추출하지 못하면
  빈 값이 저장되어 조회가 영구적으로 실패한다(`docs/troubleshooting.md` 참고).
- 계약일이 없으면 보내기 버튼이 비활성화된다. `계약일 2026-09-03` 형식이 가장 안정적.
- 보험과 무관한 내용을 입력하면 안내 팝업이 뜨고 전송되지 않는다.
- 답변은 평균 3초, 길면 10초 이상 걸릴 수 있다.
- 실제 개인정보는 입력하지 말 것 (API 무인증 상태).

## 검증 이력

2026-09-03 실서버(https://ins.tricocube.com) 브라우저 전 구간 테스트 완료.
시나리오 1·2번 모두 기획서대로 동작 확인.
