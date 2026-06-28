# 자료 누락 체크와 제작 준비도 강화 보고서

Status: Draft
Project: homepage
Date: 2026-06-28

---

## 1. 목적

이 문서는 내부 제작 화면의 콘텐츠 준비도를 고객 자료 접수 기록 양식과 더 직접 연결한 작업을 기록한다.

기존 상태:

- 내부 콘텐츠 탭은 필수/권장 점검 수와 누락 라벨을 보여줬다.
- 그러나 누락 라벨이 고객 자료 요청 패킷의 어떤 항목과 연결되는지 바로 보이지 않았다.
- `MATERIALS_READY` 전환 가능 여부가 점수와 문장 안에만 있어 내부 제작자가 빠르게 판단하기 어려웠다.

이번 보강:

- 각 콘텐츠 점검 항목에 접수 항목명과 재요청 조치를 연결했다.
- API 응답에 `materialGate`를 추가해 `MATERIALS_READY` 전환 가능 여부를 명시했다.
- 내부 화면에 `MATERIALS_READY` 게이트와 필수/권장 재요청 목록을 표시했다.

---

## 2. 구현 범위

변경 파일:

| 파일 | 변경 |
|---|---|
| `backend/src/types.ts` | `ContentReadinessMissingItem`, `ContentReadinessMaterialGate` 타입 추가 |
| `backend/src/contentValidation.ts` | 점검 항목별 접수 항목 매핑과 `materialGate` 계산 추가 |
| `backend/src/smokeTest.ts` | `materialGate`와 `intakeField` 응답 검증 추가 |
| `frontend/src/types.ts` | frontend API 타입 동기화 |
| `frontend/src/components/InternalDashboard.tsx` | 내부 콘텐츠 탭에 전환 게이트와 재요청 목록 표시 |
| `frontend/src/styles.css` | 재요청 목록과 게이트 UI 스타일 추가 |

---

## 3. API 응답 보강

`GET /api/academies/:slug/content-checks` 응답의 `readiness`에 다음 정보가 추가된다.

```ts
materialGate: {
  targetStatus: "MATERIALS_READY";
  canTransition: boolean;
  label: string;
  message: string;
  blockingItems: ContentReadinessMissingItem[];
}
```

필수/권장 요약에는 기존 `missing: string[]`을 유지하면서 `missingItems`를 추가했다.

```ts
missingItems: [
  {
    key: "subjects",
    label: "대표 과목",
    intakeField: "대표 과목 1개 이상",
    action: "홈페이지 첫 화면에 표시할 대표 과목을 고객에게 확인합니다."
  }
]
```

기존 응답 필드를 제거하지 않았으므로 현재 frontend와 smoke test 흐름을 깨지 않는다.

---

## 4. 내부 화면 변화

내부 제작 화면의 `콘텐츠` 탭에서 다음을 볼 수 있다.

- 제작 준비도 점수
- 필수/권장 통과 수
- 다음 조치
- `MATERIALS_READY 전환 가능` 또는 `MATERIALS_READY 보류`
- 필수 누락 재요청 목록
- 권장 보강 재요청 목록
- 각 콘텐츠 체크 카드의 `접수 항목`

의도:

- 내부 제작자가 고객에게 다시 요청할 항목을 바로 읽을 수 있게 한다.
- 점수와 상태만 보고 `MATERIALS_READY`로 잘못 넘기는 일을 줄인다.
- 고객 포털이나 고객 입력 API를 만들지 않고도 첫 파일럿 운영 판단을 돕는다.

---

## 5. 현재 샘플 판정

샘플 학원 `sample-korean-academy` 기준:

```text
content readiness: READY
score: 100
materialGate.canTransition: true
```

즉 현재 seed 기준으로는 필수 자료와 권장 자료가 모두 준비된 상태로 판정된다.

---

## 6. 하지 않은 것

이번 작업에서 하지 않았다.

- 고객 포털
- 고객 계정
- 파일 업로드 UI
- 실제 고객 자료 저장
- 고객 입력 양식 전체 API
- 자유형 홈페이지 편집기
- `MATERIALS_READY` 자동 상태 변경

`materialGate.canTransition`은 전환 가능 여부를 보여줄 뿐, 제작 상태를 자동 변경하지 않는다.

---

## 7. 검증 기준

확인할 것:

- `npm.cmd run typecheck`
- `npm.cmd run verify`
- 내부 콘텐츠 탭에서 `MATERIALS_READY` 게이트 표시
- smoke test에서 `materialGate.canTransition`과 `intakeField` 확인

---

## 8. 다음 작업

다음 1순위는 이 변경분을 커밋하는 것이다.

커밋 후 다음 추천 작업은 파일럿 시연용 로컬 개발 DB 정리 절차를 문서화하는 것이다.

이유:

- 2차 시각 QA에서 로컬 개발 DB에 과거 테스트 문의가 남아 내부 문의 탭이 지저분해지는 문제가 확인됐다.
- 실제 고객 시연 또는 묵산 내부 판정 전에는 통제된 테스트 데이터 상태가 필요하다.
