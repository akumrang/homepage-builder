# MVP 이후 우선순위 재정렬

Status: Draft  
Project: homepage  
Last Updated: 2026-06-29

---

## 1. 목적

이 문서는 홈페이지 MVP 첫 구현 이후의 실제 개발 우선순위를 다시 정리한다.

특히 `완성형 샘플 갤러리`가 제품 전략상 중요한 후속 후보로 떠올랐지만, 현재 MVP 다음 즉시 구현 대상은 아니라는 판단을 전제로 한다.

---

## 2. 현재 상태

완료된 핵심 작업:

- `trust-basic-v1` 공개 홈페이지 1종 구현
- `/h/sample-korean-academy` 렌더링
- 상담 문의 폼과 backend 저장
- `/internal` 내부 제작 화면
- 공지 CRUD와 문의 상태 관리
- 콘텐츠 점검 API
- shared 문의 검증 규칙
- 브라우저 기반 1차 시각 QA
- 내부 제작 화면 접근 경계 MVP
- 브라우저 기반 2차 시각 QA
- 자료 누락 체크와 제작 준비도 강화
- 파일럿 시연용 로컬 개발 DB 정리 절차 문서화
- 모바일/데스크톱 브라우저 스크린샷 기반 자동 회귀 테스트
- Prisma migration과 배포 환경 정리 재점검
- 샘플 갤러리 기획 재검토
- 샘플 방향 3종 브리프 작성
- 샘플 카드 문안과 고객 기대 관리 문구 초안 작성
- 묵산 내부 검토용 정적 샘플 자료 구성안 작성
- 내부 정적 샘플 자료 상담 리허설 체크리스트 작성
- 가상 고객 기준 상담 리허설 기록 작성
- 리허설 결과 기반 문구·자료 순서 보완
- 제품 정의와 고객 디자인 권리 원칙 문서화

보류로 확정한 것:

- 완성형 샘플 갤러리 실제 구현
- 고객의 샘플 선택 제출 기능
- 고객 또는 운영자의 제한 편집 기능
- 다중 템플릿 전체 구현
- academy, exam_system2 실제 연동

---

## 3. 우선순위 판단 기준

MVP 이후의 다음 개발은 다음 기준으로 고른다.

1. 외부 노출 시 위험을 줄이는가?
2. 묵산 1인 또는 극소수 운영 가능성을 높이는가?
3. 고객용 자유형 빌더로 오해될 가능성을 낮추는가?
4. 현재 MVP 구조를 안정화하는가?
5. 샘플 갤러리나 다중 템플릿처럼 범위가 커지는 기능보다 앞서야 하는가?

---

## 4. 후보별 판단

