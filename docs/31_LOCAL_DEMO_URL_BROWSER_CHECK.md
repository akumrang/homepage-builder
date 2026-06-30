# 로컬 시연 URL 브라우저 확인 보고서

Status: Draft
Project: homepage
Last Updated: 2026-06-30

---

## 1. 목적

이 문서는 파일럿 시연 URL 준비 상태 점검 이후, 실제 브라우저에서 로컬 시연 화면이 열리는지 확인한 기록이다.

확인 대상:

- 공개 샘플 홈페이지 렌더링
- desktop/mobile 기본 레이아웃
- 상담 문의 개인정보 동의 차단
- 테스트 상담 문의 접수
- 내부 제작 화면 접근 경계
- 내부 문의 목록에서 테스트 문의 확인

실제 고객 정보는 사용하지 않았다.

---

## 2. 실행 환경

기준 URL:

| 항목 | 값 |
|---|---|
| backend | `http://localhost:4200` |
| 문서상 frontend 기본 URL | `http://127.0.0.1:5175` |
| 이번 검증에서 실제 사용한 homepage frontend URL | `http://127.0.0.1:5176` |

이번 확인에서 `5175` 포트는 이미 다른 workspace 서버가 점유하고 있었다.

확인된 점유 프로세스:

```text
C:\Users\akumr\Bettle\withgpt\academy\frontend
vite --host 127.0.0.1 --port 5175
```

따라서 homepage frontend는 Vite의 대체 포트인 `5176`에서 실행됐다.

다른 workspace 프로세스는 임의 종료하지 않았다.

---

## 3. CORS 조정

homepage frontend가 `5176`에서 실행되면서 backend 개발 CORS 허용 origin을 임시로 추가했다.

```powershell
$env:HOMEPAGE_CORS_ORIGINS="http://127.0.0.1:5176,http://localhost:5176"
npm.cmd run dev:backend
```

확인 결과:

| 항목 | 결과 |
|---|---|
| `GET /api/health` | PASS |
| `GET /api/ready` | PASS |
| `Origin: http://127.0.0.1:5176` API 요청 | PASS |
| `Access-Control-Allow-Origin` | `http://127.0.0.1:5176` |

---

## 4. 브라우저 검증 결과

Playwright Chromium으로 확인했다.

산출물:

```text
.tmp/local-demo-url-browser-check/20260630T031544Z/
```

생성 파일:

| 파일 | 용도 |
|---|---|
| `result.json` | 검증 결과 JSON |
| `public-desktop-full.png` | desktop 공개 홈페이지 전체 캡처 |
| `public-desktop-after-submit.png` | 상담 문의 접수 후 desktop 캡처 |
| `public-mobile-full.png` | mobile 공개 홈페이지 전체 캡처 |
| `internal-inquiries-after-submit.png` | 내부 문의 목록 확인 캡처 |

체크 결과:

| 항목 | 결과 | 근거 |
|---|---|---|
| backend health/readiness | PASS | `academy-seed`, `database`, `inquiry-store`, `notice-store` 모두 OK |
| desktop 공개 홈페이지 | PASS | `#about`, `#teachers`, `#curriculum`, `#notice`, `#consultation`, `#location` 확인 |
| desktop horizontal overflow | PASS | `innerWidth=1440`, `scrollWidth=1440` |
| 개인정보 동의 누락 제출 차단 | PASS | `#privacy-error` 표시 |
| 테스트 상담 문의 제출 | PASS | 성공 메시지 표시 |
| mobile 공개 홈페이지 | PASS | 주요 section과 mobile action bar 확인 |
| mobile horizontal overflow | PASS | `innerWidth=390`, `scrollWidth=390` |
| 내부 제작 화면 접근 경계 | PASS | 접근 키 입력 화면 먼저 표시 |
| 내부 문의 목록 확인 | PASS | 접근 키 입력 후 테스트 문의 표시 |

테스트 문의:

```text
보호자명: Url Check Parent 031544
연락처: 010-0000-0000
문의 내용: Local demo URL browser check inquiry. This is fake test data only.
```

위 정보는 가짜 테스트 정보다.

---

## 5. 판정

이번 브라우저 확인의 판정:

```text
homepage 로컬 시연 화면: PASS
상담 문의 제출 흐름: PASS
내부 제작 화면 접근 경계: PASS
모바일 기본 레이아웃: PASS
문서상 5175 URL: HOLD
외부 공유 URL: NOT READY
```

중요한 해석:

- homepage 자체는 로컬 브라우저에서 시연 가능한 상태다.
- 다만 현재 PC 상태에서는 `http://127.0.0.1:5175/h/sample-korean-academy`가 homepage가 아니라 academy frontend를 가리킨다.
- 이번 검증은 `http://127.0.0.1:5176/h/sample-korean-academy`에서 수행했다.
- 고객에게 직접 보낼 외부 URL은 아직 없다.
- `/internal`은 접근 키 없이는 내부 화면으로 진입하지 않았다.

---

## 6. 보류 사항

아직 해결하지 않은 항목:

- 5175 포트 충돌을 자동으로 감지하는 시연 전 사전점검
- 포트 충돌 시 README 안내 문구
- frontend dev server를 `--strictPort`로 실패시키는 방식 채택 여부
- 대체 포트를 사용할 때 backend CORS origin을 함께 맞추는 절차

현재처럼 Vite가 자동으로 5176으로 밀리면, 문서상 기본 URL과 실제 검증 URL이 달라진다.

이 상태를 방치하면 묵산이 `5175`를 열었을 때 엉뚱한 화면을 보고 판단할 수 있다.

---

## 7. 다음 작업

다음 1순위 추천 작업은 로컬 시연 포트 충돌 사전점검 절차 추가다.

구체적으로는 다음을 정리한다.

- 시연 전 `5175`, `4200` 포트 점유 프로세스 확인
- `5175`가 homepage workspace가 아니면 즉시 HOLD
- 대체 포트 사용 시 backend CORS origin을 명시
- README의 로컬 시연 URL 안내에 포트 충돌 주의 추가
