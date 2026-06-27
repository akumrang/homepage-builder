# 운영 배포 리허설 체크리스트

Status: Draft
Project: homepage
Last Updated: 2026-06-27

---

## 1. 목적

이 문서는 homepage MVP를 운영 또는 운영에 준하는 staging 환경에 올리기 전에, 실제 배포 순서를 한 번 끝까지 재현하기 위한 체크리스트다.

리허설의 목표는 코드를 더 구현하는 것이 아니라 다음 순서가 운영자 관점에서 끊기지 않는지 확인하는 것이다.

```text
build
→ running backend stop, 기존 운영 서버일 때
→ db:backup
→ db:deploy
→ backend start 또는 process manager start
→ /api/ready 확인
→ frontend dist 배포 확인
```

---

## 2. 리허설 전제

리허설 환경은 실제 운영 DB와 실제 운영 도메인을 직접 건드리지 않는 것을 원칙으로 한다.

필수 전제:

- 최신 커밋 해시를 기록한다.
- working tree가 clean이다.
- 운영에 준하는 `DATABASE_URL`을 별도 리허설 DB로 지정한다.
- `HOMEPAGE_INTERNAL_ACCESS_TOKEN`은 리허설 전용 비밀값을 쓴다.
- frontend와 backend가 다른 origin이면 `HOMEPAGE_CORS_ORIGINS`와 `VITE_API_BASE_URL`을 함께 맞춘다.
- SQLite DB와 backup directory는 배포 산출물 삭제 대상 밖에 둔다.
- process manager 기준은 `docs/05_BACKEND_PROCESS_RUNBOOK.md`를 따른다.
- 로그와 장애 기록 기준은 `docs/06_OPERATION_LOG_AND_INCIDENT_RUNBOOK.md`를 따른다.
- MVP 1차 운영 환경은 `docs/07_MVP_PRODUCTION_ENVIRONMENT_DECISION.md`를 따른다.

권장 리허설 환경 변수 예:

```powershell
$env:NODE_ENV="production"
$env:DATABASE_URL="file:C:/absolute/path/homepage-rehearsal.db"
$env:HOMEPAGE_DB_BACKUP_DIR="C:/absolute/path/homepage-rehearsal-backups"
$env:HOMEPAGE_INTERNAL_ACCESS_TOKEN="rehearsal-private-token-32-chars-min"
$env:HOMEPAGE_CORS_ORIGINS="https://rehearsal-homepage.example.com"
$env:HOST="127.0.0.1"
$env:VITE_API_BASE_URL="https://rehearsal-api.example.com"
```

same-origin reverse proxy로 production build를 리허설하면 `VITE_API_BASE_URL`은 생략할 수 있다. 이 경우 frontend는 같은 origin의 `/api`를 호출한다.

---

## 3. 로컬 production 시뮬레이션

실제 서버에 올리기 전에 로컬에서 리허설 흐름을 자동으로 확인할 수 있다.

```powershell
npm.cmd run rehearse:local-production
```

이 명령은 다음을 수행한다.

1. `.tmp/local-production-rehearsal` 아래 리허설 전용 SQLite DB와 backup directory를 만든다.
2. baseline migration을 적용해 백업 가능한 DB 상태를 만든다.
3. `npm.cmd run build`를 실행한다.
4. `frontend/dist/index.html`과 asset bundle을 확인한다.
5. production frontend bundle에 `http://localhost:4200` 개발 API base가 남아 있지 않은지 확인한다.
6. `npm.cmd run db:backup`을 실행하고 backup과 manifest를 확인한다.
7. `npm.cmd run db:deploy`를 다시 실행한다.
8. production build 산출물로 backend를 시작한다.
9. `/api/health`, `/api/ready`, `/api/academies/sample-korean-academy`를 확인한다.
10. `frontend/dist`를 로컬 정적 서버로 열고 `/h/sample-korean-academy`와 같은 origin `/api/ready` 프록시를 확인한다.
11. 종료 시 backend process를 정리해 port가 남지 않도록 한다.

이 시뮬레이션은 실제 운영 도메인, HTTPS, reverse proxy, 정적 파일 업로드를 대신하지 않는다. 실제 호스팅과 reverse proxy 구성 기준은 `docs/04_HOSTING_REVERSE_PROXY_PLAN.md`를 따른다.

---

## 4. 리허설 기록 양식

리허설마다 다음 값을 남긴다.