| 후보 | 판단 | 이유 |
|---|---|---|
| 내부 제작 화면 접근 경계 MVP | 완료 | `/internal`은 문의와 제작 상태를 다루므로 외부 노출 전 최소 접근 경계가 필요하다. MVP 접근 키와 설계 문서까지 정리했다. |
| 2차 시각 QA | 완료 | 상담 폼 오류/완료 상태, 내부 접근 화면, 내부 탭 전환을 확인했다. 결과는 `docs/21_SECOND_VISUAL_QA_REPORT.md`에 둔다. |
| 자료 누락 체크와 제작 준비도 강화 | 완료 | 내부 제작 공정 자동화의 첫 실무 가치가 크다. 결과는 `docs/22_MATERIAL_READINESS_ENHANCEMENT_REPORT.md`에 둔다. |
| 파일럿 시연용 로컬 개발 DB 정리 절차 | 완료 | 2차 시각 QA에서 과거 테스트 문의가 내부 문의 탭에 남는 문제가 확인되어 시연 전 통제 절차를 문서화했다. |
| 모바일/데스크톱 브라우저 스크린샷 기반 자동 회귀 테스트 | 완료 | `npm.cmd run visual:regression`으로 공개 홈페이지와 내부 제작 화면의 desktop/mobile 캡처를 생성한다. 결과는 `docs/24_SCREENSHOT_REGRESSION_TEST_REPORT.md`에 둔다. |
| Prisma migration과 배포 환경 정리 | 완료 | fresh SQLite DB 기준 local production 리허설과 문서/script 일관성 재점검을 완료했다. 결과는 `docs/25_PRISMA_MIGRATION_DEPLOYMENT_RECHECK_REPORT.md`에 둔다. |
| 완성형 샘플 갤러리 기획 | 완료 | 고객 디자인 권리 2단계인 `방향 선택형`의 범위, 기대 관리 문구, 선택값 처리 원칙을 재검토했다. 결과는 `planning/14_SAMPLE_GALLERY_PLANNING_REVIEW.md`에 둔다. |
| 샘플 방향 3종 브리프 | 완료 | `trust-basic-v1`, `exam-focus-v1`, `small-group-v1` 후보의 목적, 섹션, 자료 요구사항, 금지 문구, 운영 난이도를 정리했다. 결과는 `planning/15_SAMPLE_DIRECTION_BRIEFS.md`에 둔다. |
| 샘플 카드 문안과 고객 기대 관리 문구 | 완료 | 고객에게 보여줄 카드 제목, 설명, 적합/부적합 안내, 선택 전/후 고지 문구를 정리했다. 결과는 `planning/16_SAMPLE_CARD_COPY_AND_EXPECTATION_GUIDE.md`에 둔다. |
| 묵산 내부 검토용 정적 샘플 자료 구성안 | 완료 | 카드 문안, 방향 브리프, 현재 `trust-basic-v1` 샘플을 내부 상담/검토 자료 구조로 묶었다. 결과는 `planning/17_INTERNAL_STATIC_SAMPLE_REVIEW_PACK.md`에 둔다. |
| 내부 정적 샘플 자료 상담 리허설 체크리스트 | 완료 | 실제 고객에게 보여주기 전 내부자가 따라갈 상담 흐름, 질문 대응, 자료 누락, GO/HOLD/NO-GO 기준을 정리했다. 결과는 `planning/18_INTERNAL_SAMPLE_REHEARSAL_CHECKLIST.md`에 둔다. |
| 가상 고객 기준 상담 리허설 기록 | 완료 | 체크리스트를 가상 시나리오에 적용해 상담 흐름, 질문 대응, 자료 누락, HOLD 판정을 기록했다. 결과는 `planning/19_VIRTUAL_CUSTOMER_SAMPLE_REHEARSAL_RECORD.md`에 둔다. |
| 리허설 결과 기반 문구·자료 순서 보완 | 완료 | 고객 공유용 문구를 더 부드럽게 다듬고 자료 순서를 보완했다. 결과는 `planning/20_SAMPLE_REHEARSAL_COPY_SEQUENCE_REVISIONS.md`에 둔다. |
| 묵산 문구 톤 확인 | 현재 1순위 | 고객에게 보일 수 있는 표현이므로 묵산이 직접 톤을 확인해야 한다. |
| 완성형 샘플 갤러리 구현 | 보류 | 템플릿 수, 공개 범위, 고객 선택 제출 여부, 커스터마이징 기대 관리가 정리된 뒤 진행한다. |
| academy/exam_system2 실제 연동 | 보류 | MVP 이후에도 API 경계 설계가 먼저이며 직접 DB 공유는 금지한다. |

---

## 5. 1순위 구현 후보와 현재 상태

이 문서 작성 당시 다음 실제 구현 후보는 Prisma migration과 배포 환경 정리였다.

```text
Prisma migration과 배포 환경 정리
```

현재 상태:

- Prisma schema와 초기 migration은 존재한다.
- `npm.cmd run db:deploy`와 `npm.cmd run rehearse:local-production` 명령은 존재한다.
- Windows 운영 배포 문서와 service/Caddy 보조 script는 마련되어 있다.
- 2026-06-28 재점검에서 fresh SQLite DB 기준 local production 리허설이 통과했다.
- 결과는 `docs/25_PRISMA_MIGRATION_DEPLOYMENT_RECHECK_REPORT.md`에 둔다.

목표:

