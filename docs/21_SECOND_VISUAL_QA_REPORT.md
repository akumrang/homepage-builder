# 2차 시각 QA 보고서

Status: Draft
Project: homepage
Date: 2026-06-28
Scope: `/h/sample-korean-academy`, `/internal`, 상담 폼 오류/완료 상태

---

## 1. 목적

이 문서는 첫 파일럿 전 2차 시각 QA 결과를 기록한다.

1차 QA가 공개 홈페이지와 내부 화면의 기본 레이아웃을 확인했다면, 이번 2차 QA는 실제 사용 상태를 더 직접적으로 확인했다.

확인 범위:

- 공개 홈페이지 desktop/mobile 전체 화면
- 모바일 상담 폼 오류 상태
- 모바일 상담 폼 접수 완료 상태
- `/internal` 접근 키 입력 화면
- `/internal` 상태, 콘텐츠, 문의 탭 전환
- 내부 화면 desktop/mobile 가로 overflow

---

## 2. 실행 환경

실행 서버:

- frontend: `http://127.0.0.1:5175`
- backend: `http://127.0.0.1:4200`

실행 방식:

- Chrome headless + Chrome DevTools Protocol
- viewport 명시 후 스크린샷 캡처
- DOM 기준 `clientWidth`, `scrollWidth`, overflow 요소 수집
- QA용 더미 상담 문의 1건 제출

주의:

- 제출한 상담 문의는 실제 개인정보가 아닌 QA용 더미 데이터다.
- 로컬 개발 DB에는 이전 테스트 문의도 남아 있어 내부 문의 탭 캡처에 함께 보인다.
- 실제 시연 전에는 개발 DB를 정리하거나 통제된 테스트 데이터로 맞추는 것이 좋다.

---

## 3. 캡처 파일

| 화면 | 파일 |
|---|---|
| 공개 홈페이지 desktop 전체 | `docs/visual-qa/screenshots/second-pass/public-desktop-full.png` |
| 공개 홈페이지 mobile 전체 | `docs/visual-qa/screenshots/second-pass/public-mobile-full.png` |
| 모바일 상담 폼 오류 상태 | `docs/visual-qa/screenshots/second-pass/public-inquiry-error-mobile.png` |
| 모바일 상담 폼 완료 상태 | `docs/visual-qa/screenshots/second-pass/public-inquiry-success-mobile.png` |
| 모바일 내부 접근 키 입력 화면 | `docs/visual-qa/screenshots/second-pass/internal-access-mobile.png` |
| 모바일 내부 상태 탭 | `docs/visual-qa/screenshots/second-pass/internal-status-mobile.png` |
| 모바일 내부 콘텐츠 탭 | `docs/visual-qa/screenshots/second-pass/internal-content-mobile.png` |
| 모바일 내부 문의 탭 | `docs/visual-qa/screenshots/second-pass/internal-inquiries-mobile.png` |
| 데스크톱 내부 상태 탭 | `docs/visual-qa/screenshots/second-pass/internal-status-desktop.png` |
| 측정 JSON | `docs/visual-qa/screenshots/second-pass/second-pass-metrics.json` |

---

## 4. 레이아웃 측정 결과

| 화면 | clientWidth | scrollWidth | overflow 요소 |
|---|---:|---:|---:|
| public-desktop-full | 1440 | 1440 | 0 |
| public-mobile-full | 390 | 390 | 0 |
| public-inquiry-error-mobile | 390 | 390 | 0 |
| public-inquiry-success-mobile | 390 | 390 | 0 |
| internal-access-mobile | 390 | 390 | 0 |
| internal-status-mobile | 390 | 390 | 0 |
| internal-content-mobile | 390 | 390 | 0 |
| internal-inquiries-mobile | 390 | 390 | 0 |
| internal-status-desktop | 1440 | 1440 | 0 |

판정:

```text
가로 overflow: PASS
```

---

## 5. 상담 폼 상태 확인

### 5.1 오류 상태

빈 폼 제출 시 다음 메시지가 표시된다.

- 보호자 이름을 입력해 주세요.
- 연락처를 입력해 주세요.
- 학생 학년을 선택해 주세요.
- 관심 과목을 선택해 주세요.
- 문의 내용을 입력해 주세요.
- 개인정보 수집·이용 동의가 필요합니다.
- 입력값을 확인해 주세요.

판정:

```text
상담 폼 오류 상태: PASS
```

메모:

- 오류 메시지는 모바일에서 입력 필드 바로 아래에 표시된다.
- 개인정보 동의 오류가 명확히 보인다.
- 버튼과 오류 메시지가 겹치지 않는다.

### 5.2 접수 완료 상태

QA용 더미 데이터로 상담 문의를 제출했다.

성공 메시지:

```text
상담 신청이 접수되었습니다. 학원에서 확인 후 연락드리겠습니다.
```

판정:

```text
상담 폼 완료 상태: PASS
```

메모:

- 접수 완료 후 폼 값이 초기화된다.
- 성공 메시지는 모바일에서 충분히 읽힌다.
- 실제 개인정보는 사용하지 않았다.

---

## 6. 내부 화면 상태 확인

### 6.1 접근 키 입력 화면

`/internal`에 접근 키 없이 들어가면 내부 데이터가 노출되지 않고, 접근 키 입력 화면만 표시된다.

확인 문구:

- 내부 접근 확인
- 내부 접근 키 입력
- 공개 홈페이지와 상담 문의 제출은 외부에 열려 있고, 내부 현황 확인은 접근 키가 필요합니다.

판정:

```text
내부 접근 키 화면: PASS
```

### 6.2 내부 탭 전환

접근 키 입력 후 다음 탭을 확인했다.

- 상태
- 콘텐츠
- 문의

판정:

```text
내부 탭 전환: PASS
```

메모:

- 모바일 탭은 2열로 접히며 잘림 없이 표시된다.
- 콘텐츠 탭의 준비도, asset 승인 준비도, 콘텐츠 점검 카드가 세로로 안정적으로 배치된다.
- 문의 탭의 검색, 상태, 학년, 과목 필터가 모바일에서 겹치지 않는다.
- QA용 더미 문의가 내부 문의 목록에 노출되는 것을 확인했다.

---

## 7. 발견 사항

시각적 blocker는 없다.

보완 권장:

- 로컬 개발 DB에 이전 테스트 문의가 남아 있어 내부 문의 탭 캡처가 운영 시연용으로는 지저분해 보일 수 있다.
- 실제 파일럿 시연 전에는 개발 DB를 초기화하거나, 통제된 seed 문의만 남기는 것이 좋다.
- 내부 상태 탭의 제작 상태는 로컬 DB 상태를 그대로 반영하므로, 시연 전 의도한 상태값으로 맞춰야 한다.

---

## 8. 최종 판정

```text
2차 시각 QA: PASS
```

근거:

- 9개 캡처 모두 가로 overflow 없음
- 상담 폼 오류 상태 확인
- 상담 폼 완료 상태 확인
- 내부 접근 키 입력 화면 확인
- 내부 콘텐츠/문의 탭 전환 확인
- 모바일 긴 스크롤에서 텍스트와 버튼 겹침 없음

---

## 9. 다음 작업

다음 1순위는 자료 누락 체크와 제작 준비도 강화다.

방향:

- 고객 자료 접수 기록 양식의 필수/권장 항목을 내부 콘텐츠 준비도와 더 직접 연결한다.
- `MATERIALS_READY` 전환 전 부족 항목이 내부 화면에서 더 명확히 보이도록 한다.
- 고객 포털, 고객 계정, 자유 편집기는 계속 보류한다.