| 항목 | 기록 |
|---|---|
| 리허설 일시 |  |
| 실행자 |  |
| 커밋 해시 |  |
| DB 경로 |  |
| backup directory |  |
| frontend 배포 위치 |  |
| backend 실행 포트 |  |
| process manager 또는 실행 방식 |  |
| reverse proxy | Caddy / 기타 |
| backend log 위치 |  |
| log rotation 기준 |  |
| 결과 | GO / NO-GO |
| 비고 |  |

커밋 해시 확인:

```powershell
git log -1 --oneline
git status --short
```

`git status --short`에 의도하지 않은 변경이 있으면 리허설을 중단한다.

---

## 5. Step 1: Build

명령:

```powershell
npm.cmd install
npm.cmd run verify
npm.cmd run build
```

판정 기준:

- `verify` 통과
- backend TypeScript build 통과
- frontend production build 통과
- `frontend/dist/index.html` 존재
- `frontend/dist/assets` 존재

확인 명령:

```powershell
Test-Path frontend/dist/index.html
Test-Path frontend/dist/assets
```

실패 시:

- 배포 리허설 중단
- 실패 로그와 커밋 해시 기록
- DB 관련 명령을 진행하지 않음

---

## 6. Step 2: DB Backup

명령:

```powershell
npm.cmd run db:backup -- --label homepage-rehearsal
```

판정 기준:

- `.db` 백업 파일 생성
- `.db.manifest.json` 생성
- byte size가 `0`보다 큼
- SHA256 출력 확인

주의:

- SQLite `-wal`, `-shm`, `-journal` 동반 파일이 있으면 script가 중단한다.
- 중단되면 backend 프로세스가 떠 있는지 확인하고, 필요하면 중지 후 다시 실행한다.

실패 시:

- `db:deploy` 진행 금지
- backup directory 권한, DB 경로, 동반 파일 존재 여부 확인

---

## 7. Step 3: DB Migration

명령:

```powershell
npm.cmd run db:deploy
```

판정 기준:

- Prisma migration이 오류 없이 적용된다.
- 새 SQLite 리허설 DB라면 migration table과 초기 테이블이 생성된다.
- 기존 리허설 DB라면 적용할 migration이 없거나 새 migration만 적용된다.

실패 시:

- backend start 금지
- 방금 만든 backup으로 dry-run restore 확인
- migration 오류 로그 보존
- 리허설 결과는 `NO-GO`

---

## 8. Step 4: Backend Process Start

명령:

```powershell
npm.cmd --workspace backend run start
```

별도 프로세스 매니저를 쓰는 환경에서는 같은 env를 전달해 backend를 시작한다.

판정 기준:

- backend process가 종료되지 않는다.
- 설정된 `HOST`와 `PORT` 또는 기본 `127.0.0.1:4200`에서 응답한다.
- 로그에 초기화 실패가 없다.
- process manager를 쓰는 환경에서는 상태가 running이다.
- stdout/stderr 로그 위치가 확인된다.
- log directory가 checkout 삭제 대상 밖에 있다.

확인 명령:

```powershell
Invoke-RestMethod http://localhost:4200/api/health
```

실패 시:

- backend process 종료
- `DATABASE_URL`, migration 적용 여부, 파일 권한 확인
- 리허설 결과는 `NO-GO`

---

## 8-A. Step 4-A: Process Lifecycle 확인

process manager 등록 전 또는 등록 직후에는 start만 확인하지 않고 stop/restart까지 확인한다.

판정 기준:

- stop 후 backend port가 응답하지 않는다.
- restart 후 `/api/health`와 `/api/ready`가 다시 통과한다.
- restart 과정에서 DB lock, migration 오류, seed 로드 오류가 없다.
- 로그가 운영 log directory 또는 process manager log에 남는다.
- 로그 rotation 또는 보관 기간 정책이 확인된다.

로컬 수동 절차는 `docs/05_BACKEND_PROCESS_RUNBOOK.md`의 로컬 process lifecycle 리허설을 따른다.

MVP 1차 운영에서는 Windows Service wrapper 기준으로 service start, service stop, service restart를 확인한다.

실패 시:

- traffic 전환 금지
- process manager 설정, working directory, 환경 변수, 로그 권한 확인
- 리허설 결과는 `NO-GO`

---

## 9. Step 5: Readiness 확인

명령:

```powershell
Invoke-RestMethod http://localhost:4200/api/ready
```

판정 기준:

- HTTP `200`
- `ok: true`
- checks에 다음 항목이 포함된다.

```text
academy-seed
internal-access-token
database
homepage-state-store
inquiry-store
notice-store
```