- 운영 전 DB migration 적용 흐름이 문서와 script에서 같은 순서로 설명되는지 확인한다.
- fresh production SQLite DB에서 `db:deploy`와 backend startup이 충돌하지 않는지 확인한다.
- 배포 문서, README, Windows 보조 script의 실행 순서가 서로 어긋나지 않게 정리한다.
- 샘플 갤러리나 고객 기능 구현으로 범위를 넓히지 않는다.

가능한 최소 구현 범위:

- `backend/prisma/migrations`와 `schema.prisma` 현재 상태 점검
- `db:init`, `db:deploy`, `rehearse:local-production` 역할 분리 재확인
- Windows 배포 Quickstart와 운영 체크리스트의 DB 관련 문구 점검
- 필요한 경우 작은 문서 수정 또는 script guard 보강
- `npm.cmd run verify`, `npm.cmd run rehearse:local-production` 확인

이번 후보에서 하지 않을 것:

- DB 엔진 교체
- academy/exam_system2 직접 DB 공유
- 실제 운영 DB 삭제 또는 reset
- 고객 기능 추가
- 샘플 갤러리 구현

---

## 6. 1순위 후보의 성공 기준

다음이 만족되어 `Prisma migration과 배포 환경 정리`는 MVP 수준에서 완료로 본다.

- fresh production SQLite DB에 `db:deploy`가 성공한다.
- `npm.cmd run rehearse:local-production`이 통과한다.
- README와 운영 배포 문서가 같은 DB 적용 순서를 설명한다.
- 개발 DB용 `db:init`과 운영 DB용 `db:deploy`의 경계가 명확하다.
- 운영 DB reset이나 실제 데이터 삭제 절차를 추가하지 않는다.

PostgreSQL 전환, 관리형 DB 도입, 자동 migration 승인 UI는 후속 단계로 둔다.

---

## 7. 샘플 갤러리의 현재 지위

샘플 갤러리는 삭제된 아이디어가 아니다.

다만 현재 지위는 다음이다.

```text
샘플 갤러리 = 고객 디자인 권리 2단계 후보
현재 MVP 구현 범위 = 아님
다음 즉시 구현 대상 = 아님
먼저 기획 검토 필요
```

샘플 갤러리 기획 재검토 결과는 `planning/14_SAMPLE_GALLERY_PLANNING_REVIEW.md`에 둔다.

재검토 결론은 다음이다.

- 샘플 갤러리는 전략상 유지한다.
- 즉시 구현은 보류한다.
- 샘플 방향 3종 브리프는 `planning/15_SAMPLE_DIRECTION_BRIEFS.md`에 정리했다.
- 샘플 카드 문안과 기대 관리 문구는 `planning/16_SAMPLE_CARD_COPY_AND_EXPECTATION_GUIDE.md`에 정리했다.
- 묵산 내부 검토용 정적 샘플 자료 구성안은 `planning/17_INTERNAL_STATIC_SAMPLE_REVIEW_PACK.md`에 정리했다.
- 내부 정적 샘플 자료 상담 리허설 체크리스트는 `planning/18_INTERNAL_SAMPLE_REHEARSAL_CHECKLIST.md`에 정리했다.
- 가상 고객 기준 상담 리허설 기록은 `planning/19_VIRTUAL_CUSTOMER_SAMPLE_REHEARSAL_RECORD.md`에 정리했다.
- 리허설 결과 기반 문구·자료 순서 보완은 `planning/20_SAMPLE_REHEARSAL_COPY_SEQUENCE_REVISIONS.md`에 정리했다.
- 다음은 묵산의 문구 톤 확인이다.
- 고객 선택은 자동 게시 명령이 아니라 묵산 내부 제작 입력값으로 처리한다.
- 자유형 빌더, 고객별 별도 코드베이스, 검수 없는 게시로 보이는 흐름은 금지한다.

---

## 8. 결론

샘플 갤러리를 바로 만들면 제품 방향은 넓어지지만, 현재 MVP의 운영 안정성은 높아지지 않는다.

따라서 현재 우선순위는 다음 순서로 둔다.

1. 묵산 문구 톤 확인
2. 다중 운영자 접근 제어 고도화 검토
3. academy/exam_system2 API 경계 설계
