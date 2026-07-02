# staging URL 준비 체크리스트

Status: Draft
Project: homepage
Last Updated: 2026-07-01

---

## 1. 목적

이 문서는 첫 파일럿용 외부 공유 URL 방식을 `제한 공개 staging URL 우선`으로 결정한 뒤, 실제 staging 배포 명령을 실행하기 전에 확인해야 할 항목을 정리한다.

현재 실제 고객은 아직 없다.

따라서 이 문서는 staging 배포 실행 문서가 아니라, **staging URL을 준비해도 되는지 판단하는 사전 체크리스트**다.

---

## 2. 현재 결정 상태

| 항목 | 상태 |
|---|---|
| 공개 샘플 홈페이지 시각 방향 | `GO` |
| 외부 공유 URL 방식 | 제한 공개 staging URL 우선 |
| 운영 기준 URL 바로 사용 | 보류 |
| 실제 고객 | 아직 없음 |
| 실제 staging 배포 | 아직 하지 않음 |
| 실제 도메인 | 아직 미정 |
| 실제 고객 발송 | 아직 하지 않음 |

관련 문서:

- `docs/34_LOCAL_DEMO_VISUAL_APPROVAL_RECORD.md`
- `docs/35_FIRST_PILOT_TRANSITION_CHECKLIST.md`
- `docs/36_FIRST_PILOT_EXTERNAL_SHARE_URL_DECISION.md`

---

## 3. staging URL 준비 GO 조건

staging URL 준비를 시작하려면 다음 조건을 먼저 확인한다.

| 조건 | GO 기준 |
|---|---|
| 작업트리 | `git status --short`가 의도한 변경분만 표시하거나 clean |
| 최신 커밋 | `git log -1 --oneline` 확인 |
| 로컬 검증 | `npm.cmd run verify` 통과 |
| 로컬 production 리허설 | `npm.cmd run rehearse:local-production` 통과 |
| 샘플 화면 시각 판정 | `docs/34` 기준 `GO` |
| 외부 공유 방식 결정 | `docs/36` 기준 staging URL 우선 |
| 실제 고객 정보 | 저장소에 없음 |

하나라도 실패하면 staging 배포 준비는 HOLD다.

---

## 4. 도메인과 HTTPS 확인

staging URL에는 고객이 직접 열 수 있는 HTTPS 도메인이 필요하다.

결정해야 할 항목:

| 항목 | 기록 |
|---|---|
| staging 도메인 |  |
| DNS 관리 위치 |  |
| 서버 public IP 또는 target |  |
| HTTPS 인증서 방식 | Caddy 자동 발급 / 기타 |
| 운영 연락 이메일 |  |
| 공개 범위 | 내부 전용 / 첫 파일럿 고객 제한 공유 |

도메인은 별도 문서로 확대하지 않고 여기서만 간단히 관리한다. 후보 예시는 `bettlesystem.com`, `bettlesystem.kr`, `bettle-system.com` 정도로 두며, 실제 구매 가능 여부와 가격은 구매 직전에 확인한다.

금지:

- `localhost`
- `127.0.0.1`
- `5175`, `5176` 같은 로컬 포트 URL
- HTTPS 없는 고객 공유 URL

---

## 5. 서버와 디렉터리 확인

MVP 1차 기준은 Windows 단일 서버다.

필수 경로:

```text
C:/muksan-homepage/app
C:/muksan-homepage/data
C:/muksan-homepage/backups
C:/muksan-homepage/logs
C:/muksan-homepage/runtime
```

확인:

| 항목 | GO 기준 |
|---|---|
| Node.js | 설치됨 |
| Caddy | 설치됨, `caddy version` 실행 가능 |
| Windows Service wrapper | 실행 파일 준비 |
| app 경로 | 배포할 checkout 또는 artifact 존재 |
| data 경로 | checkout 밖 |
| backups 경로 | checkout 밖 |
| logs 경로 | checkout 밖 |
| runtime 경로 | Git에 커밋하지 않는 서버 전용 파일 보관 |

---

## 6. 환경 변수와 secret 확인

staging backend는 production과 같은 보안 기준을 따른다.

필수 환경 변수:

```powershell
NODE_ENV=production
DATABASE_URL=file:C:/muksan-homepage/data/homepage-staging.db
HOMEPAGE_DB_BACKUP_DIR=C:/muksan-homepage/backups
HOMEPAGE_INTERNAL_ACCESS_TOKEN=<32자 이상 staging 전용 비밀값>
HOST=127.0.0.1
PORT=4200
```

