# 브라우저 스크린샷 회귀 테스트 보고서

Status: Draft
Project: homepage
Last Updated: 2026-06-28

---

## 1. 목적

이 문서는 공개 홈페이지와 내부 제작 화면의 핵심 뷰를 브라우저로 열어 스크린샷을 자동 생성하는 회귀 테스트를 기록한다.

기존 상태:

- 1차, 2차 시각 QA는 수동 캡처 중심이었다.
- 레이아웃 변경 후 같은 viewport를 반복 확인하는 명령이 없었다.
- 내부 제작 화면은 접근 키와 내부 API 로딩까지 포함해 확인해야 했다.

이번 보강:

- `npm.cmd run visual:regression` 명령을 추가했다.
- Playwright Chromium으로 desktop/mobile 캡처를 생성한다.
- production build, 임시 SQLite DB, same-origin frontend dist server를 사용한다.
- 주요 문구가 보이지 않거나 내부 데이터가 로드되지 않으면 실패한다.

---

## 2. 구현 범위

변경 파일:

| 파일 | 변경 |
|---|---|
| `package.json` | `visual:regression` script와 `playwright` devDependency 추가 |
| `package-lock.json` | Playwright 의존성 lock 반영 |
| `scripts/captureVisualRegression.mjs` | 브라우저 캡처 자동화 script 추가 |
| `README.md` | 실행 방법과 산출물 위치 기록 |
| `docs/MVP_IMPLEMENTATION_STATUS.md` | 스크린샷 회귀 테스트 완료 상태 반영 |
| `docs/24_SCREENSHOT_REGRESSION_TEST_REPORT.md` | 구현 결과와 검증 산출물 기록 |
| `planning/12_POST_MVP_PRIORITY_REORDER.md` | 다음 우선순위를 배포/migration 정리로 이동 |

---

## 3. 실행 명령

최초 1회 Playwright Chromium이 없으면 다음 명령을 실행한다.

```powershell
npx.cmd playwright install chromium
```

스크린샷 회귀 테스트:

```powershell
npm.cmd run visual:regression
```

이 명령은 다음을 자동 수행한다.

1. `.tmp/visual-regression/<timestamp>/` 아래 임시 작업 폴더를 만든다.
2. 임시 SQLite DB에 `db:deploy`를 적용한다.
3. shared, backend, frontend production build를 실행한다.
4. backend production build를 임시 포트에서 실행한다.
5. frontend dist를 same-origin proxy와 함께 임시 포트에서 실행한다.
6. Chromium으로 공개 홈페이지와 내부 제작 화면을 연다.
7. 핵심 문구가 보이는지 확인하고 스크린샷을 저장한다.
8. backend와 frontend test server를 종료한다.

---

## 4. 캡처 대상

현재 캡처 대상:

| 이름 | 경로 | viewport | 파일 |
|---|---|---|---|
| 공개 홈페이지 desktop | `/h/sample-korean-academy` | `1440 x 1200` | `public-desktop-full.png` |
| 공개 홈페이지 mobile | `/h/sample-korean-academy` | `390 x 844` | `public-mobile-full.png` |
| 내부 접근 키 mobile | `/internal` | `390 x 844` | `internal-access-mobile.png` |
| 내부 상태 탭 desktop | `/internal` | `1440 x 1200` | `internal-status-desktop.png` |
| 내부 상태 탭 mobile | `/internal` | `390 x 844` | `internal-status-mobile.png` |

manifest:

```text
.tmp/visual-regression/<timestamp>/visual-regression-manifest.json
```

스크린샷 산출물은 `.tmp/` 아래에 생성하므로 Git에 커밋하지 않는다.

---

## 5. 실패 조건

다음 중 하나라도 발생하면 명령이 실패한다.

- backend readiness가 `ok: true`가 아니다.
- frontend dist server가 SPA route를 제공하지 못한다.
- 공개 홈페이지에서 `샘플 한빛국어학원` 또는 `상담 문의`가 보이지 않는다.
- 내부 접근 화면에서 `내부 접근 키 입력` 또는 `내부 화면 열기`가 보이지 않는다.
- 내부 상태 화면에서 `홈페이지 내부 제작 화면`, `샘플 학원 목록`, `샘플 한빛국어학원`이 보이지 않는다.
- Playwright Chromium 실행 파일이 없다.

실패 시 해당 화면의 `*-failure.png`를 같은 screenshots 폴더에 남긴다.

---

## 6. 현재 확인 결과

확인 명령:

```powershell
npm.cmd run visual:regression
```

확인 결과:

```text
passed
```

확인 산출물:

```text
.tmp/visual-regression/20260628T071119Z/
```

생성된 주요 파일:

- `screenshots/public-desktop-full.png`
- `screenshots/public-mobile-full.png`
- `screenshots/internal-access-mobile.png`
- `screenshots/internal-status-desktop.png`
- `screenshots/internal-status-mobile.png`
- `visual-regression-manifest.json`

대표 캡처를 직접 확인했다.

- 공개 홈페이지 desktop/mobile은 학원명, 상담 폼, 공지, 오시는 길까지 정상 표시됐다.
- 내부 제작 화면 desktop/mobile은 접근 후 샘플 학원 카드가 로드됐다.

---

## 7. 하지 않은 것

이번 작업에서 하지 않았다.

- 픽셀 단위 screenshot diff
- baseline 이미지 승인 체계
- CI 연동
- 고객별 시각 승인 workflow
- 고객 포털
- 고객용 제한 편집기
- 실제 운영 DB 사용
- 캡처 산출물 Git 커밋

현재 단계의 목적은 반복 가능한 브라우저 캡처와 명확한 smoke 실패 조건이다.

---

## 8. 다음 작업

다음 1순위는 이 변경분을 커밋하고 원격 저장소에 푸시하는 것이다.

커밋 후 다음 추천 작업은 Prisma migration과 배포 환경 정리 상태를 재점검하는 것이다.

이유:

- 시각 회귀 캡처 자동화로 반복 시각 확인의 최소 기반은 생겼다.
- 운영 전에는 migration 적용 순서, production DB 초기화, 배포 문서와 script의 일관성을 다시 확인해야 한다.
- 샘플 갤러리와 고객 선택 기능은 여전히 후속 기획 후보이며 즉시 구현 대상이 아니다.