실패 시:

- traffic 전환 금지
- `/api/ready` 응답의 실패 check 확인
- migration, DB 파일 권한, seed row 수 확인
- 리허설 결과는 `NO-GO`

---

## 10. Step 6: Frontend Dist 배포 확인

확인 대상:

- `frontend/dist/index.html`
- `frontend/dist/assets/*`
- 공개 홈페이지 경로
- 내부 화면 경로

정적 파일 배포 후 확인:

```text
/h/sample-korean-academy
/internal
```

판정 기준:

- 공개 홈페이지 첫 화면이 열린다.
- CSS와 JS asset이 404 없이 로드된다.
- 상담 신청 폼이 표시된다.
- `/internal` 접근 화면이 표시된다.
- frontend가 backend API base URL을 올바르게 호출한다.

same-origin reverse proxy 배포 확인:

- frontend 정적 파일과 backend API가 같은 origin에서 제공된다.
- `/api/health`, `/api/ready`가 proxy를 통해 열린다.

분리 origin 배포 확인:

- frontend build 전에 `VITE_API_BASE_URL`이 올바르게 설정되어 있다.
- backend `HOMEPAGE_CORS_ORIGINS`에 frontend origin이 포함되어 있다.
- 브라우저 개발자 도구에 CORS 오류가 없다.

실패 시:

- 정적 파일 배포 위치, reverse proxy, `VITE_API_BASE_URL`, `HOMEPAGE_CORS_ORIGINS`를 순서대로 확인
- 리허설 결과는 `NO-GO`

---

## 11. 상담 문의 Smoke 확인

리허설 환경에서 개인정보가 아닌 테스트 데이터로 상담 문의를 1건 접수한다.

테스트 데이터 기준:

- 보호자 이름: `리허설테스트`
- 연락처: `010-0000-0000`
- 학생 학년: 임의 테스트 학년
- 관심 과목: 임의 테스트 과목
- 문의 내용: `운영 리허설 테스트 문의입니다.`
- 개인정보 동의: 체크

판정 기준:

- 공개 홈페이지에서 접수 완료 메시지가 보인다.
- 내부 화면 문의 목록에서 테스트 문의를 확인할 수 있다.
- 테스트 문의를 `CHECKED`로 변경할 수 있다.

주의:

- 실제 개인정보를 쓰지 않는다.
- 리허설 DB에서만 수행한다.

---

## 12. GO / NO-GO 판정

GO 조건:

- `npm.cmd run verify` 통과
- `npm.cmd run build` 통과
- `db:backup` 성공
- `db:deploy` 성공
- `/api/health` 성공
- `/api/ready` 성공
- frontend dist 경로 확인
- 공개 홈페이지와 내부 화면 확인
- 테스트 상담 문의 접수와 내부 확인 성공

NO-GO 조건:

- DB backup 실패
- migration 실패
- `/api/ready` 실패
- frontend asset 404 발생
- CORS 오류 발생
- 상담 문의 접수 실패
- 내부 화면에서 문의 확인 실패

NO-GO 시에는 운영 반영을 중단하고, 실패 단계와 로그를 기록한다.

P1 또는 P2 수준의 리허설 실패는 `docs/06_OPERATION_LOG_AND_INCIDENT_RUNBOOK.md`의 장애 기록 양식으로 남긴다.

---

## 13. Rollback 기준

리허설 중 migration 이후 문제가 발견되면 다음 순서로 복구한다.

1. backend 프로세스를 중지한다.
2. `db:backup`으로 만든 백업 파일을 확인한다.
3. restore dry-run을 실행한다.
4. `--force`로 리허설 DB를 복구한다.
5. backend를 다시 시작한다.
6. `/api/ready`를 확인한다.

명령 예:

```powershell
npm.cmd run db:restore -- --backup C:/absolute/path/homepage-rehearsal-backups/homepage-rehearsal-YYYYMMDDTHHMMSSZ.db
npm.cmd run db:restore -- --backup C:/absolute/path/homepage-rehearsal-backups/homepage-rehearsal-YYYYMMDDTHHMMSSZ.db --force
```

---

## 14. 현재 한계

이 체크리스트는 운영 리허설 절차를 고정하지만, 다음을 자동화하지는 않는다.

- 실제 서버 provision
- HTTPS 인증서 발급
- reverse proxy 설정 파일 생성
- frontend 정적 파일 업로드
- 프로세스 매니저 등록
- 외부 모니터링과 알림
- 백업 파일 외부 스토리지 업로드
