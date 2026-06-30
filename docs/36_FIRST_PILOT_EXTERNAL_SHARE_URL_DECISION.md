# 첫 파일럿용 외부 공유 URL 방식 결정

Status: Draft
Project: homepage
Last Updated: 2026-07-01

---

## 1. 목적

이 문서는 묵산 시각 판정에서 공개 샘플 홈페이지가 `GO`를 받은 뒤, 첫 파일럿 고객에게 보여줄 외부 공유 URL 방식을 결정한다.

현재 실제 고객은 아직 없다.

따라서 이 문서는 실제 배포 실행 문서가 아니라, **첫 파일럿에서 어떤 URL 방식을 준비할지 정하는 결정 문서**다.

---

## 2. 결정

첫 파일럿용 외부 공유 URL 방식은 다음으로 결정한다.

```text
제한 공개 staging URL 우선
```

판정:

| 선택지 | 판정 | 이유 |
|---|---|---|
| 화면 공유만 사용 | 보조 수단 | 즉시 가능하지만 고객이 직접 다시 확인할 수 없다. |
| 제한 공개 staging URL | 채택 | 고객이 직접 확인할 수 있고, 운영 전 검수 단계를 분리할 수 있다. |
| 운영 기준 URL 바로 사용 | 보류 | 실제 고객, 도메인, HTTPS, 운영 secret, DB 기준을 모두 확정한 뒤 진행해야 한다. |

즉, 첫 외부 공유는 운영 공개가 아니라 staging 또는 preview 성격의 제한 공개 URL로 준비한다.

---

## 3. 결정 이유

시각 GO 이후 필요한 것은 고객에게 보여줄 수 있는 실제 URL이다.

그러나 바로 운영 URL로 가면 다음 위험이 있다.

- 실제 고객이 아직 없다.
- 운영 도메인과 HTTPS 인증서가 아직 정해지지 않았다.
- 운영 secret과 DB 경로가 아직 실제 서버 기준으로 적용되지 않았다.
- `/internal` 접근 경계와 공개 route를 외부 환경에서 다시 확인해야 한다.
- 고객에게 샘플 링크를 보낼 때 운영 게시 승인으로 오해될 수 있다.

반대로 화면 공유만 사용하면 다음 한계가 있다.

- 고객이 직접 링크를 열어 재확인할 수 없다.
- 자료 요청 문안의 `샘플 홈페이지 링크` 항목을 채울 수 없다.
- 비동기 검토와 내부 피드백 기록이 어렵다.

따라서 첫 파일럿 전환에는 **제한 공개 staging URL**이 가장 적합하다.

---

## 4. staging URL의 성격

staging URL은 다음 성격을 가진다.

| 항목 | 기준 |
|---|---|
| 목적 | 첫 파일럿 고객 또는 내부 검토자가 샘플 홈페이지를 직접 확인 |
| 공개 범위 | 링크를 받은 사람 중심의 제한 공개 |
| 데이터 | 샘플 데이터만 사용 |
| 고객 개인정보 | 사용 금지 |
| 운영 게시 | 아님 |
| 고객별 최종 홈페이지 | 아님 |
| 내부 제작 화면 | 공유 금지 |

staging URL을 고객에게 공유하더라도, 문구상 `샘플 확인용` 또는 `미리보기`임을 명확히 해야 한다.

---

## 5. 권장 URL 구조

실제 도메인은 아직 결정하지 않는다.

권장 구조:

```text
https://<staging-domain>/h/sample-korean-academy
```

예시 placeholder:

```text
https://homepage-staging.example.com/h/sample-korean-academy
```

금지:

```text
http://127.0.0.1:5175/h/sample-korean-academy
http://127.0.0.1:5176/h/sample-korean-academy
http://localhost:5175/h/sample-korean-academy
```

`localhost`, `127.0.0.1`, 임시 로컬 포트는 고객에게 보낼 수 없다.

---

## 6. 기술 기준

staging URL도 운영에 가까운 same-origin 구조를 따른다.

기준:

```text
https://<staging-domain>
├─ /h/sample-korean-academy
├─ /assets/*
└─ /api/*
```

권장 구현:

- frontend는 `frontend/dist` 정적 파일로 제공한다.
- backend는 `HOST=127.0.0.1`, `PORT=4200`으로 실행한다.
- Caddy 또는 reverse proxy가 HTTPS를 받고 `/api/*`를 backend로 proxy한다.
- frontend build에서 `VITE_API_BASE_URL`을 생략해 same-origin `/api`를 사용한다.
- SQLite DB는 checkout 밖 staging data 경로에 둔다.
- 내부 접근 토큰은 32자 이상의 staging 전용 값을 사용한다.

관련 기준:

- `docs/04_HOSTING_REVERSE_PROXY_PLAN.md`
- `docs/07_MVP_PRODUCTION_ENVIRONMENT_DECISION.md`
- `docs/09_WINDOWS_OPERATION_REHEARSAL_CHECKLIST.md`
- `docs/10_WINDOWS_DEPLOYMENT_QUICKSTART.md`

---

## 7. 공유 전 필수 확인

staging URL을 고객 또는 외부 검토자에게 보내기 전에 다음을 확인한다.

| 항목 | 기준 |
|---|---|
| `npm.cmd run verify` | PASS |
| `npm.cmd run rehearse:local-production` | PASS |
| staging `/api/health` | PASS |
| staging `/api/ready` | PASS |
| staging `/h/sample-korean-academy` | PASS |
| mobile/desktop 화면 | PASS |
| 상담 폼 테스트 | PASS, 가짜 정보만 사용 |
| `/internal` 직접 공유 | 금지 |
| 내부 접근 토큰 | 개발 기본 키 사용 금지 |
| 샘플/미리보기 문구 | 명확해야 함 |
| 실제 개인정보 | 없어야 함 |

하나라도 실패하면 staging URL 공유는 HOLD다.

---

## 8. 고객 안내 문구 기준

staging URL을 실제 고객에게 공유하게 되는 경우, 다음처럼 설명한다.

```text
아래 링크는 홈페이지 제작 방향을 확인하기 위한 샘플 미리보기입니다.
아직 고객님 학원의 실제 게시 홈페이지가 아니며, 최종 게시 전에는 별도 확인 절차를 거칩니다.
```

금지 표현:

- 정식 홈페이지가 완성되었습니다.
- 바로 공개되었습니다.
- 이 링크가 고객님의 최종 홈페이지입니다.
- 수정 없이 게시됩니다.

---

## 9. 현재 단계의 보류 사항

아직 하지 않는다.

- 실제 staging 서버 배포
- 실제 도메인 확정
- HTTPS 인증서 발급
- 실제 고객에게 URL 발송
- 고객별 자료 입력
- 운영 게시 전환

이번 결정은 staging URL 방식을 채택하는 것이며, 배포 실행은 다음 작업이다.

---

## 10. 다음 작업

다음 1순위 추천 작업은 첫 파일럿용 외부 공유 URL 방식 결정 변경분 커밋/푸시다.

커밋 후 추천 작업은 staging URL 준비 체크리스트 작성이다. 이 체크리스트는 실제 배포 명령을 실행하기 전, 도메인, HTTPS, reverse proxy, DB 경로, 내부 접근 토큰, 샘플 데이터 상태를 한 번 더 확인하는 문서다.
