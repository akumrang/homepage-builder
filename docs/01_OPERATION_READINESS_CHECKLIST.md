# 운영 배포 전 점검표

Status: Draft
Project: homepage
Last Updated: 2026-06-27

---

## 1. 목적

이 문서는 homepage MVP를 실제 운영 환경에 올리기 전에 확인해야 할 최소 기준을 정의한다.

현재 범위는 `trust-basic-v1` 샘플 홈페이지, 상담 문의 접수, 공지/문의/제작 상태 내부 관리, Prisma SQLite 저장소까지다. 이 문서는 운영 인프라를 이미 구축했다는 뜻이 아니라, 운영 배포 전에 반드시 확인할 항목을 묵산 내부 기준으로 고정하기 위한 문서다.

실제 배포 순서를 끝까지 재현하는 리허설 절차는 `docs/03_OPERATION_DEPLOYMENT_REHEARSAL_CHECKLIST.md`를 따른다.
로컬 production 시뮬레이션은 `npm.cmd run rehearse:local-production`으로 실행한다.
운영 호스팅과 reverse proxy 구성 기준은 `docs/04_HOSTING_REVERSE_PROXY_PLAN.md`를 따른다.
backend process 운영 기준은 `docs/05_BACKEND_PROCESS_RUNBOOK.md`를 따른다.
운영 로그와 장애 기록 기준은 `docs/06_OPERATION_LOG_AND_INCIDENT_RUNBOOK.md`를 따른다.

---

## 2. 배포 전 필수 명령

운영 반영 전 로컬 또는 CI에서 다음 명령이 통과해야 한다.

```powershell
npm.cmd install
npm.cmd run verify
npm.cmd run build
```

운영 서버 또는 운영 DB 대상에서는 build 이후 migration을 명시적으로 적용한다.

```powershell
$env:NODE_ENV="production"
$env:DATABASE_URL="file:C:/absolute/path/homepage-prod.db"
$env:HOMEPAGE_INTERNAL_ACCESS_TOKEN="replace-with-at-least-32-random-characters"

npm.cmd run db:deploy
npm.cmd --workspace backend run start
```

판정 기준:

- `npm.cmd run verify`가 통과한다.
- `npm.cmd run build`가 통과한다.
- `npm.cmd run db:deploy`가 운영 DB에 migration을 적용한다.
- backend 시작 후 `/api/health`와 `/api/ready`가 정상 응답한다.
- 운영 process manager 또는 수동 lifecycle 리허설에서 start, stop, restart 기준을 통과한다.

---

## 3. 운영 환경 변수

운영에서 반드시 명시할 값:

| 변수 | 필수 | 기준 |
|---|---:|---|
| `NODE_ENV` | 예 | `production` |
| `DATABASE_URL` | 예 | 현재 MVP는 SQLite `file:` URL. 절대 경로 권장 |
| `HOMEPAGE_INTERNAL_ACCESS_TOKEN` | 예 | 운영 전용 32자 이상 비밀값. 저장소, 문서, 채팅에 노출 금지 |
| `HOMEPAGE_CORS_ORIGINS` | 배포 방식에 따라 필요 | frontend와 backend가 다른 origin이면 허용할 frontend origin을 쉼표로 구분 |
| `HOMEPAGE_DB_BACKUP_DIR` | 권장 | 운영 SQLite 백업 파일 저장 위치 |
| `HOST` | 권장 | backend bind host. reverse proxy 운영 기본값은 `127.0.0.1` |
| `PORT` | 권장 | backend 실행 포트. 기본값은 `4200` |
| `VITE_API_BASE_URL` | 배포 방식에 따라 필요 | frontend와 backend를 분리 호스팅할 때 frontend build 전에 지정. production build에서 생략하면 같은 origin의 `/api` 호출 |

운영 금지:

- `HOMEPAGE_INTERNAL_ACCESS_TOKEN` 없이 `NODE_ENV=production`으로 운영
- 개발 기본 내부 키 `muksan-local-dev` 사용
- 운영 내부 접근 키를 32자 미만으로 설정
- `.env` 또는 실제 secret 파일 커밋
- 운영 DB 파일을 배포 산출물 삭제 대상 디렉터리에 저장
- 공개 도메인 배포에서 `HOMEPAGE_CORS_ORIGINS`에 `*` 또는 경로 포함 URL 사용
- reverse proxy 없이 backend `HOST=0.0.0.0`을 public internet에 직접 노출

