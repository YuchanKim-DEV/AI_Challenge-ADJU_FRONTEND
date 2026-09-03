#!/bin/bash
# ADJU 시연 데이터 초기화
#
# 리허설·시연 중 입력한 보험정보가 서버에 누적되면 시나리오 첫 질문부터
# 답변이 달라진다. 이 스크립트로 두 페르소나를 초기 상태로 되돌린다.
#
#   사용법:  ./scripts/reset-demo.sh
#
# 서버에 리셋 API가 추가되면 이 스크립트는 불필요해진다.
set -e

API=http://10.20.10.240:18000

echo "· 보험 데이터 복원 중…"
ssh was2 'C=$(docker ps -q | head -1); docker exec $C python3 -c "
import json
p=\"/app/src/adju_care_agent/api/mock_data/insurance_summary.json\"
b=\"/app/src/adju_care_agent/api/mock_data/insurance_summary_backup.json\"
cur=json.load(open(p)); bak=json.load(open(b))
for k in [\"1\",\"2\"]: cur[k]=bak[k]
json.dump(cur, open(p,\"w\"), ensure_ascii=False, indent=2)
"'

echo "· 대화 이력 삭제 중…"
ssh was "for u in 1 2; do curl -s -X DELETE $API/users/\$u/chat -o /dev/null; done"

echo "· 확인"
ssh was "for u in 1 2; do curl -s --max-time 20 $API/users/\$u/insurance-summary | python3 -c \"
import sys,json
d=json.load(sys.stdin)
xs=[c for c in d['coverage_ontology'] if c['category_code'] in {'SURGERY','CAREGIVING'}]
mark=lambda c: ('보장' if c['has_coverage'] else '미보장')
print('   ', d['user']['name'], '증권', d['summary']['policy_count'], '건 / 변경이력', len(d.get('change_log') or []), '건 |',
      ', '.join(f\\\"{c['category_name']} {mark(c)}\\\" for c in xs))
\"; done"

echo
echo "기대값:  홍길동 증권 1건 · 변경이력 0건 · 입원/수술 미보장"
echo "         김순자 증권 5건 · 변경이력 0건 · 간병 미보장"
echo
echo "초기화 완료. https://ins.tricocube.com 에서 Cmd+Shift+R 로 새로고침하세요."