기준:

| 항목 | GO 기준 |
|---|---|
| `DATABASE_URL` | staging DB 전용 파일 |
| `HOMEPAGE_INTERNAL_ACCESS_TOKEN` | 32자 이상, 개발 기본 키 금지 |
| `.env` 파일 | 저장소 커밋 금지 |
| runtime XML | 저장소 커밋 금지 |
| DB 파일 | 저장소 커밋 금지 |
| backup/log 파일 | 저장소 커밋 금지 |

---

## 7. Caddy / reverse proxy 확인

staging도 same-origin 구조를 따른다.

기준:

```text
https://<staging-domain>
├─ /h/sample-korean-academy
├─ /assets/*
└─ /api/*
```

확인:

| 항목 | GO 기준 |
|---|---|
| Caddyfile domain | staging 도메인으로 교체 |
| Caddyfile email | 실제 운영 연락 이메일로 교체 |
| `/api/*` | `127.0.0.1:4200` reverse proxy |
| `/assets/*` | `frontend/dist/assets` 정적 제공 |
| SPA fallback | `/h/*`, `/internal` 새로고침 가능 |
| HTTPS | 정상 |
| Caddy validation | PASS |

기준 문서:

- `deploy/windows/Caddyfile.template`
- `docs/04_HOSTING_REVERSE_PROXY_PLAN.md`
- `docs/09_WINDOWS_OPERATION_REHEARSAL_CHECKLIST.md`

---

## 8. build와 DB 준비 확인

staging 배포 전 로컬 또는 서버에서 다음이 통과해야 한다.

```powershell
npm.cmd install
npm.cmd run verify
npm.cmd run build
npm.cmd run db:backup
npm.cmd run db:deploy
```

GO 기준:

| 항목 | GO 기준 |
|---|---|
| `verify` | PASS |
| `build` | PASS |
| `frontend/dist/index.html` | 존재 |
| `backend/dist/server.js` | 존재 |
| `db:backup` | backup과 manifest 생성 |
| `db:deploy` | migration 적용 |

---

## 9. 공개 화면 확인

staging URL 공유 전 브라우저로 확인한다.

확인 URL:

```text
https://<staging-domain>/h/sample-korean-academy
https://<staging-domain>/api/health
https://<staging-domain>/api/ready
```

확인 항목:

| 항목 | GO 기준 |
|---|---|
| desktop 화면 | 깨짐 없음 |
| mobile 화면 | horizontal overflow 없음 |
| 소개/강사진/커리큘럼/공지/오시는 길 | 표시 |
| 상담 폼 | 표시 |
| 개인정보 동의 누락 | 제출 차단 |
| 테스트 문의 제출 | 가짜 정보로만 확인 |
| 완료 메시지 | 표시 |
| `/internal` | 고객에게 공유하지 않음 |
| asset 404 | 없음 |
| mixed content | 없음 |

---

## 10. 고객 공유 전 문구 확인

staging URL을 실제 고객에게 보내게 되는 경우, 링크 위에 다음 성격을 명시한다.

```text
아래 링크는 홈페이지 제작 방향을 확인하기 위한 샘플 미리보기입니다.
아직 고객님 학원의 실제 게시 홈페이지가 아니며, 최종 게시 전에는 별도 확인 절차를 거칩니다.
```

금지:

- 정식 홈페이지라고 안내
- 운영 게시 완료라고 안내
- 고객별 최종 홈페이지라고 안내
- 검수 없이 바로 공개된다고 안내

---

## 11. NO-GO 기준

다음 중 하나라도 있으면 staging URL 준비는 중단한다.

- 실제 고객 정보가 저장소에 들어가야 하는 상황
- staging 도메인이 미정
- HTTPS를 제공할 수 없음
- `verify` 또는 `build` 실패
- `db:backup` 또는 `db:deploy` 실패
- runtime placeholder가 남아 있음
- 내부 접근 토큰이 개발 기본 키 또는 32자 미만
- `/api/ready` 실패
- 공개 샘플 화면이 깨짐
- `/internal`을 고객에게 보여줘야 하는 상황

---

## 12. 도메인 후보 관리

도메인 후보는 이 문서의 짧은 메모로만 관리하고, 별도 문서로 확대하지 않는다.