backend CORS는 `HOMEPAGE_CORS_ORIGINS`가 없으면 개발 환경에서만 `http://localhost:5175`, `http://127.0.0.1:5175`를 기본 허용한다. 비운영 환경에서 `HOMEPAGE_CORS_ORIGINS`를 설정하면 기본 localhost origin에 추가되고, 운영 환경에서는 명시된 origin만 허용된다. 운영 실제 도메인 배포는 다음 둘 중 하나로 처리한다.

- 권장: frontend와 backend를 같은 origin으로 reverse proxy 구성
- 별도 origin: `HOMEPAGE_CORS_ORIGINS`에 허용 origin을 명시

---

## 4. DB와 Migration 기준

현재 MVP DB는 Prisma SQLite다.

운영 기준:

- schema 변경은 `backend/prisma/migrations`에 migration으로 남긴다.
- 운영 DB에는 `prisma db push`를 직접 사용하지 않는다.
- 운영 반영은 `npm.cmd run db:deploy`로만 수행한다.
- `DATABASE_URL`은 운영에서 반드시 명시한다.
- SQLite 파일 경로는 절대 경로를 권장한다.
- DB 파일 위치는 배포 재설치, dist 삭제, 임시 파일 정리의 영향을 받지 않는 디렉터리여야 한다.
- migration 직전에는 `npm.cmd run db:backup`으로 백업을 남긴다.

현재 `db:deploy`는 SQLite `file:` DB가 새 파일인 경우 빈 DB 파일을 먼저 보장한 뒤 migration을 적용한다.

운영 DB 파일 권한:

- backend 프로세스 사용자가 DB 파일을 읽고 쓸 수 있어야 한다.
- DB 파일의 부모 디렉터리도 쓰기 권한이 있어야 한다.
- 백업 프로세스가 읽을 수 있어야 한다.

---

## 5. Health / Readiness Check 기준

현재 health endpoint는 프로세스 생존 확인이다.

```text
GET /api/health
```

현재 응답 기준:

```json
{
  "ok": true,
  "service": "muksan-homepage-backend"
}
```

운영 확인 예:

```powershell
Invoke-RestMethod http://localhost:4200/api/health
```

판정 기준:

- HTTP `200`
- `ok`가 `true`
- `service`가 `muksan-homepage-backend`

현재 readiness endpoint는 운영 준비 상태 확인이다.

```text
GET /api/ready
```

현재 readiness 확인 범위:

- academy seed 로드 여부
- 내부 접근 토큰 설정 안전성
- DB 기본 쿼리 가능 여부
- 홈페이지 상태 store row 수
- 상담 문의 store 접근 가능 여부
- 공지 store 접근 가능 여부

판정 기준:

- 준비 완료: HTTP `200`, `ok: true`
- 준비 미완료: HTTP `503`, `ok: false`

운영 사용 기준:

- 외부 load balancer의 단순 생존 확인은 `/api/health`를 사용한다.
- 배포 직후 traffic 전환 전 준비 상태 확인은 `/api/ready`를 사용한다.
- `/api/ready`가 실패하면 migration, DB 파일 권한, seed 초기화 상태를 먼저 확인한다.
- process manager가 backend를 재시작한 뒤에도 `/api/ready`가 통과해야 traffic을 전환한다.

---

## 5-A. Backend Process 운영 기준

운영 backend는 terminal session에 직접 띄운 일회성 프로세스로 운영하지 않는다.

process manager 또는 동등한 운영 장치는 다음 기준을 만족해야 한다.

- 서버 재부팅 후 backend 자동 시작
- 비정상 종료 시 backend 재시작
- stdout/stderr 로그 보존
- 로그 rotation 또는 보관 기간 정책 적용
- 실행 환경 변수 고정
- 운영자가 stop/start/restart를 명시적으로 수행 가능
- 재시작 후 `/api/health`, `/api/ready` 확인 가능

상세 기준과 로컬 lifecycle 리허설 절차는 `docs/05_BACKEND_PROCESS_RUNBOOK.md`를 따른다.

---

## 6. 공개/내부 화면 운영 확인

운영 게시 전 수동 확인:

- 공개 홈페이지 첫 화면 접속
- 모바일 폭에서 소개, 강사진, 커리큘럼, 공지, 오시는 길, 상담 CTA 확인
- 상담 문의 정상 제출
- 개인정보 수집 동의 미체크 시 제출 차단
- backend 또는 내부 화면에서 문의 접수 확인
- 내부 화면 접근 시 운영 내부 토큰 요구 확인
- 공지 공개/비공개가 공개 홈페이지에 정확히 반영되는지 확인

현재 MVP 기준 주요 경로:

```text
/h/sample-korean-academy
/internal
/api/health
/api/ready
```

---

## 7. DB 백업 기준

SQLite 운영 백업 최소 기준:

- 배포 직전 백업 1회
- 매일 1회 이상 정기 백업
- migration 적용 직전 백업 1회
- 최근 7일 백업 보관
- 월 1회 이상 복구 테스트

백업/복구 상세 절차는 `docs/02_SQLITE_BACKUP_RESTORE_RUNBOOK.md`를 따른다.

백업 파일 관리 기준:

- 백업 파일에는 상담 문의 개인정보가 포함될 수 있으므로 외부 공유 금지
- 운영 DB와 같은 디스크 장애에 동시에 사라지지 않는 위치에 복제
- 백업 파일명에는 서비스명, 날짜, 시각을 포함
- 백업 완료 후 파일 크기 0 byte 여부 확인

권장 파일명 예:

```text
homepage-prod-20260626-230000.db
```

SQLite 백업은 운영 프로세스와 충돌하지 않는 방식으로 수행해야 한다. 단순 파일 복사는 트래픽이 없는 작은 MVP에서는 임시로 허용할 수 있으나, 운영 상담 문의가 발생하는 상태에서는 SQLite online backup 또는 프로세스 일시 중지 후 복사 정책을 정한다.

---

## 8. 장애 대응 기준

최소 장애 대응 기록:

- 장애 발생 시각
- 영향 범위: 공개 홈페이지, 상담 문의, 내부 화면, 공지 중 어느 영역인지
- 마지막 정상 배포 커밋
- 마지막 migration 적용 시각
- 마지막 정상 백업 파일
- 복구 조치
- 재발 방지 항목

초기 복구 우선순위:

1. 공개 홈페이지가 열리는지 확인한다.
2. 상담 문의가 손실 없이 접수되는지 확인한다.
3. 내부 화면에서 문의와 공지를 확인할 수 있는지 확인한다.
4. 운영 DB 백업본으로 복구가 필요한지 판단한다.

장애 기록 양식:

- P1 또는 P2 장애는 `docs/06_OPERATION_LOG_AND_INCIDENT_RUNBOOK.md`의 incident record 양식을 따른다.
- 장애 기록에는 secret, 실제 `.env`, 상담 문의 원문, 보호자 연락처 전체를 붙이지 않는다.
- 장애 종료 전 `/api/health`, `/api/ready`, 공개 route, 테스트 상담 문의 접수를 확인한다.

---

## 9. 현재 구현 근거

| 항목 | 근거 |
|---|---|
| health endpoint | `backend/src/server.ts`의 `GET /api/health` |
| readiness endpoint | `backend/src/server.ts`의 `GET /api/ready` |
| CORS origin 환경 변수화 | `backend/src/server.ts`의 `HOMEPAGE_CORS_ORIGINS` 처리 |
| backend bind host | `backend/src/server.ts`의 `HOST` 처리 |
| 운영 내부 토큰 필수화 | `backend/src/internalAccess.ts` |
| 운영 `DATABASE_URL` 필수화 | `backend/src/prismaClient.ts` |
| Prisma migration | `backend/prisma/migrations/20260626000000_init/migration.sql` |
| SQLite deploy wrapper | `backend/scripts/withPrismaEnv.mjs` |
| SQLite backup script | `backend/scripts/backupSqlite.mjs` |
| SQLite restore script | `backend/scripts/restoreSqlite.mjs` |
| root 배포 명령 | `package.json`의 `db:deploy` |
| backend 배포 명령 | `backend/package.json`의 `db:deploy`, `start` |
| 로컬 production 시뮬레이션 | `package.json`의 `rehearse:local-production` |
| 운영 배포 리허설 | `docs/03_OPERATION_DEPLOYMENT_REHEARSAL_CHECKLIST.md` |
| 호스팅/reverse proxy 구성안 | `docs/04_HOSTING_REVERSE_PROXY_PLAN.md` |
| backend process 운영 런북 | `docs/05_BACKEND_PROCESS_RUNBOOK.md` |
| 운영 로그/장애 기록 런북 | `docs/06_OPERATION_LOG_AND_INCIDENT_RUNBOOK.md` |

---

## 10. 아직 구현이 아닌 항목

이 문서는 다음 항목의 구현 완료를 의미하지 않는다.

- 실제 운영 서버 provision
- HTTPS 인증서와 reverse proxy 설정
- 커스텀 도메인 연결
- 자동 백업 스케줄러
- 운영 로그 수집과 알림 연동
- process manager별 log rotation 설정 파일 자동 생성
- process manager 설정 파일 자동 생성
- 로그인/권한 전체 시스템
